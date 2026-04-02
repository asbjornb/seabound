import type { GameState } from "./types";

/** Any skill at this level unlocks the Routines tab. */
export const ROUTINE_UNLOCK_LEVEL = 15;

/** Base limits before upgrades. */
export const BASE_MAX_ROUTINES = 1;
export const BASE_MAX_STEPS = 2;

/** Building-based upgrades to routine limits. */
export interface RoutineUpgrade {
  buildingId: string;
  maxRoutines?: number; // additive bonus to max saved routines
  maxSteps?: number; // additive bonus to max steps per routine
  enableCounts?: boolean; // unlocks per-step completion counts
  description: string; // shown in UI
}

export const ROUTINE_UPGRADES: RoutineUpgrade[] = [
  {
    buildingId: "charcoal_board",
    maxRoutines: 1,
    description: "Charcoal Board — writing plans down keeps you organized. +1 routine slot.",
  },
  {
    buildingId: "storage_shelf",
    maxSteps: 1,
    enableCounts: true,
    description: "Storage Shelf — organized supplies, organized work. +1 step per routine, step counts unlocked.",
  },
  {
    buildingId: "outrigger_canoe",
    maxSteps: 2,
    description: "Outrigger Canoe — you've mastered large-effort projects and are finding rituals for completing work. +2 steps per routine.",
  },
];

export function isRoutinesUnlocked(state: GameState): boolean {
  return Object.values(state.skills).some((s) => s.level >= ROUTINE_UNLOCK_LEVEL);
}

export function getMaxRoutines(state: GameState): number {
  let max = BASE_MAX_ROUTINES;
  for (const u of ROUTINE_UPGRADES) {
    if (u.maxRoutines && state.buildings.includes(u.buildingId)) {
      max += u.maxRoutines;
    }
  }
  return max;
}

export function getMaxSteps(state: GameState): number {
  let max = BASE_MAX_STEPS;
  for (const u of ROUTINE_UPGRADES) {
    if (u.maxSteps && state.buildings.includes(u.buildingId)) {
      max += u.maxSteps;
    }
  }
  return max;
}

export function areCountsEnabled(state: GameState): boolean {
  return ROUTINE_UPGRADES.some(
    (u) => u.enableCounts && state.buildings.includes(u.buildingId)
  );
}
