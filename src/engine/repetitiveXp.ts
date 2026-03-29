import { getResources } from "../data/registry";
import type { GameState } from "../data/types";
import { getStorageLimit } from "./gameState";

/** Default full-XP threshold when no storage-based threshold applies. */
export const DEFAULT_FULL_XP_ACTIONS = 30;
/** Number of actions over which XP ramps down after the full-XP threshold. */
export const RAMP_DOWN_ACTIONS = 70;
export const MIN_XP_MULTIPLIER = 0.1;

/**
 * Compute the full-XP action threshold based on the highest storage cap
 * among all resources in the player's inventory. This ensures diminishing
 * returns never kick in before a player can fill their highest-cap resource.
 */
export function getFullXpThreshold(state: GameState): number {
  let maxCap = 0;
  const RESOURCES = getResources();

  for (const resourceId of Object.keys(RESOURCES)) {
    const cap = getStorageLimit(state, resourceId);
    if (cap > maxCap) maxCap = cap;
  }

  return Math.max(DEFAULT_FULL_XP_ACTIONS, maxCap);
}

export function getRepetitiveXpMultiplier(repetitiveCount: number, fullXpActions: number = DEFAULT_FULL_XP_ACTIONS): number {
  const minXpActions = fullXpActions + RAMP_DOWN_ACTIONS;
  if (repetitiveCount < fullXpActions) return 1;
  if (repetitiveCount >= minXpActions) return MIN_XP_MULTIPLIER;
  const progress = (repetitiveCount - fullXpActions) / (minXpActions - fullXpActions);
  return 1 - progress * (1 - MIN_XP_MULTIPLIER);
}

export function applyRepetitiveXp(baseXp: number, repetitiveCount: number, fullXpActions: number = DEFAULT_FULL_XP_ACTIONS): number {
  const multiplier = getRepetitiveXpMultiplier(repetitiveCount, fullXpActions);
  return Math.max(1, Math.round(baseXp * multiplier));
}
