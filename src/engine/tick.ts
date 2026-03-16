import { ACTIONS } from "../data/actions";
import { EXPEDITIONS } from "../data/expeditions";
import { RECIPES } from "../data/recipes";
import { levelFromXp } from "../data/skills";
import { BiomeId, Drop, ExpeditionOutcome, GameState } from "../data/types";

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
  biomeDiscovery?: BiomeId;
  expeditionMessage?: string;
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
  const timeAvailable = now - action.startedAt;

  if (action.type === "gather") {
    const def = ACTIONS.find((a) => a.id === action.actionId);
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs };
    }

    let remaining = timeAvailable;
    while (remaining >= def.durationMs) {
      remaining -= def.durationMs;
      const event = applyGatherCompletion(state, def.id);
      if (event) completions.push(event);
    }

    if (state.currentAction) {
      state.currentAction.startedAt = now - remaining;
    }
  } else if (action.type === "craft") {
    const def = RECIPES.find((r) => r.id === action.recipeId);
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs };
    }

    if (timeAvailable >= def.durationMs) {
      const event = applyCraftCompletion(state, def.id);
      if (event) completions.push(event);
      state.currentAction = null;
    }
  } else if (action.type === "expedition") {
    const def = EXPEDITIONS.find((e) => e.id === action.expeditionId);
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs };
    }

    if (timeAvailable >= def.durationMs) {
      const event = applyExpeditionCompletion(state, def.id);
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

function applyExpeditionCompletion(
  state: GameState,
  expeditionId: string
): CompletionEvent | null {
  const def = EXPEDITIONS.find((e) => e.id === expeditionId);
  if (!def) return null;

  // Pick a random outcome weighted by weight
  const outcome = pickWeightedOutcome(def.outcomes, state);

  // Apply biome discovery
  if (outcome.biomeDiscovery && !state.discoveredBiomes.includes(outcome.biomeDiscovery)) {
    state.discoveredBiomes.push(outcome.biomeDiscovery);
  }

  // Apply drops
  const drops: { name: string; amount: number }[] = [];
  if (outcome.drops) {
    for (const drop of outcome.drops) {
      const rolled = rollDrops([drop]);
      for (const r of rolled) {
        state.resources[r.resourceId] =
          (state.resources[r.resourceId] ?? 0) + r.amount;
        drops.push({ name: r.resourceId, amount: r.amount });
      }
    }
  }

  // Navigation XP for expeditions
  const navSkill = state.skills.navigation;
  const prevLevel = navSkill.level;
  navSkill.xp += 15;
  navSkill.level = levelFromXp(navSkill.xp);

  return {
    actionName: def.name,
    drops,
    xpGain: 15,
    skillId: "navigation",
    levelUp: navSkill.level > prevLevel ? navSkill.level : undefined,
    biomeDiscovery: outcome.biomeDiscovery,
    expeditionMessage: outcome.description,
  };
}

function pickWeightedOutcome(
  outcomes: ExpeditionOutcome[],
  state: GameState
): ExpeditionOutcome {
  // Filter out biome discoveries the player already has
  const adjusted = outcomes.map((o) => {
    if (o.biomeDiscovery && state.discoveredBiomes.includes(o.biomeDiscovery)) {
      // If already discovered, redistribute weight to other outcomes
      return { ...o, weight: 0 };
    }
    return o;
  });

  const totalWeight = adjusted.reduce((sum, o) => sum + o.weight, 0);
  if (totalWeight === 0) {
    // All biomes discovered, return a generic "nothing found" outcome
    return {
      weight: 1,
      description: "You explore familiar territory. Nothing new to find.",
    };
  }

  let roll = Math.random() * totalWeight;
  for (const outcome of adjusted) {
    roll -= outcome.weight;
    if (roll <= 0) return outcome;
  }
  return adjusted[adjusted.length - 1];
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
