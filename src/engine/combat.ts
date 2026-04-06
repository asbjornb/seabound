/**
 * Non-real-time encounter/hazard resolution for mainland expeditions.
 *
 * Given a player's equipped loadout and an expedition's difficulty profile,
 * computes an overall result: "success", "partial", or "failure".
 *
 * Resolution is deterministic from stats — no RNG in the check itself.
 * The outcome grade then influences drop rates and XP in the caller.
 */

import { getAffixById, getEquipmentItemById } from "../data/registry";
import type { ExpeditionDifficultyProfile, GameState, StatCheck } from "../data/types";

// ═══════════════════════════════════════
// Stat Computation
// ═══════════════════════════════════════

/** Sum all stats from the player's currently equipped loadout. */
export function computeLoadoutStats(state: GameState): Record<string, number> {
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

/** Compute total gear score: sum of all positive stat values from the loadout. */
export function computeGearScore(loadoutStats: Record<string, number>): number {
  let score = 0;
  for (const value of Object.values(loadoutStats)) {
    if (value > 0) score += value;
  }
  return score;
}

// ═══════════════════════════════════════
// Encounter Resolution
// ═══════════════════════════════════════

export type EncounterGrade = "success" | "partial" | "failure";

export interface EncounterResult {
  /** Overall grade of the encounter. */
  grade: EncounterGrade;
  /** Per-stat-check results: which checks passed and which failed. */
  checkResults: { stat: string; threshold: number; playerValue: number; passed: boolean }[];
  /** Fraction of checks passed (0-1). */
  passRatio: number;
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
 * Rules:
 * - Each stat check compares the player's total stat to the threshold.
 * - Pass ratio determines the grade:
 *   - All checks pass → "success" (full drops, bonus XP)
 *   - At least half pass → "partial" (reduced drops, normal XP)
 *   - Less than half pass → "failure" (minimal drops, reduced XP)
 * - minGearScore acts as an additional check if present.
 */
export function resolveEncounter(
  state: GameState,
  difficulty: ExpeditionDifficultyProfile
): EncounterResult {
  const loadoutStats = computeLoadoutStats(state);
  const checks = difficulty.statChecks;

  const checkResults: EncounterResult["checkResults"] = checks.map((check: StatCheck) => {
    const playerValue = loadoutStats[check.stat] ?? 0;
    return {
      stat: check.stat,
      threshold: check.threshold,
      playerValue,
      passed: playerValue >= check.threshold,
    };
  });

  // Gear score check (treated as an additional pass/fail signal)
  let gearScorePassed = true;
  if (difficulty.minGearScore != null) {
    const gearScore = computeGearScore(loadoutStats);
    gearScorePassed = gearScore >= difficulty.minGearScore;
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
      } else {
        failureInsights.push(`Your ${statLabel} (${check.playerValue}) was ${gap} short of the ${check.threshold} needed`);
      }
    }
    if (difficulty.minGearScore != null && !gearScorePassed) {
      const gearScore = computeGearScore(loadoutStats);
      failureInsights.push(`Gear score ${gearScore} is below the ${difficulty.minGearScore} recommended`);
    }
    if (difficulty.hint) {
      failureInsights.push(difficulty.hint);
    }
  }

  return { grade, checkResults, passRatio, dropMultiplier, xpMultiplier, failureInsights };
}
