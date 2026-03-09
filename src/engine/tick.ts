import { ACTIONS } from "../data/actions";
import { RECIPES } from "../data/recipes";
import { levelFromXp } from "../data/skills";
import { Drop, GameState } from "../data/types";

export interface TickResult {
  completions: CompletionEvent[];
  elapsedMs: number;
}

export interface CompletionEvent {
  actionName: string;
  drops: { name: string; amount: number }[];
  xpGain: number;
  skillId: string;
  levelUp?: number;
}

/**
 * Process elapsed time, completing as many actions as fit in the time window.
 * This handles offline progress by simulating all completed cycles.
 */
export function processTick(state: GameState, now: number): TickResult {
  const elapsedMs = now - state.lastTickAt;
  state.lastTickAt = now;
  state.totalPlayTimeMs += elapsedMs;

  const completions: CompletionEvent[] = [];

  if (!state.currentAction) {
    return { completions, elapsedMs };
  }

  const action = state.currentAction;
  let timeAvailable = now - action.startedAt;

  if (action.type === "gather") {
    const def = ACTIONS.find((a) => a.id === action.actionId);
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs };
    }

    // Process all completed cycles
    while (timeAvailable >= def.durationMs) {
      timeAvailable -= def.durationMs;
      const event = applyGatherCompletion(state, def.id);
      if (event) completions.push(event);
    }

    // If still has remaining time, reset startedAt to reflect partial progress
    if (state.currentAction) {
      state.currentAction.startedAt = now - timeAvailable;
    }
  } else if (action.type === "craft") {
    const def = RECIPES.find((r) => r.id === action.recipeId);
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs };
    }

    // Crafting completes once (doesn't auto-repeat)
    if (timeAvailable >= def.durationMs) {
      const event = applyCraftCompletion(state, def.id);
      if (event) completions.push(event);
      state.currentAction = null;
    }
  }

  return { completions, elapsedMs };
}

function applyGatherCompletion(
  state: GameState,
  actionId: string
): CompletionEvent | null {
  const def = ACTIONS.find((a) => a.id === actionId);
  if (!def) return null;

  const drops = rollDrops(def.drops);
  for (const drop of drops) {
    state.resources[drop.resourceId] =
      (state.resources[drop.resourceId] ?? 0) + drop.amount;
  }

  const skill = state.skills[def.skillId];
  const prevLevel = skill.level;
  skill.xp += def.xpGain;
  skill.level = levelFromXp(skill.xp);

  return {
    actionName: def.name,
    drops: drops.map((d) => ({ name: d.resourceId, amount: d.amount })),
    xpGain: def.xpGain,
    skillId: def.skillId,
    levelUp: skill.level > prevLevel ? skill.level : undefined,
  };
}

function applyCraftCompletion(
  state: GameState,
  recipeId: string
): CompletionEvent | null {
  const def = RECIPES.find((r) => r.id === recipeId);
  if (!def) return null;

  // Add output
  state.resources[def.output.resourceId] =
    (state.resources[def.output.resourceId] ?? 0) + def.output.amount;

  const skill = state.skills[def.skillId];
  const prevLevel = skill.level;
  skill.xp += def.xpGain;
  skill.level = levelFromXp(skill.xp);

  return {
    actionName: def.name,
    drops: [{ name: def.output.resourceId, amount: def.output.amount }],
    xpGain: def.xpGain,
    skillId: def.skillId,
    levelUp: skill.level > prevLevel ? skill.level : undefined,
  };
}

function rollDrops(
  drops: Drop[]
): { resourceId: string; amount: number }[] {
  const result: { resourceId: string; amount: number }[] = [];
  for (const drop of drops) {
    const chance = drop.chance ?? 1;
    if (Math.random() < chance) {
      result.push({ resourceId: drop.resourceId, amount: drop.amount });
    }
  }
  return result;
}
