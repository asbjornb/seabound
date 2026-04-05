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
];

/**
 * Check all milestones against current state and fire events for newly reached ones.
 * Call after every completion batch.
 */
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
