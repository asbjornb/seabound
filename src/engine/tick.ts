import { getDropChanceBonus, getDoubleOutputChance, getDurationMultiplier, getExpeditionBiomeBonus, getExpeditionDropBonus, getOutputChanceBonus } from "../data/milestones";
import {
  getActionById,
  getAffixes,
  getBuildings,
  getEquipmentItemById,
  getExpeditionById,
  getItemDisplayName,
  getRecipeById,
} from "../data/registry";
import { levelFromXp } from "../data/skills";
import type { BiomeId, Drop, EquipmentDropEntry, EquipmentItem, ExpeditionOutcome, GameState, LootDrop } from "../data/types";
import { resolveEncounter, type EncounterResult } from "./combat";
import { addResource, canAffordInput, deductFood, deductWater, getEffectiveInputs, getEffectiveMaxCount, getGroupBuildingCount, isAtStorageCap, isRecipeOutputBlocked, resolveAlternateInputs, resolveTagInputs, getMoraleDurationMultiplier, getToolSpeedMultiplier, getToolOutputBonusChance, getEffectiveDecayInterval, getTotalFood, getTotalWater, getBuildingExpeditionSpeedMultiplier } from "./gameState";
import { applyRepetitiveXp, getFullXpThreshold } from "./repetitiveXp";
import { resourceHasUse } from "./selectors";

export interface TickResult {
  completions: CompletionEvent[];
  elapsedMs: number;
  /** Milliseconds of action time unused when the action was stopped mid-window
   *  (e.g. storage full, inputs ran out). Used by offline processing to credit
   *  remaining time to the next queued/routine action. */
  unusedMs: number;
}

export interface CompletionEvent {
  actionId: string;
  actionType: "gather" | "craft" | "expedition";
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
  victory?: boolean; // true if this completion wins the game
  encounterResult?: EncounterResult; // present on mainland expeditions with difficulty profiles
  equipmentDropped?: { defId: string; name: string; condition: string }[]; // equipment items gained
}

/** Check if any output resource for the current action is at storage capacity. */
function isOutputFull(state: GameState): boolean {
  const action = state.currentAction;
  if (!action) return false;

  if (action.type === "gather") {
    const def = getActionById(action.actionId);
    if (!def) return false;
    const fullAtStart = action.fullAtStart ?? [];
    const guaranteed = def.drops.filter((d) => (d.chance == null || d.chance >= 1) && !fullAtStart.includes(d.resourceId));
    // If there are guaranteed drops, check those; otherwise check all probabilistic drops
    const relevant = guaranteed.length > 0
      ? guaranteed
      : def.drops.filter((d) => !fullAtStart.includes(d.resourceId));
    if (relevant.length === 0) return false;
    return relevant.every((d) => isAtStorageCap(state, d.resourceId));
  }

  if (action.type === "craft") {
    const def = action.recipeId ? getRecipeById(action.recipeId) : undefined;
    if (!def?.output) return false;
    const fullAtStart = action.fullAtStart ?? [];
    if (fullAtStart.includes(def.output.resourceId)) return false;
    return isAtStorageCap(state, def.output.resourceId);
  }

  return false;
}

/**
 * Process elapsed time, completing as many actions as fit in the time window.
 * This handles offline progress by simulating all completed cycles.
 */
export function processTick(state: GameState, now: number): TickResult {
  const elapsedMs = Math.max(0, now - state.lastTickAt);
  state.lastTickAt = now;
  state.totalPlayTimeMs += elapsedMs;

  const completions: CompletionEvent[] = [];

  if (!state.currentAction) {
    cleanupObsoleteResources(state);
    // No action running — return elapsed time as unusedMs so offline/queue
    // processing can credit it to the next queued action.
    // Skip morale decay so idle players aren't punished.
    return { completions, elapsedMs, unusedMs: elapsedMs };
  }

  // Guard against clock skew: if startedAt is in the future, reset it to now
  if (state.currentAction.startedAt > now) {
    state.currentAction.startedAt = now;
  }

  // Morale decay: 1 point per effective interval (only while an action is active)
  // Comfort buildings slow the decay rate
  if (state.morale > 0) {
    const decayInterval = getEffectiveDecayInterval(state);
    state.moraleDecayProgressMs += elapsedMs;
    if (state.moraleDecayProgressMs >= decayInterval) {
      const decayPoints = Math.floor(state.moraleDecayProgressMs / decayInterval);
      state.moraleDecayProgressMs %= decayInterval;
      state.morale = Math.max(0, state.morale - decayPoints);
    }
  }

  const action = state.currentAction;
  const timeAvailable = now - action.startedAt;
  const fullXpThreshold = getFullXpThreshold(state);
  let unusedMs = 0;

  if (action.type === "gather") {
    const def = getActionById(action.actionId);
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs, unusedMs: 0 };
    }

    const skillLevel = state.skills[def.skillId].level;
    const moraleMultiplier = getMoraleDurationMultiplier(state.morale);
    const toolMultiplier = getToolSpeedMultiplier(state, def.id);
    const effectiveDuration = Math.max(100, Math.round(
      def.durationMs * getDurationMultiplier(def.skillId, skillLevel, def.id) * moraleMultiplier * toolMultiplier
    ));

    let remaining = timeAvailable;
    while (remaining >= effectiveDuration) {
      remaining -= effectiveDuration;
      const event = applyGatherCompletion(state, def.id, state.repetitiveActionCount, fullXpThreshold);
      if (event) completions.push(event);
      if (isOutputFull(state)) {
        unusedMs = remaining;
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
      return { completions, elapsedMs, unusedMs: 0 };
    }

    const craftMoraleMultiplier = getMoraleDurationMultiplier(state.morale);
    const craftToolMultiplier = getToolSpeedMultiplier(state, def.id);
    const craftSkillLevel = state.skills[def.skillId]?.level ?? 1;
    const craftMilestoneMultiplier = getDurationMultiplier(def.skillId, craftSkillLevel, def.id);
    const effectiveCraftDuration = Math.max(100, Math.round(def.durationMs * craftMilestoneMultiplier * craftMoraleMultiplier * craftToolMultiplier));

    const effectiveInputs = getEffectiveInputs(def, state);

    if (def.repeatable) {
      let remaining = timeAvailable;
      while (remaining >= effectiveCraftDuration) {
        // Block if output storage is full (but allow if inputs free space in the same group)
        if (def.output && isRecipeOutputBlocked(state, def.output.resourceId, effectiveInputs)) {
          unusedMs = remaining;
          state.currentAction = null;
          break;
        }
        // Check and consume inputs for this cycle
        const canAfford = effectiveInputs.every(
          (input) => canAffordInput(input, state)
        );
        // Resolve tag-based inputs (e.g. "5 different foods")
        const resolvedTagInputs = def.tagInputs ? resolveTagInputs(def.tagInputs, state) : [];
        if (!canAfford || !resolvedTagInputs) {
          unusedMs = remaining;
          state.currentAction = null;
          break;
        }
        const resolvedInputs = resolveAlternateInputs(effectiveInputs, state);
        for (const input of resolvedInputs) {
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
        if (def.output && isRecipeOutputBlocked(state, def.output.resourceId, effectiveInputs)) {
          unusedMs = remaining;
          state.currentAction = null;
          break;
        }
      }

      // Stop if player can't afford the next cycle
      if (state.currentAction) {
        const canAffordNext = effectiveInputs.every(
          (input) => canAffordInput(input, state)
        );
        const resolvedNext = def.tagInputs ? resolveTagInputs(def.tagInputs, state) : [];
        if (!canAffordNext || !resolvedNext) {
          unusedMs = remaining;
          state.currentAction = null;
        } else {
          state.currentAction.startedAt = now - remaining;
        }
      }
    } else {
      if (timeAvailable >= effectiveCraftDuration) {
        // Block if output storage is full (but allow if inputs free space in the same group)
        if (def.output && isRecipeOutputBlocked(state, def.output.resourceId, effectiveInputs)) {
          unusedMs = timeAvailable - effectiveCraftDuration;
          state.currentAction = null;
        } else {
          // Consume inputs at completion
          const canAfford = effectiveInputs.every(
            (input) => canAffordInput(input, state)
          );
          const resolvedTagInputs = def.tagInputs ? resolveTagInputs(def.tagInputs, state) : [];
          if (!canAfford || !resolvedTagInputs) {
            state.currentAction = null;
          } else {
            const resolvedInputs = resolveAlternateInputs(effectiveInputs, state);
            for (const input of resolvedInputs) {
              state.resources[input.resourceId] =
                (state.resources[input.resourceId] ?? 0) - input.amount;
            }
            for (const input of resolvedTagInputs) {
              state.resources[input.resourceId] =
                (state.resources[input.resourceId] ?? 0) - input.amount;
            }
            const event = applyCraftCompletion(state, def.id, state.repetitiveActionCount, fullXpThreshold);
            if (event) completions.push(event);
            unusedMs = timeAvailable - effectiveCraftDuration;
            state.currentAction = null;
          }
        }
      }
    }
  } else if (action.type === "expedition") {
    const expeditionId = action.expeditionId;
    const def = expeditionId ? getExpeditionById(expeditionId) : undefined;
    if (!def) {
      state.currentAction = null;
      return { completions, elapsedMs, unusedMs: 0 };
    }

    const expMoraleMultiplier = getMoraleDurationMultiplier(state.morale);
    const expSkillLevel = state.skills[def.skillId]?.level ?? 1;
    const expMilestoneMultiplier = getDurationMultiplier(def.skillId, expSkillLevel, def.id);
    const expBuildingMultiplier = getBuildingExpeditionSpeedMultiplier(state, def.skillId);
    const effectiveExpDuration = Math.max(100, Math.round(def.durationMs * expMilestoneMultiplier * expMoraleMultiplier * expBuildingMultiplier));

    let remaining = timeAvailable;
    while (remaining >= effectiveExpDuration) {
      // Check and consume food/water for this cycle
      if (def.foodCost && getTotalFood(state) < def.foodCost) {
        unusedMs = remaining;
        state.currentAction = null;
        break;
      }
      if (def.waterCost && getTotalWater(state) < def.waterCost) {
        unusedMs = remaining;
        state.currentAction = null;
        break;
      }
      // Check resource inputs
      if (def.inputs) {
        const canAffordInputs = def.inputs.every(
          (inp) => (state.resources[inp.resourceId] ?? 0) >= inp.amount
        );
        if (!canAffordInputs) {
          unusedMs = remaining;
          state.currentAction = null;
          break;
        }
      }
      if (def.foodCost) deductFood(state, def.foodCost);
      if (def.waterCost) deductWater(state, def.waterCost);
      // Deduct resource inputs
      if (def.inputs) {
        for (const inp of def.inputs) {
          state.resources[inp.resourceId] = (state.resources[inp.resourceId] ?? 0) - inp.amount;
        }
      }

      remaining -= effectiveExpDuration;
      const event = applyExpeditionCompletion(state, def.id, state.repetitiveActionCount, fullXpThreshold);
      if (event) completions.push(event);

      // Stop looping if all discoverable biomes have been found
      if (def.hideWhenAllFound) {
        const allFound = def.outcomes
          .filter((o) => o.biomeDiscovery)
          .every((o) => state.discoveredBiomes.includes(o.biomeDiscovery!));
        if (allFound) {
          unusedMs = remaining;
          state.currentAction = null;
          break;
        }
      }
    }

    // Stop if player can't afford the next expedition cycle
    if (state.currentAction) {
      const cantAffordFood = def.foodCost && getTotalFood(state) < def.foodCost;
      const cantAffordWater = def.waterCost && getTotalWater(state) < def.waterCost;
      const cantAffordInputs = def.inputs?.some(
        (inp) => (state.resources[inp.resourceId] ?? 0) < inp.amount
      );
      if (cantAffordFood || cantAffordWater || cantAffordInputs) {
        unusedMs = remaining;
        state.currentAction = null;
      } else {
        state.currentAction.startedAt = now - remaining;
      }
    }
  }

  // Track total action completions for analytics
  state.actionCompletions += completions.length;

  cleanupObsoleteResources(state);
  return { completions, elapsedMs, unusedMs };
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
    actionId: def.id,
    actionType: "gather",
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

  if (def.equipmentOutput) {
    // Equipment craft — create a pristine equipment item, with a small chance of a forge affix
    const eqDef = getEquipmentItemById(def.equipmentOutput);
    const forgeAffixes = rollForgeAffix(eqDef);
    const instanceId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    state.equipmentInventory.push({
      instanceId,
      defId: def.equipmentOutput,
      affixes: forgeAffixes,
      condition: "pristine",
    });
    drops.push({ name: eqDef?.name ?? def.equipmentOutput, amount: 1 });
  } else if (def.toolOutput) {
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
      // Stackable buildings allow duplicates, up to effective maxCount (group-aware)
      const currentCount = getGroupBuildingCount(state, def.buildingOutput);
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

    // Output chance check (e.g. pottery breakage)
    const baseChance = def.outputChance ?? 1;
    const skill = state.skills[def.skillId];
    const chanceBonus = getOutputChanceBonus(def.skillId, skill.level, def.id);
    const finalChance = Math.min(baseChance + chanceBonus, 1);
    if (finalChance < 1 && Math.random() >= finalChance) {
      // Output failed (e.g. pot cracked in the fire) — inputs consumed, no output
      drops.push({ name: def.output.resourceId, amount: 0 });
    } else {
      let outputAmount = def.output.amount;

      if (!def.noDoubleOutput) {
        // Double output milestone check
        const doubleChance = getDoubleOutputChance(def.skillId, skill.level, def.id);
        if (doubleChance > 0 && Math.random() < doubleChance) {
          outputAmount *= 2;
        }

        // Tool output bonus (+1 chance)
        const toolBonusChance = getToolOutputBonusChance(state, def.id);
        if (toolBonusChance > 0 && Math.random() < toolBonusChance) {
          outputAmount += 1;
        }
      } else {
        // noDoubleOutput recipes get an instant free recraft instead of doubling,
        // but only if the player can afford the inputs again (e.g. has another pot)
        const doubleChance = getDoubleOutputChance(def.skillId, skill.level, def.id);
        const toolBonusChance = getToolOutputBonusChance(state, def.id);
        const totalChance = Math.min(1, doubleChance + toolBonusChance);
        if (totalChance > 0 && Math.random() < totalChance) {
          const effectiveInputs = getEffectiveInputs(def, state);
          const canAfford = effectiveInputs.every(
            (input) => (state.resources[input.resourceId] ?? 0) >= input.amount
          );
          if (canAfford) {
            for (const input of effectiveInputs) {
              state.resources[input.resourceId] =
                (state.resources[input.resourceId] ?? 0) - input.amount;
            }
            outputAmount += def.output.amount;
          }
        }
      }

      addResource(state, def.output.resourceId, outputAmount);
      drops.push({ name: def.output.resourceId, amount: outputAmount });
    }
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
    actionId: def.id,
    actionType: "craft",
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

/** 25% chance to roll a single affix from the small forge-eligible pool.
 *  Forged items cap at 1 affix (vs found items which can roll 2-3+).
 *  Only affixes marked forgeEligible and slot-compatible are considered.
 */
const FORGE_AFFIX_CHANCE = 0.25;

function rollForgeAffix(
  eqDef: ReturnType<typeof getEquipmentItemById>
): EquipmentItem["affixes"] {
  if (!eqDef || eqDef.maxAffixes < 1) return [];
  if (Math.random() >= FORGE_AFFIX_CHANCE) return [];

  const allAffixes = getAffixes();
  const eligible = Object.values(allAffixes).filter((a) => {
    if (!a.forgeEligible) return false;
    if (a.allowedSlots && !a.allowedSlots.includes(eqDef.slot)) return false;
    return true;
  });

  if (eligible.length === 0) return [];

  const pick = eligible[Math.floor(Math.random() * eligible.length)];
  return [{ affixId: pick.id, rollValue: Math.random() }];
}

/** Roll equipment drops from an expedition, applying encounter grade to drop chances.
 *  Handles two item types:
 *  - Magic items: random affixes (includes expedition-exclusive affixes when applicable)
 *  - Unique items: fixed affixes from the item definition (no random rolling)
 */
function rollEquipmentDrops(
  entries: EquipmentDropEntry[],
  gradeChanceMult: number,
  expeditionId?: string
): EquipmentItem[] {
  const allAffixes = getAffixes();
  const items: EquipmentItem[] = [];

  for (const entry of entries) {
    const adjustedChance = entry.chance * gradeChanceMult;
    if (Math.random() >= adjustedChance) continue;

    const def = getEquipmentItemById(entry.defId);
    if (!def) continue;

    let pickedAffixes: EquipmentItem["affixes"];

    if (def.unique && def.fixedAffixes) {
      // Unique item: use fixed affixes from definition
      pickedAffixes = def.fixedAffixes.map((fa) => ({
        affixId: fa.affixId,
        rollValue: fa.rollValue,
      }));
    } else {
      // Magic item: roll random affixes
      const affixRange = entry.affixRange ?? { min: 0, max: 0 };
      const numAffixes = affixRange.min + Math.floor(Math.random() * (affixRange.max - affixRange.min + 1));
      const capped = Math.min(numAffixes, def.maxAffixes);

      // Pick eligible affixes: slot-compatible, plus expedition-exclusive for this expedition
      const eligible = Object.values(allAffixes).filter((a) => {
        if (a.allowedSlots && !a.allowedSlots.includes(def.slot)) return false;
        // Exclude expedition-exclusive affixes from other expeditions
        if (a.expeditionOnly && a.expeditionOnly !== expeditionId) return false;
        return true;
      });

      pickedAffixes = [];
      const usedIds = new Set<string>();
      for (let i = 0; i < capped && eligible.length > usedIds.size; i++) {
        const remaining = eligible.filter((a) => !usedIds.has(a.id));
        if (remaining.length === 0) break;
        const pick = remaining[Math.floor(Math.random() * remaining.length)];
        usedIds.add(pick.id);
        pickedAffixes.push({ affixId: pick.id, rollValue: Math.random() });
      }
    }

    // Unique items drop pristine (they're special); magic items follow dropsAsBroken
    const condition = def.unique ? "pristine" : (entry.dropsAsBroken ? "broken" : "pristine");

    items.push({
      instanceId: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      defId: entry.defId,
      affixes: pickedAffixes,
      condition,
    });
  }

  return items;
}

function applyExpeditionCompletion(
  state: GameState,
  expeditionId: string,
  repetitiveCount: number,
  fullXpThreshold: number
): CompletionEvent | null {
  const def = getExpeditionById(expeditionId);
  if (!def) return null;

  // Resolve combat encounter for mainland expeditions with difficulty profiles
  const encounter = def.difficulty ? resolveEncounter(state, def.difficulty) : undefined;

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

  // Apply drops (with expedition drop bonus from milestones + encounter multiplier)
  const drops: { name: string; amount: number }[] = [];
  const newResources: string[] = [];
  const dropBonus = getExpeditionDropBonus(def.skillId, navLevel);
  const encounterDropMult = encounter?.dropMultiplier ?? 1;
  if (outcome.drops) {
    for (const drop of outcome.drops) {
      const rolled = rollDrops([drop]);
      for (const r of rolled) {
        const baseAmount = dropBonus > 0
          ? Math.round(r.amount * (1 + dropBonus))
          : r.amount;
        // Apply encounter multiplier (mainland combat outcomes reduce/maintain drops)
        const finalAmount = Math.max(1, Math.round(baseAmount * encounterDropMult));
        if (!state.discoveredResources.includes(r.resourceId)) {
          newResources.push(r.resourceId);
          state.discoveredResources.push(r.resourceId);
        }
        addResource(state, r.resourceId, finalAmount);
        drops.push({ name: r.resourceId, amount: finalAmount });
      }
    }
  }

  // Return empty water containers (~85% survive the trip)
  if (def.waterCost && def.waterCost > 0) {
    let potsReturned = 0;
    for (let i = 0; i < def.waterCost; i++) {
      if (Math.random() < 0.85) potsReturned++;
    }
    if (potsReturned > 0) {
      addResource(state, "fired_clay_pot", potsReturned);
      drops.push({ name: "fired_clay_pot", amount: potsReturned });
    }
  }

  // Equipment drops (mainland expeditions only, gated by encounter grade)
  let equipmentDropped: CompletionEvent["equipmentDropped"];
  if (def.equipmentDrops && def.equipmentDrops.length > 0) {
    // Grade-based chance multiplier: success = full chance, partial = halved, failure = none
    let gradeChanceMult = 1;
    if (encounter) {
      if (encounter.grade === "failure") gradeChanceMult = 0;
      else if (encounter.grade === "partial") gradeChanceMult = 0.5;
    }

    if (gradeChanceMult > 0) {
      const rolledItems = rollEquipmentDrops(def.equipmentDrops, gradeChanceMult, def.id);
      for (const item of rolledItems) {
        state.equipmentInventory.push(item);
      }
      if (rolledItems.length > 0) {
        equipmentDropped = rolledItems.map((item) => {
          return { defId: item.defId, name: getItemDisplayName(item), condition: item.condition };
        });
      }
    }
  }

  // Loot table drops (rolled independently from outcomes)
  if (def.lootTable && def.lootTable.length > 0) {
    // Navigation level provides a small bonus to loot drop chances (+1% per level)
    const lootChanceBonus = navLevel * 0.01;
    // Combat grade affects loot drops on mainland expeditions
    let lootGradeMult = 1;
    if (encounter) {
      if (encounter.grade === "failure") lootGradeMult = 0.15;
      else if (encounter.grade === "partial") lootGradeMult = 0.5;
    }

    const rolledLoot = rollLootTable(def.lootTable, lootChanceBonus, lootGradeMult);
    for (const loot of rolledLoot) {
      if (!state.discoveredResources.includes(loot.resourceId)) {
        newResources.push(loot.resourceId);
        state.discoveredResources.push(loot.resourceId);
      }
      addResource(state, loot.resourceId, loot.amount);
      drops.push({ name: loot.resourceId, amount: loot.amount });

      // Track in loot log
      if (!state.lootLog) state.lootLog = {};
      const entry = state.lootLog[loot.resourceId];
      if (entry) {
        entry.count += loot.amount;
      } else {
        state.lootLog[loot.resourceId] = { count: loot.amount, firstFound: Date.now() };
      }
    }
  }

  // XP for expeditions (encounter result modifies XP)
  const skill = state.skills[def.skillId];
  const prevLevel = skill.level;
  const encounterXpMult = encounter?.xpMultiplier ?? 1;
  const xpGain = Math.round(applyRepetitiveXp(def.xpGain, repetitiveCount, fullXpThreshold) * encounterXpMult);
  skill.xp += xpGain;
  skill.level = levelFromXp(skill.xp);
  state.repetitiveActionCount += 1;

  // Victory expeditions win the game
  if (def.victory) {
    state.victory = true;
    state.currentAction = null;
  }

  return {
    actionId: def.id,
    actionType: "expedition",
    actionName: def.name,
    drops,
    xpGain,
    skillId: def.skillId,
    levelUp: skill.level > prevLevel ? skill.level : undefined,
    biomeDiscovery: outcome.biomeDiscovery,
    expeditionMessage: outcome.description,
    newResources: newResources.length > 0 ? newResources : undefined,
    victory: def.victory,
    encounterResult: encounter,
    equipmentDropped,
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

/** Roll a loot table — each entry rolled independently with bonus and grade multiplier. */
function rollLootTable(
  table: LootDrop[],
  chanceBonus: number,
  gradeMult: number
): { resourceId: string; amount: number }[] {
  const result: { resourceId: string; amount: number }[] = [];
  for (const entry of table) {
    const adjustedChance = Math.min(1, entry.chance * (1 + chanceBonus) * gradeMult);
    if (Math.random() < adjustedChance) {
      result.push({ resourceId: entry.resourceId, amount: entry.amount });
    }
  }
  return result;
}
