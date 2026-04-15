/**
 * D2-inspired round-based combat simulation for mainland expeditions.
 *
 * Instead of independent stat checks, combat plays out as a round-by-round fight:
 * - Player and enemy trade hits based on attack speed
 * - Offense deals damage reduced by enemy defense
 * - Enemy damage is split by type (physical/heat/cold/wet), each reduced by matching stat
 * - Speed grants dodge chance, endurance grants damage reduction
 * - Crit chance/multiplier can spike player damage
 * - Win by reducing enemy HP to 0; lose if player HP hits 0 or combat times out
 *
 * Stat scaling uses diminishing-returns formulas:
 *   reduction = stat * SCALE / (stat * SCALE + 100)
 * so stacking stats is always beneficial but never reaches 100%.
 */

import { getCombatStatBonuses } from "../data/milestones";
import { getAffixById, getEquipmentItemById } from "../data/registry";
import { levelFromXp } from "../data/skills";
import { CONDITION_STAT_MULTIPLIER } from "../data/types";
import type { CombatStage, EnemyCombatProfile, ExpeditionDifficultyProfile, GameState } from "../data/types";

// ═══════════════════════════════════════
// Constants
// ═══════════════════════════════════════

/** Base player HP before the life stat is added. */
const BASE_PLAYER_HP = 35;

/** Maximum rounds before combat times out (player loses). */
const MAX_ROUNDS = 50;

/** Scaling factor for player defense vs physical damage. */
const DEFENSE_SCALE = 4;

/** Scaling factor for resist stats vs typed damage. */
const RESIST_SCALE = 6;

/** Scaling factor for enemy defense vs player offense. */
const ENEMY_DEFENSE_SCALE = 5;

/** Scaling factor for speed → dodge chance. */
const DODGE_SCALE = 3;

/** Scaling factor for endurance → damage reduction. */
const ENDURANCE_SCALE = 2;

/** How much attackSpeed stat increases hits per round (attackSpeed * this). */
const ATTACK_SPEED_PER_POINT = 0.05;

/** Number of Monte Carlo simulations for win rate estimation. */
const MONTE_CARLO_RUNS = 200;

// ═══════════════════════════════════════
// Seeded PRNG (deterministic win rate estimation)
// ═══════════════════════════════════════

/** Mulberry32 — fast 32-bit seeded PRNG returning values in [0, 1). */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Get all enemies from a difficulty profile (stages or single enemy). */
function getEnemies(difficulty: ExpeditionDifficultyProfile): EnemyCombatProfile[] {
  if (difficulty.stages && difficulty.stages.length > 0) {
    return difficulty.stages.map(s => s.enemy);
  }
  return difficulty.enemy ? [difficulty.enemy] : [];
}

/** Derive a deterministic seed from player stats + enemy difficulty. */
function computeCombatSeed(
  player: PlayerCombatStats,
  difficulty: ExpeditionDifficultyProfile,
): number {
  let hash = 0x9e3779b9;
  const values: number[] = [
    player.offense, player.defense, player.life, player.attackSpeed,
    player.speed, player.endurance, player.heatResist, player.coldResist,
    player.wetResist, player.critChance, player.critMultiplier,
  ];
  for (const enemy of getEnemies(difficulty)) {
    values.push(enemy.hp, enemy.damage, enemy.defense, enemy.attackSpeed);
  }
  for (const v of values) {
    hash = ((hash << 5) - hash + Math.round(v * 1000)) | 0;
  }
  return hash;
}

/**
 * Cheap key that changes only when combat-relevant inputs change.
 * Computing this is O(equipped items) — trivial compared to running simulations.
 * Use as a useMemo dependency to avoid re-running Monte Carlo every tick.
 */
export function combatEstimationKey(
  state: GameState,
  difficulty: ExpeditionDifficultyProfile,
): number {
  return computeCombatSeed(getPlayerCombatStats(state), difficulty);
}

// ═══════════════════════════════════════
// Stat Computation (unchanged from before)
// ═══════════════════════════════════════

/** Percentage stat pairs: [baseStat, percentStat]. */
const PERCENT_PAIRS: [string, string][] = [
  ["offense", "offensePercent"],
  ["defense", "defensePercent"],
  ["life", "lifePercent"],
  ["attackSpeed", "attackSpeedPercent"],
];

/** Stats that are special modifiers, not directly used as flat combat stats. */
const SPECIAL_STATS = new Set(["critChance", "critMultiplier", "offensePercent", "defensePercent", "lifePercent", "attackSpeedPercent"]);

/** Sum all raw stats from the player's currently equipped loadout. */
function computeRawLoadoutStats(state: GameState): Record<string, number> {
  const stats: Record<string, number> = {};

  const equippedIds = new Set(
    Object.values(state.loadout).filter((id): id is string => id != null)
  );

  for (const item of state.equipmentInventory) {
    if (!equippedIds.has(item.instanceId)) continue;
    const condMult = CONDITION_STAT_MULTIPLIER[item.condition] ?? 0;
    if (condMult === 0) continue;

    const def = getEquipmentItemById(item.defId);
    if (!def) continue;

    for (const mod of def.baseStats) {
      stats[mod.stat] = (stats[mod.stat] ?? 0) + Math.round(mod.value * condMult);
    }

    for (const affix of item.affixes) {
      const affixDef = getAffixById(affix.affixId);
      if (!affixDef) continue;
      const range = affixDef.rollRange ?? { min: 1, max: 1 };
      const scale = range.min + affix.rollValue * (range.max - range.min);
      for (const mod of affixDef.modifiers) {
        stats[mod.stat] = (stats[mod.stat] ?? 0) + Math.round(mod.value * scale * condMult);
      }
    }

    // Imbued stat bonus (one per item, permanent) — also scaled by condition
    if (item.imbued) {
      stats[item.imbued.stat] = (stats[item.imbued.stat] ?? 0) + Math.round(item.imbued.value * condMult);
    }
  }

  return stats;
}

/** Apply percentage modifiers and extract special stats. */
function applyPercentAndExtract(raw: Record<string, number>): {
  stats: Record<string, number>;
  critChance: number;
  critMultiplier: number;
} {
  const stats = { ...raw };

  for (const [base, pct] of PERCENT_PAIRS) {
    const pctVal = stats[pct] ?? 0;
    if (pctVal !== 0 && (stats[base] ?? 0) > 0) {
      stats[base] = Math.round(stats[base] * (1 + pctVal / 100));
    }
  }

  const critChance = stats["critChance"] ?? 0;
  const critMultiplier = stats["critMultiplier"] ?? 0;

  for (const s of SPECIAL_STATS) {
    delete stats[s];
  }

  return { stats, critChance, critMultiplier };
}

/**
 * Sum all stats from the player's currently equipped loadout.
 * Returns effective stats after applying percentage modifiers.
 */
export function computeLoadoutStats(state: GameState): Record<string, number> {
  const raw = computeRawLoadoutStats(state);
  const { stats } = applyPercentAndExtract(raw);
  return stats;
}

/** Compute total gear score: sum of all positive stat values from the loadout. */
export function computeGearScore(loadoutStats: Record<string, number>): number {
  let score = 0;
  for (const value of Object.values(loadoutStats)) {
    if (value > 0) score += value;
  }
  return score;
}

// ═══════════════════════════════════════
// Full player combat stats (gear + milestones)
// ═══════════════════════════════════════

export interface PlayerCombatStats {
  offense: number;
  defense: number;
  life: number;
  attackSpeed: number;
  speed: number;
  endurance: number;
  heatResist: number;
  coldResist: number;
  wetResist: number;
  critChance: number;
  critMultiplier: number;
}

/** Compute full combat stats including milestone bonuses. */
function getPlayerCombatStats(state: GameState): PlayerCombatStats {
  const raw = computeRawLoadoutStats(state);

  const combatLevel = levelFromXp(state.skills["combat"]?.xp ?? 0);
  const milestoneBonuses = getCombatStatBonuses("combat", combatLevel);
  for (const [stat, bonus] of Object.entries(milestoneBonuses)) {
    raw[stat] = (raw[stat] ?? 0) + bonus;
  }

  const { stats, critChance, critMultiplier } = applyPercentAndExtract(raw);

  return {
    offense: stats["offense"] ?? 0,
    defense: stats["defense"] ?? 0,
    life: stats["life"] ?? 0,
    attackSpeed: stats["attackSpeed"] ?? 0,
    speed: stats["speed"] ?? 0,
    endurance: stats["endurance"] ?? 0,
    heatResist: stats["heatResist"] ?? 0,
    coldResist: stats["coldResist"] ?? 0,
    wetResist: stats["wetResist"] ?? 0,
    critChance,
    critMultiplier,
  };
}

// ═══════════════════════════════════════
// Damage Formulas
// ═══════════════════════════════════════

/**
 * Diminishing returns formula: stat * scale / (stat * scale + 100).
 * Returns a fraction 0–1 representing the reduction.
 */
function diminishing(stat: number, scale: number): number {
  if (stat <= 0) return 0;
  return (stat * scale) / (stat * scale + 100);
}

/** Calculate player damage per hit against an enemy. */
function calcPlayerHitDamage(
  offense: number,
  enemyDefense: number,
  critted: boolean,
  critMultiplier: number,
): number {
  const reduction = diminishing(enemyDefense, ENEMY_DEFENSE_SCALE);
  let dmg = offense * (1 - reduction);
  if (critted) {
    dmg *= (1 + critMultiplier / 100);
  }
  return Math.max(1, Math.round(dmg));
}

/** Calculate enemy damage per hit against the player, accounting for defense and resists. */
function calcEnemyHitDamage(
  enemyDamage: number,
  damageTypes: { physical?: number; heat?: number; cold?: number; wet?: number },
  player: PlayerCombatStats,
): number {
  const phys = damageTypes.physical ?? 0;
  const heat = damageTypes.heat ?? 0;
  const cold = damageTypes.cold ?? 0;
  const wet = damageTypes.wet ?? 0;

  // Each portion reduced by the matching stat
  const physDmg = enemyDamage * phys * (1 - diminishing(player.defense, DEFENSE_SCALE));
  const heatDmg = enemyDamage * heat * (1 - diminishing(player.heatResist, RESIST_SCALE));
  const coldDmg = enemyDamage * cold * (1 - diminishing(player.coldResist, RESIST_SCALE));
  const wetDmg = enemyDamage * wet * (1 - diminishing(player.wetResist, RESIST_SCALE));

  let total = physDmg + heatDmg + coldDmg + wetDmg;

  // Endurance provides flat damage reduction on top
  const dr = diminishing(player.endurance, ENDURANCE_SCALE);
  total *= (1 - dr);

  return Math.max(1, Math.round(total));
}

/** Roll number of attacks for a given attackSpeed stat (player) or raw attacks/round (enemy). */
function rollAttacks(hitsPerRound: number, rng: () => number = Math.random): number {
  const base = Math.floor(hitsPerRound);
  const frac = hitsPerRound - base;
  return base + (rng() < frac ? 1 : 0);
}

// ═══════════════════════════════════════
// Combat Simulation
// ═══════════════════════════════════════

export type EncounterGrade = "success" | "partial" | "failure";

export interface EncounterResult {
  grade: EncounterGrade;
  enemyName: string;
  roundsFought: number;
  playerHpStart: number;
  playerHpEnd: number;
  enemyHpStart: number;
  enemyHpEnd: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  critsLanded: number;
  dodges: number;
  estimatedWinRate: number;
  dropMultiplier: number;
  xpMultiplier: number;
  failureInsights: string[];
  /** Number of stages cleared (0 = failed stage 1). Only set for staged expeditions. */
  stagesCleared?: number;
  /** Total stages in the expedition. Only set for staged expeditions. */
  totalStages?: number;
}

/**
 * Run a single combat simulation against one enemy and return the result.
 * The player and enemy trade blows each round until one side's HP reaches 0
 * or MAX_ROUNDS is exceeded (player loses on timeout).
 * `startingHp` allows carrying over HP from a previous stage.
 */
function simulateSingleCombat(
  player: PlayerCombatStats,
  enemy: EnemyCombatProfile,
  rng: () => number = Math.random,
  startingHp?: number,
): { playerHpEnd: number; enemyHpEnd: number; rounds: number; damageDealt: number; damageTaken: number; crits: number; dodgeCount: number; won: boolean } {
  const damageTypes = enemy.damageTypes ?? { physical: 1.0 };
  const playerMaxHp = BASE_PLAYER_HP + player.life;
  const playerHitsPerRound = Math.max(0.5, 1 + player.attackSpeed * ATTACK_SPEED_PER_POINT);
  const critProb = Math.min(1, Math.max(0, player.critChance / 100));
  const dodgeChance = diminishing(player.speed, DODGE_SCALE);

  let playerHp = startingHp ?? playerMaxHp;
  let enemyHp = enemy.hp;
  let rounds = 0;
  let totalDamageDealt = 0;
  let totalDamageTaken = 0;
  let critsLanded = 0;
  let dodges = 0;

  while (playerHp > 0 && enemyHp > 0 && rounds < MAX_ROUNDS) {
    rounds++;

    // --- Player attacks ---
    const playerHits = rollAttacks(playerHitsPerRound, rng);
    for (let i = 0; i < playerHits && enemyHp > 0; i++) {
      const critted = critProb > 0 && rng() < critProb;
      if (critted) critsLanded++;
      const dmg = calcPlayerHitDamage(player.offense, enemy.defense, critted, player.critMultiplier);
      enemyHp -= dmg;
      totalDamageDealt += dmg;
    }

    if (enemyHp <= 0) break; // enemy dead before retaliating

    // --- Enemy attacks ---
    const enemyHits = rollAttacks(enemy.attackSpeed, rng);
    for (let i = 0; i < enemyHits && playerHp > 0; i++) {
      if (dodgeChance > 0 && rng() < dodgeChance) {
        dodges++;
        continue;
      }
      const dmg = calcEnemyHitDamage(enemy.damage, damageTypes, player);
      playerHp -= dmg;
      totalDamageTaken += dmg;
    }
  }

  return {
    playerHpEnd: Math.max(0, playerHp),
    enemyHpEnd: Math.max(0, enemyHp),
    rounds,
    damageDealt: totalDamageDealt,
    damageTaken: totalDamageTaken,
    crits: critsLanded,
    dodgeCount: dodges,
    won: enemyHp <= 0,
  };
}

/** Generate failure insights based on combat result. */
function generateInsights(
  player: PlayerCombatStats,
  enemies: EnemyCombatProfile[],
  grade: EncounterGrade,
  lastEnemyIdx: number,
  lastEnemyHpRemaining: number,
  hint: string,
): string[] {
  const insights: string[] = [];
  if (grade === "success") return insights;

  const lastEnemy = enemies[lastEnemyIdx];
  if (lastEnemy && lastEnemyHpRemaining > 0) {
    insights.push(`${lastEnemy.name} still had ~${Math.round(lastEnemyHpRemaining)} HP when you fell`);
  }

  // Check offense vs highest defense
  const maxDef = Math.max(...enemies.map(e => e.defense));
  if (player.offense <= maxDef * 2) {
    insights.push(`Your offense (${player.offense}) is struggling — stack more damage`);
  }

  // Check resists against damage types across all enemies
  const seenHeat = enemies.some(e => (e.damageTypes?.heat ?? 0) >= 0.4);
  const seenCold = enemies.some(e => (e.damageTypes?.cold ?? 0) >= 0.4);
  const seenWet = enemies.some(e => (e.damageTypes?.wet ?? 0) >= 0.4);
  const seenPhys = enemies.some(e => (e.damageTypes?.physical ?? (e.damageTypes ? 0 : 1)) >= 0.4);
  if (seenHeat && player.heatResist < 5) insights.push(`Heat damage is the main threat — heat resist would help a lot`);
  if (seenCold && player.coldResist < 5) insights.push(`Cold damage is the main threat — cold resist would help a lot`);
  if (seenWet && player.wetResist < 5) insights.push(`Wet damage is the main threat — water resistance would help`);
  if (seenPhys && player.defense < 5) insights.push(`Physical damage is heavy — more defense would help`);
  if (player.life < 10 && grade === "failure") insights.push(`More life would help you survive longer`);
  if (hint) insights.push(hint);

  return insights;
}

/**
 * Run a full combat simulation (single enemy or multi-stage gauntlet).
 * For staged expeditions, HP carries over between stages.
 */
function simulateCombat(
  player: PlayerCombatStats,
  difficulty: ExpeditionDifficultyProfile,
  rng: () => number = Math.random,
): Omit<EncounterResult, "estimatedWinRate"> {
  const playerMaxHp = BASE_PLAYER_HP + player.life;
  const stages = difficulty.stages;

  // ── Multi-stage gauntlet ──
  if (stages && stages.length > 0) {
    let currentHp = playerMaxHp;
    let totalRounds = 0;
    let totalDealt = 0;
    let totalTaken = 0;
    let totalCrits = 0;
    let totalDodges = 0;
    let stagesCleared = 0;
    let lastEnemyHpEnd = 0;

    for (const stage of stages) {
      const result = simulateSingleCombat(player, stage.enemy, rng, currentHp);
      totalRounds += result.rounds;
      totalDealt += result.damageDealt;
      totalTaken += result.damageTaken;
      totalCrits += result.crits;
      totalDodges += result.dodgeCount;
      currentHp = result.playerHpEnd;
      lastEnemyHpEnd = result.enemyHpEnd;

      if (!result.won) break;
      stagesCleared++;
    }

    // Grade based on stages cleared
    let grade: EncounterGrade;
    let dropMultiplier: number;
    let xpMultiplier: number;
    const totalStages = stages.length;

    if (stagesCleared === 0) {
      grade = "failure";
      dropMultiplier = 0.15;
      xpMultiplier = 0.6;
    } else if (stagesCleared < totalStages) {
      grade = "partial";
      dropMultiplier = 0.5;
      xpMultiplier = 0.8 + (stagesCleared / totalStages) * 0.2;
    } else {
      // Full clear — grade depends on remaining HP
      if (currentHp / playerMaxHp >= 0.5) {
        grade = "success";
        dropMultiplier = 1.0;
        xpMultiplier = 1.2;
      } else {
        grade = "partial";
        dropMultiplier = 0.85;
        xpMultiplier = 1.0;
      }
    }

    const enemies = stages.map(s => s.enemy);
    const lastIdx = Math.min(stagesCleared, stages.length - 1);
    const insights = generateInsights(player, enemies, grade, lastIdx, lastEnemyHpEnd, difficulty.hint);
    const enemyNames = stages.slice(0, stagesCleared + 1).map(s => s.enemy.name);

    return {
      grade,
      enemyName: enemyNames.join(", "),
      roundsFought: totalRounds,
      playerHpStart: playerMaxHp,
      playerHpEnd: Math.max(0, currentHp),
      enemyHpStart: stages.reduce((sum, s) => sum + s.enemy.hp, 0),
      enemyHpEnd: lastEnemyHpEnd,
      totalDamageDealt: totalDealt,
      totalDamageTaken: totalTaken,
      critsLanded: totalCrits,
      dodges: totalDodges,
      dropMultiplier,
      xpMultiplier,
      failureInsights: insights,
      stagesCleared,
      totalStages,
    };
  }

  // ── Single enemy (legacy) ──
  const enemy = difficulty.enemy!;
  const result = simulateSingleCombat(player, enemy, rng);

  let grade: EncounterGrade;
  let dropMultiplier: number;
  let xpMultiplier: number;

  if (result.won) {
    const hpPercent = result.playerHpEnd / playerMaxHp;
    if (hpPercent >= 0.5) {
      grade = "success";
      dropMultiplier = 1.0;
      xpMultiplier = 1.2;
    } else {
      grade = "partial";
      dropMultiplier = 0.5;
      xpMultiplier = 1.0;
    }
  } else {
    grade = "failure";
    dropMultiplier = 0.15;
    xpMultiplier = 0.6;
  }

  const insights = generateInsights(player, [enemy], grade, 0, result.enemyHpEnd, difficulty.hint);

  return {
    grade,
    enemyName: enemy.name,
    roundsFought: result.rounds,
    playerHpStart: playerMaxHp,
    playerHpEnd: result.playerHpEnd,
    enemyHpStart: enemy.hp,
    enemyHpEnd: result.enemyHpEnd,
    totalDamageDealt: result.damageDealt,
    totalDamageTaken: result.damageTaken,
    critsLanded: result.crits,
    dodges: result.dodgeCount,
    dropMultiplier,
    xpMultiplier,
    failureInsights: insights,
  };
}

// ═══════════════════════════════════════
// Win Rate Estimation (Monte Carlo)
// ═══════════════════════════════════════

/**
 * Estimate win rate by running many combat simulations.
 * Returns a number 0–1 representing the fraction of wins (success + partial).
 * Uses a seeded PRNG so the same stats + difficulty always produce the same result.
 */
export function estimateWinRate(
  state: GameState,
  difficulty: ExpeditionDifficultyProfile,
): number {
  const player = getPlayerCombatStats(state);
  const rng = mulberry32(computeCombatSeed(player, difficulty));
  let wins = 0;
  for (let i = 0; i < MONTE_CARLO_RUNS; i++) {
    const result = simulateCombat(player, difficulty, rng);
    if (result.grade !== "failure") wins++;
  }
  return wins / MONTE_CARLO_RUNS;
}

/**
 * Estimate the grade distribution by running many simulations.
 * Returns { success, partial, failure } as fractions 0–1.
 * Uses a seeded PRNG so the same stats + difficulty always produce the same result.
 */
export function estimateGradeDistribution(
  state: GameState,
  difficulty: ExpeditionDifficultyProfile,
): { success: number; partial: number; failure: number } {
  const player = getPlayerCombatStats(state);
  const rng = mulberry32(computeCombatSeed(player, difficulty));
  let success = 0;
  let partial = 0;
  let failure = 0;
  for (let i = 0; i < MONTE_CARLO_RUNS; i++) {
    const result = simulateCombat(player, difficulty, rng);
    if (result.grade === "success") success++;
    else if (result.grade === "partial") partial++;
    else failure++;
  }
  return {
    success: success / MONTE_CARLO_RUNS,
    partial: partial / MONTE_CARLO_RUNS,
    failure: failure / MONTE_CARLO_RUNS,
  };
}

/**
 * Estimate win rate from explicit player stats (no GameState needed).
 * Used for balance tests and offline tuning.
 */
export function estimateWinRateFromStats(
  player: PlayerCombatStats,
  difficulty: ExpeditionDifficultyProfile,
  runs: number = MONTE_CARLO_RUNS,
): { winRate: number; success: number; partial: number; failure: number } {
  const rng = mulberry32(computeCombatSeed(player, difficulty));
  let success = 0;
  let partial = 0;
  let failure = 0;
  for (let i = 0; i < runs; i++) {
    const result = simulateCombat(player, difficulty, rng);
    if (result.grade === "success") success++;
    else if (result.grade === "partial") partial++;
    else failure++;
  }
  return {
    winRate: (success + partial) / runs,
    success: success / runs,
    partial: partial / runs,
    failure: failure / runs,
  };
}

/**
 * For staged expeditions, estimate the distribution of stages cleared.
 * Returns an array of length (totalStages + 1) where index i = fraction of runs clearing exactly i stages.
 * E.g. for 3 stages: [failedStage1, clearedOnly1, clearedOnly2, clearedAll3].
 */
export function estimateStageClearRates(
  state: GameState,
  stages: CombatStage[],
  difficulty: ExpeditionDifficultyProfile,
): number[] {
  const player = getPlayerCombatStats(state);
  const rng = mulberry32(computeCombatSeed(player, difficulty));
  const counts = new Array(stages.length + 1).fill(0);
  for (let i = 0; i < MONTE_CARLO_RUNS; i++) {
    const result = simulateCombat(player, difficulty, rng);
    const cleared = result.stagesCleared ?? 0;
    counts[cleared]++;
  }
  return counts.map(c => c / MONTE_CARLO_RUNS);
}

// ═══════════════════════════════════════
// Public Encounter Resolution
// ═══════════════════════════════════════

/**
 * Resolve an expedition encounter: run one combat simulation and return the result.
 * This is called once when an expedition completes.
 */
export function resolveEncounter(
  state: GameState,
  difficulty: ExpeditionDifficultyProfile,
): EncounterResult {
  const player = getPlayerCombatStats(state);
  const winRate = estimateWinRate(state, difficulty);
  const sim = simulateCombat(player, difficulty);
  return { ...sim, estimatedWinRate: winRate };
}
