/**
 * Game analytics events for Seabound.
 *
 * Fires lightweight events to help with:
 * - Balancing: time-to-milestone, action count at milestone, skill levels at milestone
 * - Retention: session tracking, heartbeat snapshots (shows where players quit)
 * - Motivation: unique players, session counts, progression funnels
 *
 * All events include an anonymous persistent player ID (per-device, not per-save).
 * No PII is collected.
 */

import type { GameState } from "../data/types";
import { trackEvent } from "./analytics";

const PLAYER_ID_KEY = "seabound_analytics_id";
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

/** Get or create a persistent anonymous player ID. */
function getPlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

/** Build a compact snapshot of current progression for context. */
function progressSnapshot(state: GameState): Record<string, unknown> {
  const skills = Object.entries(state.skills).reduce(
    (acc, [id, s]) => {
      acc[id] = s.level;
      return acc;
    },
    {} as Record<string, number>,
  );
  const maxSkillLevel = Math.max(...Object.values(state.skills).map((s) => s.level));

  return {
    playerId: getPlayerId(),
    totalPlayTimeMs: state.totalPlayTimeMs,
    activePlayTimeMs: state.activePlayTimeMs,
    actionCompletions: state.actionCompletions,
    maxSkillLevel,
    skills,
    phase: state.seenPhases[state.seenPhases.length - 1],
    biomes: state.discoveredBiomes.length,
    buildings: state.buildings.length,
    tools: state.tools.length,
    morale: state.morale,
    victory: state.victory ?? false,
    routineCount: state.routines.length,
    routineActive: state.activeRoutine != null,
  };
}

// ── Session events ──────────────────────────────────────────────

/** Fire on game load. Gives unique players + return rate. */
export function trackSessionStart(state: GameState): void {
  trackEvent("session_start", {
    ...progressSnapshot(state),
    isNewPlayer: state.totalPlayTimeMs === 0,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  });
}

/** Fire on page unload. Final snapshot shows where player left off. */
export function trackSessionEnd(state: GameState): void {
  trackEvent("session_end", progressSnapshot(state));
}

// ── Heartbeat ───────────────────────────────────────────────────

/** Start periodic heartbeat. The last heartbeat before churn = drop-off point. */
export function startHeartbeat(getState: () => GameState): void {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    const state = getState();
    trackEvent("heartbeat", progressSnapshot(state));
  }, HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// ── Milestones ──────────────────────────────────────────────────

/** Milestone definitions: id + condition check. */
const MILESTONES: { id: string; check: (state: GameState) => boolean }[] = [
  { id: "raft_built", check: (s) => s.buildings.includes("raft") },
  { id: "dugout_built", check: (s) => s.buildings.includes("dugout") },
  { id: "outrigger_built", check: (s) => s.buildings.includes("outrigger_canoe") },
  {
    id: "first_skill_10",
    check: (s) => Object.values(s.skills).some((sk) => sk.level >= 10),
  },
  {
    id: "first_skill_15",
    check: (s) => Object.values(s.skills).some((sk) => sk.level >= 15),
  },
  { id: "victory", check: (s) => s.victory === true },
  // Phase milestones (funnel)
  { id: "phase_bamboo", check: (s) => s.seenPhases.includes("bamboo") },
  { id: "phase_fire", check: (s) => s.seenPhases.includes("fire") },
  { id: "phase_stone_clay", check: (s) => s.seenPhases.includes("stone") },
  { id: "phase_maritime", check: (s) => s.seenPhases.includes("maritime") },
  { id: "phase_voyage", check: (s) => s.seenPhases.includes("voyage") },
  // First skill level-ups (early engagement)
  {
    id: "first_skill_5",
    check: (s) => Object.values(s.skills).some((sk) => sk.level >= 5),
  },
  // Routine adoption
  {
    id: "first_routine_created",
    check: (s) => s.routines.length > 0,
  },
];

/**
 * Check all milestones against current state and fire events for newly reached ones.
 * Call after every completion batch.
 */
// ── Mainland combat telemetry ──────────────────────────────────
//
// Review cadence: check analytics dashboard weekly during experimental mainland phase.
// Key metrics to review:
//   - expedition_complete: pick rate distribution and failure rate per expedition
//   - repair_item / salvage_item: repair-vs-salvage ratio, material tag bottlenecks
//   - combat_log_open / combat_log_clear: engagement with log UI
//   - mainland_optionality: % of mainland players using combat/smithing vs skipping
// Query: curl -H "Authorization: Bearer $SEABOUND_API_KEY" "$SEABOUND_WORKER_URL/api/analytics/summary?days=7"

/** Fire when a mainland expedition completes. Tracks pick rates and failure rates by tier. */
export function trackExpeditionComplete(
  state: GameState,
  expeditionId: string,
  grade: "success" | "partial" | "failure",
  passRatio: number,
  equipmentDropCount: number,
): void {
  trackEvent("expedition_complete", {
    playerId: getPlayerId(),
    expeditionId,
    grade,
    passRatio,
    equipmentDropCount,
    combatLevel: state.skills["combat"]?.level ?? 0,
    smithingLevel: state.skills["smithing"]?.level ?? 0,
    totalPlayTimeMs: state.totalPlayTimeMs,
  });
}

/** Fire when a player repairs an item. Tracks repair bottlenecks and smithing engagement. */
export function trackRepairItem(
  state: GameState,
  itemDefId: string,
  fromCondition: string,
  materialTag: string,
): void {
  trackEvent("repair_item", {
    playerId: getPlayerId(),
    itemDefId,
    fromCondition,
    materialTag,
    smithingLevel: state.skills["smithing"]?.level ?? 0,
    totalPlayTimeMs: state.totalPlayTimeMs,
  });
}

/** Fire when a player salvages an item. Tracks salvage engagement. */
export function trackSalvageItem(
  state: GameState,
  itemDefId: string,
  condition: string,
  materialTag: string,
): void {
  trackEvent("salvage_item", {
    playerId: getPlayerId(),
    itemDefId,
    condition,
    materialTag,
    smithingLevel: state.skills["smithing"]?.level ?? 0,
  });
}

/** Fire when a player opens a combat log entry. */
export function trackCombatLogOpen(): void {
  trackEvent("combat_log_open", { playerId: getPlayerId() });
}

/** Fire when a player clears the combat log. */
export function trackCombatLogClear(entryCount: number): void {
  trackEvent("combat_log_clear", { playerId: getPlayerId(), entryCount });
}

/** Fire on session_start/heartbeat with optionality metrics for mainland players. */
export function trackOptionalitySnapshot(state: GameState): void {
  if (!state.mainlandUnlocked) return;
  const combatLevel = state.skills["combat"]?.level ?? 0;
  const smithingLevel = state.skills["smithing"]?.level ?? 0;
  const miningLevel = state.skills["mining"]?.level ?? 0;
  const expeditionCount = Object.entries(state.actionCompletionCounts)
    .filter(([k]) => k.startsWith("expedition:"))
    .reduce((sum, [, v]) => sum + v, 0);
  const repairCount = state.actionCompletionCounts["repair:total"] ?? 0;
  const salvageCount = state.actionCompletionCounts["salvage:total"] ?? 0;
  const equipmentOwned = state.equipmentInventory?.length ?? 0;

  trackEvent("mainland_optionality", {
    playerId: getPlayerId(),
    combatLevel,
    smithingLevel,
    miningLevel,
    expeditionCount,
    repairCount,
    salvageCount,
    equipmentOwned,
    totalPlayTimeMs: state.totalPlayTimeMs,
  });
}

// ── Routine analytics ──────────────────────────────────────────

/** Fire when a player starts a routine. Tracks adoption and routine composition. */
export function trackRoutineStarted(
  state: GameState,
  routine: { steps: { actionType: string }[] },
): void {
  const stepTypes = routine.steps.map((s) => s.actionType);
  trackEvent("routine_started", {
    playerId: getPlayerId(),
    stepCount: routine.steps.length,
    stepTypes,
    routineCount: state.routines.length,
    totalPlayTimeMs: state.totalPlayTimeMs,
  });
}

/** Fire when a routine stops. Tracks engagement and failure modes. */
export function trackRoutineStopped(
  state: GameState,
  reason: "manual" | "output_full" | "cant_proceed",
): void {
  trackEvent("routine_stopped", {
    playerId: getPlayerId(),
    reason,
    totalPlayTimeMs: state.totalPlayTimeMs,
  });
}

export function checkMilestones(state: GameState): string[] {
  const newlyReached: string[] = [];

  for (const m of MILESTONES) {
    if (state.sentMilestones.includes(m.id)) continue;
    if (!m.check(state)) continue;

    // Newly reached!
    state.sentMilestones.push(m.id);
    newlyReached.push(m.id);

    trackEvent("milestone", {
      milestoneId: m.id,
      ...progressSnapshot(state),
    });
  }

  return newlyReached;
}
