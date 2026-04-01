/// <reference types="node" />
/**
 * Headless game simulation for balance testing.
 *
 * Simulates an active player using the real game engine. The AI follows
 * a simple gather→craft→explore loop, fast-forwarding time by each
 * action's duration and applying completions via processTick.
 *
 * Usage:
 *   npx tsx scripts/simulate.ts              # run simulation, print report
 *   npx tsx scripts/simulate.ts --json       # output JSON for CI
 *   npx tsx scripts/simulate.ts --runs 10    # average over N runs (RNG smoothing)
 */

import { createInitialState } from "../src/engine/gameState";
import {
  addResource,
  canAffordInput,
  getEffectiveInputs,
  canAffordTagInputs,
  hasVessel,
  getTotalFood,
  getTotalWater,
  isAtStorageCap,
  getStorageLimit,
  getMoraleDurationMultiplier,
  getToolSpeedMultiplier,
} from "../src/engine/gameState";
import { processTick } from "../src/engine/tick";
import {
  selectAvailableActions,
  selectAvailableRecipes,
  selectAvailableExpeditions,
  selectAvailableStations,
} from "../src/engine/selectors";
import {
  getStationById,
} from "../src/data/registry";
import { getDurationMultiplier } from "../src/data/milestones";
import { getStationInputAmount } from "../src/data/milestones";
import { levelFromXp } from "../src/data/skills";
import type { GameState, ActionDef, RecipeDef, ExpeditionDef } from "../src/data/types";

// ═══════════════════════════════════════
// Benchmark tracking
// ═══════════════════════════════════════

export interface SimBenchmarks {
  timeToVictoryS: number;
  vessels: { raft: number | null; dugout: number | null; outrigger_canoe: number | null };
  biomes: Record<string, number>;
  skillMilestones: { firstLevel10: number | null; firstLevel15: number | null; firstLevel20: number | null };
  skillLevels: Record<string, number>;
  totalDecisions: number;
}

// ═══════════════════════════════════════
// Fast action execution
// ═══════════════════════════════════════

/** Clamped morale multiplier — prevents negative durations at extreme morale. */
function clampedMorale(morale: number): number {
  return Math.max(0.1, getMoraleDurationMultiplier(Math.min(morale, 150)));
}

/** Get effective duration of a gather action in ms. */
function getGatherDuration(state: GameState, action: ActionDef): number {
  const skill = state.skills[action.skillId];
  const milestone = getDurationMultiplier(action.skillId, skill.level, action.id);
  const tool = getToolSpeedMultiplier(state, action.id);
  return Math.max(100, Math.round(action.durationMs * milestone * clampedMorale(state.morale) * tool));
}

/** Get effective duration of a craft recipe in ms. */
function getCraftDuration(state: GameState, recipe: RecipeDef): number {
  const skill = state.skills[recipe.skillId];
  const milestone = getDurationMultiplier(recipe.skillId, skill?.level ?? 1, recipe.id);
  const tool = getToolSpeedMultiplier(state, recipe.id);
  return Math.max(100, Math.round(recipe.durationMs * milestone * clampedMorale(state.morale) * tool));
}

/** Get effective duration of an expedition in ms. */
function getExpeditionDuration(state: GameState, exp: ExpeditionDef): number {
  const skill = state.skills[exp.skillId];
  const milestone = getDurationMultiplier(exp.skillId, skill?.level ?? 1, exp.id);
  return Math.max(100, Math.round(exp.durationMs * milestone * clampedMorale(state.morale)));
}

/**
 * Run a gather action N times by fast-forwarding time and using processTick.
 * Returns the time consumed in ms.
 */
function runGather(state: GameState, action: ActionDef, maxCycles: number): number {
  const dur = getGatherDuration(state, action);
  const totalMs = dur * maxCycles;
  state.currentAction = {
    actionId: action.id, startedAt: state.lastTickAt, type: "gather", fullAtStart: [],
  };
  state.repetitiveActionCount = 0;
  state.stopWhenFull = true;
  processTick(state, state.lastTickAt + totalMs);
  return totalMs;
}

/**
 * Run a craft recipe repeatedly by fast-forwarding time.
 * Returns the time consumed in ms.
 */
function runCraft(state: GameState, recipe: RecipeDef, maxCycles: number): number {
  const dur = getCraftDuration(state, recipe);
  const totalMs = dur * maxCycles;
  state.currentAction = {
    actionId: recipe.id, startedAt: state.lastTickAt, type: "craft",
    recipeId: recipe.id, fullAtStart: [],
  };
  state.repetitiveActionCount = 0;
  processTick(state, state.lastTickAt + totalMs);
  return totalMs;
}

/**
 * Run an expedition N times by fast-forwarding time.
 * Returns the time consumed in ms.
 */
function runExpedition(state: GameState, exp: ExpeditionDef, maxCycles: number): number {
  const dur = getExpeditionDuration(state, exp);
  const totalMs = dur * maxCycles;
  state.currentAction = {
    actionId: exp.id, startedAt: state.lastTickAt, type: "expedition",
    expeditionId: exp.id,
  };
  state.repetitiveActionCount = 0;
  processTick(state, state.lastTickAt + totalMs);
  return totalMs;
}

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function canStartExpedition(state: GameState, exp: ExpeditionDef): boolean {
  if (exp.requiredVessel && !hasVessel(state, exp.requiredVessel)) return false;
  if (exp.foodCost && getTotalFood(state) < exp.foodCost) return false;
  if (exp.waterCost && getTotalWater(state) < exp.waterCost) return false;
  if (exp.inputs?.some((i) => (state.resources[i.resourceId] ?? 0) < i.amount)) return false;
  return true;
}

function canAffordRecipe(state: GameState, r: RecipeDef): boolean {
  const inputs = getEffectiveInputs(r, state);
  if (!inputs.every((i) => canAffordInput(i, state))) return false;
  if (r.tagInputs && !canAffordTagInputs(r.tagInputs, state)) return false;
  // Don't craft if output already at cap (wastes inputs on probabilistic gathers)
  if (r.output && isAtStorageCap(state, r.output.resourceId)) return false;
  return true;
}

function gatherHasRoom(state: GameState, action: ActionDef): boolean {
  return action.drops.some((d) => (d.chance ?? 1) > 0 && !isAtStorageCap(state, d.resourceId));
}

function handleStations(state: GameState): void {
  // Collect ready
  for (const s of [...state.stations]) {
    const def = getStationById(s.stationId);
    if (!def || state.lastTickAt < s.deployedAt + def.durationMs) continue;
    for (const drop of def.yields) {
      if (Math.random() < (drop.chance ?? 1)) {
        addResource(state, drop.resourceId, drop.amount);
        if (!state.discoveredResources.includes(drop.resourceId))
          state.discoveredResources.push(drop.resourceId);
      }
    }
    const skill = state.skills[def.skillId];
    if (skill) { skill.xp += def.xpGain; skill.level = levelFromXp(skill.xp); }
    state.stations.splice(state.stations.indexOf(s), 1);
  }

  // Deploy available
  for (const station of selectAvailableStations(state)) {
    const deployed = state.stations.filter((s) => s.stationId === station.id).length;
    let maxSlots = station.maxDeployed ?? 1;
    if (station.maxDeployedPerBuildings)
      maxSlots = station.maxDeployedPerBuildings.reduce(
        (sum, bid) => sum + state.buildings.filter((b) => b === bid).length, 0
      );
    if (deployed >= maxSlots) continue;
    if (station.setupInputs) {
      const lvl = state.skills[station.skillId]?.level ?? 1;
      let ok = true;
      for (const inp of station.setupInputs) {
        if ((state.resources[inp.resourceId] ?? 0) < getStationInputAmount(station.skillId, lvl, station.id, inp.resourceId, inp.amount))
          { ok = false; break; }
      }
      if (!ok) continue;
      for (const inp of station.setupInputs) {
        const amt = getStationInputAmount(station.skillId, lvl, station.id, inp.resourceId, inp.amount);
        state.resources[inp.resourceId] = (state.resources[inp.resourceId] ?? 0) - amt;
      }
    }
    state.stations.push({ stationId: station.id, deployedAt: state.lastTickAt });
  }
}

// ═══════════════════════════════════════
// AI: gather → craft → explore loop
// ═══════════════════════════════════════

/**
 * Run one full cycle: gather all → craft all → explore.
 * Returns total ms consumed.
 */
function runOneCycle(state: GameState, bm: SimBenchmarks): number {
  let elapsed = 0;

  handleStations(state);

  // 1. Gather each available action (up to ~10 cycles each = fill storage)
  const actions = selectAvailableActions(state);
  for (const action of actions) {
    if (!gatherHasRoom(state, action)) continue;
    const limit = Math.max(...action.drops.map((d) => getStorageLimit(state, d.resourceId)));
    const maxAmt = Math.max(1, ...action.drops.filter(d => (d.chance ?? 1) > 0).map((d) => d.amount));
    const cycles = Math.min(50, Math.max(1, Math.ceil(limit / maxAmt)));
    elapsed += runGather(state, action, cycles);
    state.currentAction = null;
    bm.totalDecisions++;
    checkCompletions(state, bm);
    if (_debug && bm.totalDecisions <= 5) console.log(`  gather ${action.id} x${cycles} → ${state.lastTickAt/1000}s`);
  }

  // Cap morale to prevent negative duration bugs in processTick
  if (state.morale > 150) state.morale = 150;

  // 2. Craft: loop until nothing more can be crafted (with safety limit)
  let crafted = true;
  let craftIters = 0;
  while (crafted && craftIters < 200) {
    crafted = false;
    craftIters++;
    const recipes = selectAvailableRecipes(state);

    // One-time crafts first (tools, unique buildings)
    for (const r of recipes) {
      if ((r.oneTimeCraft || r.toolOutput || (r.buildingOutput && !r.repeatable)) && canAffordRecipe(state, r)) {
        elapsed += runCraft(state, r, 1);
        state.currentAction = null;
        bm.totalDecisions++;
        crafted = true;
        checkCompletions(state, bm);
        break; // restart loop (new recipes may unlock)
      }
    }
    if (crafted) continue;

    // Repeatable crafts (process chains: run each once, then loop)
    for (const r of recipes) {
      if (r.repeatable && canAffordRecipe(state, r)) {
        // Run enough cycles to exhaust inputs
        const inputs = getEffectiveInputs(r, state);
        const maxCycles = Math.min(100, ...inputs.map((i) =>
          Math.floor((state.resources[i.resourceId] ?? 0) / i.amount)
        ));
        if (maxCycles > 0) {
          elapsed += runCraft(state, r, maxCycles);
          state.currentAction = null;
          bm.totalDecisions++;
          crafted = true;
          checkCompletions(state, bm);
          break;
        }
      }
    }
    if (crafted) continue;

    // Non-repeatable output crafts
    for (const r of recipes) {
      if (!r.repeatable && canAffordRecipe(state, r)) {
        elapsed += runCraft(state, r, 1);
        state.currentAction = null;
        bm.totalDecisions++;
        crafted = true;
        checkCompletions(state, bm);
        break;
      }
    }
  }

  // 3. Explore: run each affordable expedition once
  const expeditions = selectAvailableExpeditions(state);
  for (const exp of expeditions) {
    if (!canStartExpedition(state, exp)) continue;
    // Run as many cycles as we can afford
    const foodCycles = exp.foodCost ? Math.floor(getTotalFood(state) / exp.foodCost) : 999;
    const waterCycles = exp.waterCost ? Math.floor(getTotalWater(state) / exp.waterCost) : 999;
    const inputCycles = exp.inputs
      ? Math.min(...exp.inputs.map((i) => Math.floor((state.resources[i.resourceId] ?? 0) / i.amount)))
      : 999;
    const cycles = Math.max(1, Math.min(foodCycles, waterCycles, inputCycles, 20));
    elapsed += runExpedition(state, exp, cycles);
    state.currentAction = null;
    bm.totalDecisions++;
    checkCompletions(state, bm);
  }

  return elapsed;
}

/** Scan state for benchmarks. Called after each action batch. */
function checkCompletions(state: GameState, bm: SimBenchmarks): void {
  const t = state.lastTickAt;
  // Biomes
  for (const b of state.discoveredBiomes) {
    if (!bm.biomes[b]) bm.biomes[b] = t / 1000;
  }
  // Vessels
  if (state.buildings.includes("raft") && !bm.vessels.raft) bm.vessels.raft = t / 1000;
  if (state.buildings.includes("dugout") && !bm.vessels.dugout) bm.vessels.dugout = t / 1000;
  if (state.buildings.includes("outrigger_canoe") && !bm.vessels.outrigger_canoe) bm.vessels.outrigger_canoe = t / 1000;
  // Skills
  for (const [, s] of Object.entries(state.skills)) {
    if (s.level >= 10 && !bm.skillMilestones.firstLevel10) bm.skillMilestones.firstLevel10 = t / 1000;
    if (s.level >= 15 && !bm.skillMilestones.firstLevel15) bm.skillMilestones.firstLevel15 = t / 1000;
    if (s.level >= 20 && !bm.skillMilestones.firstLevel20) bm.skillMilestones.firstLevel20 = t / 1000;
  }
  // Victory
  if (state.victory && bm.timeToVictoryS < 0) bm.timeToVictoryS = t / 1000;
}

// ═══════════════════════════════════════
// Simulation runner
// ═══════════════════════════════════════

const MAX_TIME = 48 * 60 * 60 * 1000;
let _debug = false;

export function runSimulation(seed?: number): SimBenchmarks {
  if (seed !== undefined) seedRandom(seed);

  const state = createInitialState();
  state.lastTickAt = 0;

  const bm: SimBenchmarks = {
    timeToVictoryS: -1,
    vessels: { raft: null, dugout: null, outrigger_canoe: null },
    biomes: {},
    skillMilestones: { firstLevel10: null, firstLevel15: null, firstLevel20: null },
    skillLevels: {},
    totalDecisions: 0,
  };

  for (const b of state.discoveredBiomes) bm.biomes[b] = 0;

  let prevBuildings = 0;
  let stuckCount = 0;

  let outerIters = 0;
  while (state.lastTickAt < MAX_TIME && !state.victory) {
    outerIters++;
    // Progress tracking for long sims
    if (outerIters > 50000) { console.log("STUCK: too many outer iterations"); break; }
    const before = state.lastTickAt;
    runOneCycle(state, bm);
    const after = state.lastTickAt;

    if (_debug && state.buildings.length > prevBuildings) {
      const newB = state.buildings.slice(prevBuildings);
      console.log(`  [${formatTime(after / 1000)}] BUILT: ${newB.join(", ")} | tools: ${state.tools.join(", ")}`);
      prevBuildings = state.buildings.length;
    }

    // Detect stuck loops (no time progress)
    if (after === before) {
      stuckCount++;
      if (stuckCount > 10) {
        // Force time forward to avoid infinite loops
        state.lastTickAt += 1000;
        stuckCount = 0;
      }
    } else {
      stuckCount = 0;
    }
  }

  for (const [id, s] of Object.entries(state.skills)) bm.skillLevels[id] = s.level;
  return bm;
}

// ═══════════════════════════════════════
// Seedable RNG
// ═══════════════════════════════════════

const _origRandom = Math.random;
function seedRandom(seed: number): void {
  const g = ((s: number) => () => { s |= 0; s = s + 0x9e3779b9 | 0; let t = s ^ (s >>> 16); t = Math.imul(t, 0x21f0aaad); t = t ^ (t >>> 15); t = Math.imul(t, 0x735a2d97); return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296; })(seed);
  let s0 = (g() * 2 ** 32) >>> 0, s1 = (g() * 2 ** 32) >>> 0, s2 = (g() * 2 ** 32) >>> 0, s3 = (g() * 2 ** 32) >>> 0;
  Math.random = () => { const r = (((s1 * 5) << 7 | (s1 * 5) >>> 25) * 9) >>> 0; const u = s1 << 9; s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3; s2 ^= u; s3 = (s3 << 11 | s3 >>> 21); return r / 4294967296; };
}
function resetRandom(): void { Math.random = _origRandom; }

// ═══════════════════════════════════════
// Multi-run averaging & formatting
// ═══════════════════════════════════════

function averageBenchmarks(runs: SimBenchmarks[]): SimBenchmarks {
  const n = runs.length;
  const avg: SimBenchmarks = { timeToVictoryS: 0, vessels: { raft: null, dugout: null, outrigger_canoe: null }, biomes: {}, skillMilestones: { firstLevel10: null, firstLevel15: null, firstLevel20: null }, skillLevels: {}, totalDecisions: 0 };
  for (const r of runs) { if (r.timeToVictoryS > 0) avg.timeToVictoryS += r.timeToVictoryS / n; avg.totalDecisions += r.totalDecisions / n; }
  for (const k of ["raft", "dugout", "outrigger_canoe"] as const) { const v = runs.map((r) => r.vessels[k]).filter((x): x is number => x !== null); avg.vessels[k] = v.length > 0 ? v.reduce((a, b) => a + b, 0) / v.length : null; }
  for (const b of new Set(runs.flatMap((r) => Object.keys(r.biomes)))) { const v = runs.map((r) => r.biomes[b]).filter((x): x is number => x !== undefined); avg.biomes[b] = v.length > 0 ? v.reduce((a, b2) => a + b2, 0) / v.length : 0; }
  for (const k of ["firstLevel10", "firstLevel15", "firstLevel20"] as const) { const v = runs.map((r) => r.skillMilestones[k]).filter((x): x is number => x !== null); avg.skillMilestones[k] = v.length > 0 ? v.reduce((a, b) => a + b, 0) / v.length : null; }
  for (const s of new Set(runs.flatMap((r) => Object.keys(r.skillLevels)))) { const v = runs.map((r) => r.skillLevels[s]).filter((x): x is number => x !== undefined); avg.skillLevels[s] = v.length > 0 ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; }
  return avg;
}

function formatTime(s: number | null): string {
  if (s === null || s < 0) return "never";
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m ${sec}s` : `${m}m ${sec}s`;
}

function printReport(bm: SimBenchmarks): void {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║     SeaBound Simulation Report           ║");
  console.log("╚══════════════════════════════════════════╝\n");
  console.log("VESSEL PROGRESSION");
  console.log(`  Raft:             ${formatTime(bm.vessels.raft)}`);
  console.log(`  Dugout Canoe:     ${formatTime(bm.vessels.dugout)}`);
  console.log(`  Outrigger Canoe:  ${formatTime(bm.vessels.outrigger_canoe)}`);
  console.log(`  Victory:          ${formatTime(bm.timeToVictoryS)}`);
  console.log("\nBIOME DISCOVERY");
  for (const [b, t] of Object.entries(bm.biomes).sort((a, c) => a[1] - c[1]))
    console.log(`  ${b.padEnd(20)} ${formatTime(t)}`);
  console.log("\nSKILL MILESTONES");
  console.log(`  First skill lvl 10:  ${formatTime(bm.skillMilestones.firstLevel10)}`);
  console.log(`  First skill lvl 15:  ${formatTime(bm.skillMilestones.firstLevel15)}`);
  console.log(`  First skill lvl 20:  ${formatTime(bm.skillMilestones.firstLevel20)}`);
  console.log("\nFINAL SKILL LEVELS");
  for (const [s, l] of Object.entries(bm.skillLevels).sort()) console.log(`  ${s.padEnd(16)} ${l}`);
  console.log(`\nTotal AI decisions: ${Math.round(bm.totalDecisions)}\n`);
}

// ═══════════════════════════════════════
// CLI
// ═══════════════════════════════════════

function main(): void {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  _debug = args.includes("--debug");
  const ri = args.indexOf("--runs");
  const n = ri >= 0 ? parseInt(args[ri + 1], 10) : 5;
  if (!json) console.log(`Running ${n} simulation(s)...`);
  const results: SimBenchmarks[] = [];
  for (let i = 0; i < n; i++) {
    if (!json && n > 1) process.stdout.write(`  Run ${i + 1}/${n}...`);
    const r = runSimulation(42 + i);
    results.push(r);
    resetRandom();
    if (!json && n > 1) console.log(` victory at ${formatTime(r.timeToVictoryS)}`);
  }
  const avg = n === 1 ? results[0] : averageBenchmarks(results);
  if (json) { console.log(JSON.stringify(avg, null, 2)); }
  else { if (n > 1) console.log(`\nAveraged over ${n} runs:`); printReport(avg); }
}

if (process.argv[1]?.endsWith("scripts/simulate.ts")) main();
