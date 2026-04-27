import { getActionById, getRecipeById } from "../data/registry";
import type { ActionDef, GameState, QueuedAction, RecipeDef } from "../data/types";
import { getEffectiveInputs, resolveAlternateInputs, resolveTagInputs } from "./gameState";

/**
 * Optimistically simulate the effect of the current action and queued actions
 * on a GameState, so the UI can decide whether a recipe will be feasible by
 * the time it gets dequeued.
 *
 * Assumptions:
 * - Crafts: deterministic — apply effective inputs (with alternates), tag inputs,
 *   resource/tool/building outputs. Chance-based outputs are assumed to succeed.
 * - Gathers: assume each drop produces its full amount (chance treated as 1).
 * - Expeditions & routines: skipped — their outcomes are too RNG-heavy / open-ended
 *   to project usefully.
 */
export function projectQueueState(state: GameState): GameState {
  const projected = structuredClone(state);

  if (projected.currentAction) {
    applyCurrentAction(projected);
  }

  for (const queued of projected.actionQueue) {
    applyQueuedAction(projected, queued);
  }

  return projected;
}

function applyCurrentAction(state: GameState): void {
  const ca = state.currentAction;
  if (!ca) return;
  if (ca.type === "craft" && ca.recipeId) {
    const recipe = getRecipeById(ca.recipeId);
    if (recipe) applyCraftToProjection(state, recipe);
  } else if (ca.type === "gather") {
    const action = getActionById(ca.actionId);
    if (action) applyGatherToProjection(state, action);
  }
  // expeditions: no projection
}

function applyQueuedAction(state: GameState, queued: QueuedAction): void {
  if (queued.actionType === "craft") {
    const recipe = getRecipeById(queued.actionId);
    if (recipe) applyCraftToProjection(state, recipe);
  } else if (queued.actionType === "gather") {
    const action = getActionById(queued.actionId);
    if (action) applyGatherToProjection(state, action);
  }
  // expeditions, routines: no projection
}

function applyCraftToProjection(state: GameState, recipe: RecipeDef): void {
  const inputs = getEffectiveInputs(recipe, state);
  const resolved = resolveAlternateInputs(inputs, state);
  for (const inp of resolved) {
    state.resources[inp.resourceId] = (state.resources[inp.resourceId] ?? 0) - inp.amount;
  }

  if (recipe.tagInputs) {
    const tagResolved = resolveTagInputs(recipe.tagInputs, state);
    if (tagResolved) {
      for (const inp of tagResolved) {
        state.resources[inp.resourceId] = (state.resources[inp.resourceId] ?? 0) - inp.amount;
      }
    }
  }

  if (recipe.output) {
    state.resources[recipe.output.resourceId] =
      (state.resources[recipe.output.resourceId] ?? 0) + recipe.output.amount;
  }

  if (recipe.toolOutput && !state.tools.includes(recipe.toolOutput)) {
    state.tools.push(recipe.toolOutput);
  }

  if (recipe.buildingOutput) {
    if (recipe.replacesBuilding) {
      const idx = state.buildings.indexOf(recipe.replacesBuilding);
      if (idx >= 0) state.buildings.splice(idx, 1);
    }
    state.buildings.push(recipe.buildingOutput);
  }

  if (!state.completedRecipes.includes(recipe.id)) {
    state.completedRecipes.push(recipe.id);
  }
}

function applyGatherToProjection(state: GameState, action: ActionDef): void {
  for (const drop of action.drops) {
    state.resources[drop.resourceId] = (state.resources[drop.resourceId] ?? 0) + drop.amount;
  }
}
