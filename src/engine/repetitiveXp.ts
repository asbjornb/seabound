import { getActionById, getRecipeById } from "../data/registry";
import type { GameState } from "../data/types";
import { getStorageLimit } from "./gameState";

/** Default full-XP threshold when no storage-based threshold applies. */
export const DEFAULT_FULL_XP_ACTIONS = 30;
/** Number of actions over which XP ramps down after the full-XP threshold. */
export const RAMP_DOWN_ACTIONS = 70;
export const MIN_XP_MULTIPLIER = 0.1;

/**
 * Compute the full-XP action threshold for the current action, based on the
 * highest storage cap among its output resources. This lets the player fill
 * storage with "stop at full" before diminishing returns kick in.
 */
export function getFullXpThreshold(state: GameState): number {
  const action = state.currentAction;
  if (!action) return DEFAULT_FULL_XP_ACTIONS;

  let maxCap = 0;

  if (action.type === "gather") {
    const def = getActionById(action.actionId);
    if (def) {
      for (const drop of def.drops) {
        if (drop.chance && drop.chance < 1) continue; // skip random drops
        const cap = getStorageLimit(state, drop.resourceId);
        if (cap > maxCap) maxCap = cap;
      }
    }
  } else if (action.type === "craft") {
    const def = action.recipeId ? getRecipeById(action.recipeId) : undefined;
    if (def?.output) {
      maxCap = getStorageLimit(state, def.output.resourceId);
    }
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
