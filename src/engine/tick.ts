import { getDropChanceBonus, getDoubleOutputChance, getDurationMultiplier, getExpeditionBiomeBonus, getExpeditionDropBonus } from "../data/milestones";
import {
  getActionById,
  getBuildings,
  getExpeditionById,
  getRecipeById,
} from "../data/registry";
import { levelFromXp } from "../data/skills";
import type { BiomeId, Drop, ExpeditionOutcome, GameState } from "../data/types";
import { addResource, deductFood, deductWater, getEffectiveInputs, getEffectiveMaxCount, getStorageLimit, resolveTagInputs, getMoraleDurationMultiplier, getToolSpeedMultiplier, getToolOutputBonusChance, MORALE_DECAY_INTERVAL_MS, getTotalFood, getTotalWater } from "./gameState";
import { applyRepetitiveXp, getFullXpThreshold } from "./repetitiveXp";
import { resourceHasUse } from "./selectors";

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
  toolCrafted?: string; // tool ID if a tool was crafted
}

/** Check if any output resource for the current action is at storage capacity. */
function isOutputFull(state: GameState): boolean {
  const action = state.currentAction;
  if (!action) return false;

  if (action.type === "gather") {
    const def = getActionById(action.actionId);
    if (!def) return false;
    const fullAtStart = action.fullAtStart ?? [];
    const relevant = def.drops.filter((d) => (!d.chance || d.chance >= 1) && !fullAtStart.includes(d.resourceId));
    if (relevant.length === 0) return false;
    return relevant.every((d) => {
      const current = state.resources[d.resourceId] ?? 0;
      return current >= getStorageLimit(state, d.resourceId);
    });
  }

  if (action.type === "craft") {
    const def = action.recipeId ? getRecipeById(action.recipeId) : undefined;
    if (!def?.output) return false;
    const fullAtStart = action.fullAtStart ?? [];
    if (fullAtStart.includes(def.output.resourceId)) return false;
    const current = state.resources[def.output.resourceId] ?? 0;
    return current >= getStorageLimit(state, def.output.resourceId);
  }

  return false;
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
    cleanupObsoleteResources(state);
    // No action running — skip morale decay so idle players aren't punished
    return { completions, elapsedMs };
  }

  // Morale decay: 1 point per MORALE_DECAY_INTERVAL_MS (only while an action is active)
  if (state.morale > 0) {
    state.moraleDecayProgressMs += elapsedMs;
    if (state.moraleDecayProgressMs >= MORALE_DECAY_INTERVAL_MS) {
      const decayPoints = Math.floor(state.moraleDecayProgressMs / MORALE_DECAY_INTERVAL_MS);
      state.moraleDecayProgressMs %= MORALE_DECAY_INTERVAL_MS;
      state.morale = Math.max(0, state.morale - decayPoints);
    }
  }

  const action = state.currentAction;
  const timeAvailable = now - action.startedAt;
  const fullXpThreshold = getFullXpThreshold(state);

  if (action.type === "gather") {
    const def = getActionById(action.actionId);
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
      const event = applyGatherCompletion(state, def.id, state.repetitiveActionCount, fullXpThreshold);
      if (event) completions.push(event);
      if (state.stopWhenFull && isOutputFull(state)) {
        state.currentAction = null;
        break;
      }
    }

    if (state.currentAction) {
      state.currentAction.startedAt = now - remaining;
    }
  } else if (action.type === "craft") {
    const recipeId = action.recipeId;
    const def = recipeId ? getRecipeById(recipeId) : undefined;
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs };
    }

    const craftMoraleMultiplier = getMoraleDurationMultiplier(state.morale);
    const craftToolMultiplier = getToolSpeedMultiplier(state, def.id);
    const craftSkillLevel = state.skills[def.skillId]?.level ?? 1;
    const craftMilestoneMultiplier = getDurationMultiplier(def.skillId, craftSkillLevel, def.id);
    const effectiveCraftDuration = Math.round(def.durationMs * craftMilestoneMultiplier * craftMoraleMultiplier * craftToolMultiplier);

    const effectiveInputs = getEffectiveInputs(def, state);

    if (def.repeatable) {
      let remaining = timeAvailable;
      while (remaining >= effectiveCraftDuration) {
        // Check and consume inputs for this cycle
        const canAfford = effectiveInputs.every(
          (input) => (state.resources[input.resourceId] ?? 0) >= input.amount
        );
        // Resolve tag-based inputs (e.g. "5 different foods")
        const resolvedTagInputs = def.tagInputs ? resolveTagInputs(def.tagInputs, state) : [];
        if (!canAfford || !resolvedTagInputs) {
          state.currentAction = null;
          break;
        }
        for (const input of effectiveInputs) {
          state.resources[input.resourceId] =
            (state.resources[input.resourceId] ?? 0) - input.amount;
        }
        for (const input of resolvedTagInputs) {
          state.resources[input.resourceId] =
            (state.resources[input.resourceId] ?? 0) - input.amount;
        }
        remaining -= effectiveCraftDuration;
        const event = applyCraftCompletion(state, def.id, state.repetitiveActionCount, fullXpThreshold);
        if (event) completions.push(event);
        if (state.stopWhenFull && isOutputFull(state)) {
          state.currentAction = null;
          break;
        }
      }

      // Stop if player can't afford the next cycle
      if (state.currentAction) {
        const canAffordNext = effectiveInputs.every(
          (input) => (state.resources[input.resourceId] ?? 0) >= input.amount
        );
        const resolvedNext = def.tagInputs ? resolveTagInputs(def.tagInputs, state) : [];
        if (!canAffordNext || !resolvedNext) {
          state.currentAction = null;
        } else {
          state.currentAction.startedAt = now - remaining;
        }
      }
    } else {
      if (timeAvailable >= effectiveCraftDuration) {
        // Consume inputs at completion
        const canAfford = effectiveInputs.every(
          (input) => (state.resources[input.resourceId] ?? 0) >= input.amount
        );
        const resolvedTagInputs = def.tagInputs ? resolveTagInputs(def.tagInputs, state) : [];
        if (!canAfford || !resolvedTagInputs) {
          state.currentAction = null;
        } else {
          for (const input of effectiveInputs) {
            state.resources[input.resourceId] =
              (state.resources[input.resourceId] ?? 0) - input.amount;
          }
          for (const input of resolvedTagInputs) {
            state.resources[input.resourceId] =
              (state.resources[input.resourceId] ?? 0) - input.amount;
          }
          const event = applyCraftCompletion(state, def.id, state.repetitiveActionCount, fullXpThreshold);
          if (event) completions.push(event);
          state.currentAction = null;
        }
      }
    }
  } else if (action.type === "expedition") {
    const expeditionId = action.expeditionId;
    const def = expeditionId ? getExpeditionById(expeditionId) : undefined;
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs };
    }

    const expMoraleMultiplier = getMoraleDurationMultiplier(state.morale);
    const expSkillLevel = state.skills[def.skillId]?.level ?? 1;
    const expMilestoneMultiplier = getDurationMultiplier(def.skillId, expSkillLevel, def.id);
    const effectiveExpDuration = Math.round(def.durationMs * expMilestoneMultiplier * expMoraleMultiplier);

    let remaining = timeAvailable;
    while (remaining >= effectiveExpDuration) {
      // Check and consume food/water for this cycle
      if (def.foodCost && getTotalFood(state) < def.foodCost) {
        state.currentAction = null;
        break;
      }
      if (def.waterCost && getTotalWater(state) < def.waterCost) {
        state.currentAction = null;
        break;
      }
      if (def.foodCost) deductFood(state, def.foodCost);
      if (def.waterCost) deductWater(state, def.waterCost);

      remaining -= effectiveExpDuration;
      const event = applyExpeditionCompletion(state, def.id, state.repetitiveActionCount, fullXpThreshold);
      if (event) completions.push(event);
    }

    // Stop if player can't afford the next expedition cycle
    if (state.currentAction) {
      if ((def.foodCost && getTotalFood(state) < def.foodCost) ||
          (def.waterCost && getTotalWater(state) < def.waterCost)) {
        state.currentAction = null;
      } else {
        state.currentAction.startedAt = now - remaining;
      }
    }
  }

  cleanupObsoleteResources(state);
  return { completions, elapsedMs };
}

/** Clean up resources that have no remaining use in any recipe. */
function cleanupObsoleteResources(state: GameState): void {
  // Check bamboo_splinter specifically (backward compat)
  if ((state.resources["bamboo_splinter"] ?? 0) < 1) return;
  if (resourceHasUse("bamboo_splinter", state)) return;
  delete state.resources["bamboo_splinter"];
}

function applyGatherCompletion(
  state: GameState,
  actionId: string,
  repetitiveCount: number,
  fullXpThreshold: number
): CompletionEvent | null {
  const def = getActionById(actionId);
  if (!def) return null;

  const skillLevel = state.skills[def.skillId].level;
  const usefulDrops = def.drops.filter((d) => resourceHasUse(d.resourceId, state));
  const drops = rollDrops(usefulDrops, def.skillId, skillLevel, def.id);
  const newResources: string[] = [];
  for (const drop of drops) {
    if (!state.discoveredResources.includes(drop.resourceId)) {
      newResources.push(drop.resourceId);
      state.discoveredResources.push(drop.resourceId);
    }
    addResource(state, drop.resourceId, drop.amount);
  }

  // Track first completion
  if (!state.completedActions.includes(def.id)) {
    state.completedActions.push(def.id);
  }

  const skill = state.skills[def.skillId];
  const prevLevel = skill.level;
  const xpGain = applyRepetitiveXp(def.xpGain, repetitiveCount, fullXpThreshold);
  skill.xp += xpGain;
  skill.level = levelFromXp(skill.xp);
  state.repetitiveActionCount += 1;

  return {
    actionName: def.name,
    drops: drops.map((d) => ({ name: d.resourceId, amount: d.amount })),
    xpGain,
    skillId: def.skillId,
    levelUp: skill.level > prevLevel ? skill.level : undefined,
    newResources: newResources.length > 0 ? newResources : undefined,
  };
}

function applyCraftCompletion(
  state: GameState,
  recipeId: string,
  repetitiveCount: number,
  fullXpThreshold: number
): CompletionEvent | null {
  const def = getRecipeById(recipeId);
  if (!def) return null;

  const BUILDINGS = getBuildings();
  const drops: { name: string; amount: number }[] = [];
  const newResources: string[] = [];
  let buildingBuilt: string | undefined;
  let toolCrafted: string | undefined;

  if (def.toolOutput) {
    // Tool craft — add to tools list
    if (!state.tools.includes(def.toolOutput)) {
      state.tools.push(def.toolOutput);
    }
    toolCrafted = def.toolOutput;
    drops.push({ name: def.toolOutput, amount: 1 });
  } else if (def.buildingOutput) {
    // Building upgrade — remove one instance of the replaced building
    if (def.replacesBuilding) {
      const idx = state.buildings.indexOf(def.replacesBuilding);
      if (idx !== -1) {
        state.buildings.splice(idx, 1);
      }
    }
    // Building construction — add to buildings list
    const bdef = BUILDINGS[def.buildingOutput];
    const isStackable = bdef?.maxCount && bdef.maxCount > 1;
    if (isStackable) {
      // Stackable buildings allow duplicates, up to effective maxCount
      const currentCount = state.buildings.filter((b) => b === def.buildingOutput).length;
      if (currentCount < getEffectiveMaxCount(state, def.buildingOutput)) {
        state.buildings.push(def.buildingOutput);
      }
    } else if (!state.buildings.includes(def.buildingOutput)) {
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

    // Tool output bonus (+1 chance)
    const toolBonusChance = getToolOutputBonusChance(state, def.id);
    if (toolBonusChance > 0 && Math.random() < toolBonusChance) {
      outputAmount += 1;
    }

    addResource(state, def.output.resourceId, outputAmount);
    drops.push({ name: def.output.resourceId, amount: outputAmount });
  }
  // else: XP-only recipe (e.g. Maintain Camp) — no output to process

  // Track first completion
  if (!state.completedRecipes.includes(def.id)) {
    state.completedRecipes.push(def.id);
  }

  // Morale boosts
  if (def.moraleGain) {
    state.morale = boostMorale(state.morale, def.moraleGain);
  }

  const skill = state.skills[def.skillId];
  const prevLevel = skill.level;
  const xpGain = applyRepetitiveXp(def.xpGain, repetitiveCount, fullXpThreshold);
  skill.xp += xpGain;
  skill.level = levelFromXp(skill.xp);
  state.repetitiveActionCount += 1;

  return {
    actionName: def.name,
    drops,
    xpGain,
    skillId: def.skillId,
    levelUp: skill.level > prevLevel ? skill.level : undefined,
    newResources: newResources.length > 0 ? newResources : undefined,
    buildingBuilt,
    toolCrafted,
  };
}

function applyExpeditionCompletion(
  state: GameState,
  expeditionId: string,
  repetitiveCount: number,
  fullXpThreshold: number
): CompletionEvent | null {
  const def = getExpeditionById(expeditionId);
  if (!def) return null;

  // Pick a random outcome weighted by weight (with pity for biome discoveries)
  const pityCount = state.expeditionPity[expeditionId] ?? 0;
  const navLevel = state.skills[def.skillId]?.level ?? 1;
  const biomeBonus = getExpeditionBiomeBonus(def.skillId, navLevel);
  const outcome = pickWeightedOutcome(def.outcomes, state, pityCount, biomeBonus);

  // Apply biome discovery and update pity counter
  if (outcome.biomeDiscovery && !state.discoveredBiomes.includes(outcome.biomeDiscovery)) {
    state.discoveredBiomes.push(outcome.biomeDiscovery);
    state.expeditionPity[expeditionId] = 0;
  } else {
    // Check if there are any undiscovered biomes left on this expedition
    const hasUndiscoveredBiome = def.outcomes.some(
      (o) => o.biomeDiscovery && !state.discoveredBiomes.includes(o.biomeDiscovery)
    );
    if (hasUndiscoveredBiome) {
      state.expeditionPity[expeditionId] = pityCount + 1;
    }
  }

  // Apply drops (with expedition drop bonus from milestones)
  const drops: { name: string; amount: number }[] = [];
  const newResources: string[] = [];
  const dropBonus = getExpeditionDropBonus(def.skillId, navLevel);
  if (outcome.drops) {
    for (const drop of outcome.drops) {
      const rolled = rollDrops([drop]);
      for (const r of rolled) {
        const boostedAmount = dropBonus > 0
          ? Math.round(r.amount * (1 + dropBonus))
          : r.amount;
        if (!state.discoveredResources.includes(r.resourceId)) {
          newResources.push(r.resourceId);
          state.discoveredResources.push(r.resourceId);
        }
        addResource(state, r.resourceId, boostedAmount);
        drops.push({ name: r.resourceId, amount: boostedAmount });
      }
    }
  }

  // XP for expeditions
  const skill = state.skills[def.skillId];
  const prevLevel = skill.level;
  const xpGain = applyRepetitiveXp(def.xpGain, repetitiveCount, fullXpThreshold);
  skill.xp += xpGain;
  skill.level = levelFromXp(skill.xp);
  state.repetitiveActionCount += 1;

  return {
    actionName: def.name,
    drops,
    xpGain,
    skillId: def.skillId,
    levelUp: skill.level > prevLevel ? skill.level : undefined,
    biomeDiscovery: outcome.biomeDiscovery,
    expeditionMessage: outcome.description,
    newResources: newResources.length > 0 ? newResources : undefined,
  };
}

function pickWeightedOutcome(
  outcomes: ExpeditionOutcome[],
  state: GameState,
  pityCount: number = 0,
  biomeBonus: number = 0
): ExpeditionOutcome {
  // Filter out biome discoveries the player already has,
  // and outcomes whose required biomes haven't been discovered yet.
  // Boost undiscovered biome weights by pity + milestone bonus.
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
    // Pity + milestone: boost undiscovered biome outcome weights
    if (o.biomeDiscovery) {
      return { ...o, weight: o.weight + pityCount * 0.3 + biomeBonus };
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
        chance + getDropChanceBonus(skillId, skillLevel, actionId, drop.resourceId)
      );
    }
    if (Math.random() < chance) {
      result.push({ resourceId: drop.resourceId, amount: drop.amount });
    }
  }
  return result;
}
