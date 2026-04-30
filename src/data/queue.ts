import type { GameState } from "./types";

/** Any skill at this level unlocks the action queue toggle. */
export const QUEUE_UNLOCK_LEVEL = 5;

/** Base queue size before upgrades. */
export const BASE_MAX_QUEUE = 1;

/** Building-based upgrades to queue capacity. */
export interface QueueUpgrade {
  buildingId: string;
  maxQueue: number; // additive bonus to max queue size
  description: string;
}

export const QUEUE_UPGRADES: QueueUpgrade[] = [
  {
    buildingId: "clay_tablet",
    maxQueue: 1,
    description: "Clay Tablet — marking your next task keeps you on track. +1 queue slot.",
  },
  {
    buildingId: "charcoal_board",
    maxQueue: 1,
    description: "Charcoal Board — writing plans down keeps you organized. +1 queue slot.",
  },
  {
    buildingId: "storage_shelf",
    maxQueue: 1,
    description: "Storage Shelf — organized supplies, organized work. +1 queue slot.",
  },
  {
    buildingId: "outrigger_canoe",
    maxQueue: 2,
    description: "Outrigger Canoe — you've mastered large-effort projects and find rituals for completing work. +2 queue slots.",
  },
];

export function isQueueUnlocked(state: GameState): boolean {
  return Object.values(state.skills).some((s) => s.level >= QUEUE_UNLOCK_LEVEL);
}

export function getMaxQueueSize(state: GameState): number {
  let max = BASE_MAX_QUEUE;
  for (const u of QUEUE_UPGRADES) {
    if (state.buildings.includes(u.buildingId)) {
      max += u.maxQueue;
    }
  }
  return max;
}
