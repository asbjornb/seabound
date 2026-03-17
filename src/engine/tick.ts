import { ACTIONS } from "../data/actions";
import { EXPEDITIONS } from "../data/expeditions";
import { getDropChanceBonus, getDoubleOutputChance, getDurationMultiplier } from "../data/milestones";
import { RECIPES } from "../data/recipes";
import { levelFromXp } from "../data/skills";
import { BiomeId, Drop, ExpeditionOutcome, GameState } from "../data/types";
import { addResource, deductFood, deductWater, getMoraleDurationMultiplier, getToolSpeedMultiplier, MORALE_DECAY_INTERVAL_MS, getTotalFood, getTotalWater } from "./gameState";

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
  newResources?: string[]; // resource IDs seen for the first time
  buildingBuilt?: string; // building ID if a building was constructed
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
    // No action running — skip morale decay so idle players aren't punished
    return { completions, elapsedMs };
  }

  // Morale decay: 1 point per MORALE_DECAY_INTERVAL_MS (only while an action is active)
  if (state.morale > 0) {
    const decayPoints = Math.floor(elapsedMs / MORALE_DECAY_INTERVAL_MS);
    if (decayPoints > 0) {
      state.morale = Math.max(0, state.morale - decayPoints);
    }
  }

  const action = state.currentAction;
  const timeAvailable = now - action.startedAt;

  if (action.type === "gather") {
    const def = ACTIONS.find((a) => a.id === action.actionId);
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs };
    }

    const skillLevel = state.skills[def.skillId].level;
    const moraleMultiplier = getMoraleDurationMultiplier(state.morale);
    const toolMultiplier = getToolSpeedMultiplier(state, def.id);
    const effectiveDuration = Math.round(
      def.durationMs * getDurationMultiplier(def.skillId, skillLevel, def.id) * moraleMultiplier * toolMultiplier
    );

    let remaining = timeAvailable;
    while (remaining >= effectiveDuration) {
      remaining -= effectiveDuration;
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

    const craftMoraleMultiplier = getMoraleDurationMultiplier(state.morale);
    const craftToolMultiplier = getToolSpeedMultiplier(state, def.id);
    const effectiveCraftDuration = Math.round(def.durationMs * craftMoraleMultiplier * craftToolMultiplier);

    if (def.repeatable) {
      let remaining = timeAvailable;
      while (remaining >= effectiveCraftDuration) {
        remaining -= effectiveCraftDuration;
        const event = applyCraftCompletion(state, def.id);
        if (event) completions.push(event);

        // Try to deduct inputs for the next cycle
        const canAfford = def.inputs.every(
          (input) => (state.resources[input.resourceId] ?? 0) >= input.amount
        );
        if (!canAfford) {
          state.currentAction = null;
          break;
        }
        for (const input of def.inputs) {
          state.resources[input.resourceId] =
            (state.resources[input.resourceId] ?? 0) - input.amount;
        }
      }

      if (state.currentAction) {
        state.currentAction.startedAt = now - remaining;
      }
    } else {
      if (timeAvailable >= effectiveCraftDuration) {
        const event = applyCraftCompletion(state, def.id);
        if (event) completions.push(event);
        state.currentAction = null;
      }
    }
  } else if (action.type === "expedition") {
    const def = EXPEDITIONS.find((e) => e.id === action.expeditionId);
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs };
    }

    const expMoraleMultiplier = getMoraleDurationMultiplier(state.morale);
    const effectiveExpDuration = Math.round(def.durationMs * expMoraleMultiplier);

    let remaining = timeAvailable;
    while (remaining >= effectiveExpDuration) {
      remaining -= effectiveExpDuration;
      const event = applyExpeditionCompletion(state, def.id);
      if (event) completions.push(event);

      // Check if we can afford the next cycle's food and water costs
      if (def.foodCost) {
        if (getTotalFood(state) < def.foodCost) {
          state.currentAction = null;
          break;
        }
      }
      if (def.waterCost) {
        if (getTotalWater(state) < def.waterCost) {
          state.currentAction = null;
          break;
        }
      }
      if (def.foodCost) {
        const paid = deductFood(state, def.foodCost);
        if (state.currentAction && paid) {
          state.currentAction.foodPaid = paid;
        }
      }
      if (def.waterCost) {
        const paid = deductWater(state, def.waterCost);
        if (state.currentAction && paid) {
          state.currentAction.waterPaid = paid;
        }
      }
    }

    if (state.currentAction) {
      state.currentAction.startedAt = now - remaining;
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

  const skillLevel = state.skills[def.skillId].level;
  const drops = rollDrops(def.drops, def.skillId, skillLevel, def.id);
  const newResources: string[] = [];
  for (const drop of drops) {
    if (!state.discoveredResources.includes(drop.resourceId)) {
      newResources.push(drop.resourceId);
      state.discoveredResources.push(drop.resourceId);
    }
    addResource(state, drop.resourceId, drop.amount);
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
    newResources: newResources.length > 0 ? newResources : undefined,
  };
}

function applyCraftCompletion(
  state: GameState,
  recipeId: string
): CompletionEvent | null {
  const def = RECIPES.find((r) => r.id === recipeId);
  if (!def) return null;

  const drops: { name: string; amount: number }[] = [];
  const newResources: string[] = [];
  let buildingBuilt: string | undefined;

  if (def.buildingOutput) {
    // Building construction — add to buildings list
    if (!state.buildings.includes(def.buildingOutput)) {
      state.buildings.push(def.buildingOutput);
    }
    buildingBuilt = def.buildingOutput;
    drops.push({ name: def.buildingOutput, amount: 1 });
  } else if (def.output) {
    // Normal craft — add output to resources
    if (!state.discoveredResources.includes(def.output.resourceId)) {
      newResources.push(def.output.resourceId);
      state.discoveredResources.push(def.output.resourceId);
    }
    let outputAmount = def.output.amount;

    // Double output milestone check
    const skill = state.skills[def.skillId];
    const doubleChance = getDoubleOutputChance(def.skillId, skill.level, def.id);
    if (doubleChance > 0 && Math.random() < doubleChance) {
      outputAmount *= 2;
    }

    addResource(state, def.output.resourceId, outputAmount);
    drops.push({ name: def.output.resourceId, amount: outputAmount });
  }
  // else: XP-only recipe (e.g. Maintain Camp) — no output to process

  // Morale boosts
  if (def.moraleGain) {
    state.morale = boostMorale(state.morale, def.moraleGain);
  }

  const skill = state.skills[def.skillId];
  const prevLevel = skill.level;
  skill.xp += def.xpGain;
  skill.level = levelFromXp(skill.xp);

  return {
    actionName: def.name,
    drops,
    xpGain: def.xpGain,
    skillId: def.skillId,
    levelUp: skill.level > prevLevel ? skill.level : undefined,
    newResources: newResources.length > 0 ? newResources : undefined,
    buildingBuilt,
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
  const newResources: string[] = [];
  if (outcome.drops) {
    for (const drop of outcome.drops) {
      const rolled = rollDrops([drop]);
      for (const r of rolled) {
        if (!state.discoveredResources.includes(r.resourceId)) {
          newResources.push(r.resourceId);
          state.discoveredResources.push(r.resourceId);
        }
        addResource(state, r.resourceId, r.amount);
        drops.push({ name: r.resourceId, amount: r.amount });
      }
    }
  }

  // XP for expeditions
  const skill = state.skills[def.skillId];
  const prevLevel = skill.level;
  skill.xp += def.xpGain;
  skill.level = levelFromXp(skill.xp);

  return {
    actionName: def.name,
    drops,
    xpGain: def.xpGain,
    skillId: def.skillId,
    levelUp: skill.level > prevLevel ? skill.level : undefined,
    biomeDiscovery: outcome.biomeDiscovery,
    expeditionMessage: outcome.description,
    newResources: newResources.length > 0 ? newResources : undefined,
  };
}

function pickWeightedOutcome(
  outcomes: ExpeditionOutcome[],
  state: GameState
): ExpeditionOutcome {
  // Filter out biome discoveries the player already has,
  // and outcomes whose required biomes haven't been discovered yet
  const adjusted = outcomes.map((o) => {
    if (o.biomeDiscovery && state.discoveredBiomes.includes(o.biomeDiscovery)) {
      return { ...o, weight: 0 };
    }
    if (o.requiredBiomes) {
      for (const req of o.requiredBiomes) {
        if (!state.discoveredBiomes.includes(req)) {
          return { ...o, weight: 0 };
        }
      }
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

/** Boost morale with diminishing returns above 100 (soft cap). */
function boostMorale(current: number, amount: number): number {
  if (current < 100) {
    // Below 100: full effect, but don't overshoot past 100 without diminishing
    const belowCap = Math.min(amount, 100 - current);
    const aboveCap = amount - belowCap;
    current += belowCap;
    if (aboveCap > 0) {
      current += Math.floor(aboveCap / 2);
    }
  } else {
    // Above 100: half effect
    current += Math.floor(amount / 2);
  }
  return current;
}

function rollDrops(
  drops: Drop[],
  skillId?: string,
  skillLevel?: number,
  actionId?: string
): { resourceId: string; amount: number }[] {
  const result: { resourceId: string; amount: number }[] = [];
  for (const drop of drops) {
    let chance = drop.chance ?? 1;
    if (skillId && skillLevel && actionId) {
      chance = Math.min(
        1,
        chance + getDropChanceBonus(skillId as any, skillLevel, actionId, drop.resourceId)
      );
    }
    if (Math.random() < chance) {
      result.push({ resourceId: drop.resourceId, amount: drop.amount });
    }
  }
  return result;
}
