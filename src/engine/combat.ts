/**
 * Probabilistic encounter/hazard resolution for mainland expeditions.
 *
 * Given a player's equipped loadout and an expedition's difficulty profile,
 * each stat check produces a pass probability based on the player's stat
 * versus the threshold. Checks are rolled independently with RNG.
 *
 * New stat system:
 * - Flat stats: offense, defense, life, attackSpeed, endurance, resists, speed, etc.
 * - Percentage stats: offensePercent, defensePercent, lifePercent, attackSpeedPercent
 *   → multiply corresponding flat stat: effective = flat * (1 + pct/100)
 * - Special stats: critChance (0-100), critMultiplier (0+)
 *   → per-check chance to boost the effective stat ratio
 */

import { getCombatStatBonuses } from "../data/milestones";
import { getAffixById, getEquipmentItemById } from "../data/registry";
import { levelFromXp } from "../data/skills";
import type { CombatCheckResult, ExpeditionDifficultyProfile, GameState, StatCheck } from "../data/types";

// ═══════════════════════════════════════
// Stat Computation
// ═══════════════════════════════════════

/** Percentage stat pairs: [baseStat, percentStat]. */
const PERCENT_PAIRS: [string, string][] = [
  ["offense", "offensePercent"],
  ["defense", "defensePercent"],
  ["life", "lifePercent"],
  ["attackSpeed", "attackSpeedPercent"],
];

/** Stats that are special modifiers, not directly checked. */
const SPECIAL_STATS = new Set(["critChance", "critMultiplier", "offensePercent", "defensePercent", "lifePercent", "attackSpeedPercent"]);

/** Sum all raw stats from the player's currently equipped loadout. */
function computeRawLoadoutStats(state: GameState): Record<string, number> {
  const stats: Record<string, number> = {};

  const equippedIds = new Set(
    Object.values(state.loadout).filter((id): id is string => id != null)
  );

  for (const item of state.equipmentInventory) {
    if (!equippedIds.has(item.instanceId)) continue;
    if (item.condition === "broken") continue; // broken items contribute nothing

    const def = getEquipmentItemById(item.defId);
    if (!def) continue;

    // Base stats
    for (const mod of def.baseStats) {
      stats[mod.stat] = (stats[mod.stat] ?? 0) + mod.value;
    }

    // Affix stats (scaled by roll value within the affix's roll range)
    for (const affix of item.affixes) {
      const affixDef = getAffixById(affix.affixId);
      if (!affixDef) continue;
      const range = affixDef.rollRange ?? { min: 1, max: 1 };
      const scale = range.min + affix.rollValue * (range.max - range.min);
      for (const mod of affixDef.modifiers) {
        stats[mod.stat] = (stats[mod.stat] ?? 0) + Math.round(mod.value * scale);
      }
    }
  }

  return stats;
}

/** Apply percentage modifiers and extract special stats. Returns effective combat stats. */
function applyPercentAndExtract(raw: Record<string, number>): {
  stats: Record<string, number>;
  critChance: number;
  critMultiplier: number;
} {
  const stats = { ...raw };

  // Apply percentage modifiers: effective = flat * (1 + pct / 100)
  for (const [base, pct] of PERCENT_PAIRS) {
    const pctVal = stats[pct] ?? 0;
    if (pctVal !== 0 && (stats[base] ?? 0) > 0) {
      stats[base] = Math.round(stats[base] * (1 + pctVal / 100));
    }
  }

  const critChance = stats["critChance"] ?? 0;
  const critMultiplier = stats["critMultiplier"] ?? 0;

  // Remove special/percent stats so they don't pollute gear score or stat checks
  for (const s of SPECIAL_STATS) {
    delete stats[s];
  }

  return { stats, critChance, critMultiplier };
}

/**
 * Sum all stats from the player's currently equipped loadout.
 * Returns effective stats after applying percentage modifiers.
 * Special stats (crit, percentages) are excluded from the result.
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
// Probabilistic Check Resolution
// ═══════════════════════════════════════

/**
 * Compute the probability of passing a single stat check.
 *
 * Uses a sigmoid-like curve: passChance = ratio^K / (1 + ratio^K)
 * where ratio = playerValue / threshold and K=3.
 *
 * This gives:
 * - ratio 0.5 (~half threshold):  ~11% pass chance
 * - ratio 1.0 (at threshold):     ~50% pass chance
 * - ratio 1.5 (50% over):         ~77% pass chance
 * - ratio 2.0 (double threshold):  ~89% pass chance
 *
 * Floored at 2% — even hopeless attempts have a slim chance.
 * No ceiling — if you've earned 100%, you get 100%.
 */
export function computeCheckPassChance(
  playerValue: number,
  threshold: number,
): number {
  if (threshold <= 0) return 1;
  const ratio = Math.max(0, playerValue) / threshold;
  const K = 3;
  const raw = Math.pow(ratio, K) / (1 + Math.pow(ratio, K));
  return Math.max(0.02, raw);
}

// ═══════════════════════════════════════
// Win Rate Estimation (for UI)
// ═══════════════════════════════════════

/**
 * Estimate the overall success probability for an expedition.
 * Success requires ALL stat checks to pass, so the win rate is
 * the product of individual check pass chances.
 *
 * This is a pure calculation (no RNG) for display in the UI.
 */
export function estimateWinRate(
  state: GameState,
  difficulty: ExpeditionDifficultyProfile,
): number {
  const raw = computeRawLoadoutStats(state);

  // Apply combat skill milestone bonuses
  const combatLevel = levelFromXp(state.skills["combat"]?.xp ?? 0);
  const milestoneBonuses = getCombatStatBonuses("combat", combatLevel);
  for (const [stat, bonus] of Object.entries(milestoneBonuses)) {
    raw[stat] = (raw[stat] ?? 0) + bonus;
  }

  const { stats, critChance, critMultiplier } = applyPercentAndExtract(raw);

  let winRate = 1;
  for (const check of difficulty.statChecks) {
    const playerValue = stats[check.stat] ?? 0;
    const baseChance = computeCheckPassChance(playerValue, check.threshold);

    // Factor in crit: weighted average of critted and non-critted pass chances
    const critProb = Math.min(1, Math.max(0, critChance / 100));
    if (critProb > 0 && critMultiplier > 0) {
      const boostedValue = playerValue * (1 + critMultiplier / 100);
      const crittedChance = computeCheckPassChance(boostedValue, check.threshold);
      const avgChance = (1 - critProb) * baseChance + critProb * crittedChance;
      winRate *= avgChance;
    } else {
      winRate *= baseChance;
    }
  }

  // Gear score check
  if (difficulty.minGearScore != null) {
    const gearScore = computeGearScore(stats);
    const gsChance = computeCheckPassChance(gearScore, difficulty.minGearScore);
    winRate *= gsChance;
  }

  return winRate;
}

// ═══════════════════════════════════════
// Encounter Resolution
// ═══════════════════════════════════════

export type EncounterGrade = "success" | "partial" | "failure";

export interface EncounterResult {
  /** Overall grade of the encounter. */
  grade: EncounterGrade;
  /** Per-stat-check results: which checks passed, with probabilities. */
  checkResults: CombatCheckResult[];
  /** Fraction of checks passed (0-1). */
  passRatio: number;
  /** Estimated overall success probability before rolling. */
  estimatedWinRate: number;
  /** Multiplier to apply to drop quantities (1.0 = normal, <1.0 = reduced). */
  dropMultiplier: number;
  /** Multiplier to apply to XP gain (1.0 = normal). */
  xpMultiplier: number;
  /** Human-readable hints about what the player could improve (only on partial/failure). */
  failureInsights: string[];
}

/**
 * Resolve an expedition encounter against the player's loadout stats.
 *
 * Each stat check is rolled probabilistically:
 * - Pass chance is based on ratio of player stat to threshold (sigmoid curve)
 * - Critical hits can boost the effective ratio for individual checks
 * - Grade is determined by how many checks pass:
 *   - All pass → "success" (full drops, bonus XP)
 *   - ≥50% pass → "partial" (reduced drops, normal XP)
 *   - <50% pass → "failure" (minimal drops, reduced XP)
 */
export function resolveEncounter(
  state: GameState,
  difficulty: ExpeditionDifficultyProfile
): EncounterResult {
  const raw = computeRawLoadoutStats(state);

  // Apply combat skill milestone bonuses
  const combatLevel = levelFromXp(state.skills["combat"]?.xp ?? 0);
  const milestoneBonuses = getCombatStatBonuses("combat", combatLevel);
  for (const [stat, bonus] of Object.entries(milestoneBonuses)) {
    raw[stat] = (raw[stat] ?? 0) + bonus;
  }

  const { stats, critChance, critMultiplier } = applyPercentAndExtract(raw);

  const winRate = estimateWinRate(state, difficulty);

  const checks = difficulty.statChecks;
  const critProb = Math.min(1, Math.max(0, critChance / 100));

  const checkResults: CombatCheckResult[] = checks.map((check: StatCheck) => {
    const playerValue = stats[check.stat] ?? 0;

    // Roll for crit on this check
    const critted = critProb > 0 && critMultiplier > 0 && Math.random() < critProb;
    const effectiveValue = critted ? playerValue * (1 + critMultiplier / 100) : playerValue;

    const passChance = computeCheckPassChance(effectiveValue, check.threshold);
    const passed = Math.random() < passChance;

    return {
      stat: check.stat,
      threshold: check.threshold,
      playerValue: Math.round(playerValue),
      passChance,
      passed,
      critted: critted || undefined,
    };
  });

  // Gear score check (treated as an additional pass/fail signal)
  let gearScorePassed = true;
  if (difficulty.minGearScore != null) {
    const gearScore = computeGearScore(stats);
    const gsChance = computeCheckPassChance(gearScore, difficulty.minGearScore);
    gearScorePassed = Math.random() < gsChance;
  }

  const statsPassed = checkResults.filter((r) => r.passed).length;
  const totalChecks = checkResults.length + (difficulty.minGearScore != null ? 1 : 0);
  const totalPassed = statsPassed + (gearScorePassed ? 1 : 0);
  const passRatio = totalChecks > 0 ? totalPassed / totalChecks : 1;

  let grade: EncounterGrade;
  let dropMultiplier: number;
  let xpMultiplier: number;

  if (passRatio >= 1) {
    grade = "success";
    dropMultiplier = 1.0;
    xpMultiplier = 1.2; // bonus XP for clean run
  } else if (passRatio >= 0.5) {
    grade = "partial";
    dropMultiplier = 0.5;
    xpMultiplier = 1.0;
  } else {
    grade = "failure";
    dropMultiplier = 0.15;
    xpMultiplier = 0.6;
  }

  // Generate failure insights for non-success outcomes
  const failureInsights: string[] = [];
  if (grade !== "success") {
    const failedChecks = checkResults.filter((r) => !r.passed);
    for (const check of failedChecks) {
      const statLabel = check.stat.replace(/([A-Z])/g, " $1").toLowerCase();
      const gap = check.threshold - check.playerValue;
      if (check.playerValue === 0) {
        failureInsights.push(`You had no ${statLabel} — need at least ${check.threshold}`);
      } else if (gap > 0) {
        failureInsights.push(`Your ${statLabel} (${check.playerValue}) was ${gap} short of the ${check.threshold} needed — ${Math.round(check.passChance * 100)}% pass chance`);
      } else {
        failureInsights.push(`Your ${statLabel} (${check.playerValue}) met the threshold but luck wasn't on your side — ${Math.round(check.passChance * 100)}% pass chance`);
      }
    }
    if (difficulty.minGearScore != null && !gearScorePassed) {
      const gearScore = computeGearScore(stats);
      failureInsights.push(`Gear score ${gearScore} is below the ${difficulty.minGearScore} recommended`);
    }
    if (difficulty.hint) {
      failureInsights.push(difficulty.hint);
    }
  }

  return { grade, checkResults, passRatio, estimatedWinRate: winRate, dropMultiplier, xpMultiplier, failureInsights };
}
