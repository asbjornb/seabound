import { ACTIONS } from "../data/actions";
import { BUILDINGS } from "../data/buildings";
import { EXPEDITIONS } from "../data/expeditions";
import { getDurationMultiplier } from "../data/milestones";
import {
  ACTIONS_BY_ID,
  EXPEDITIONS_BY_ID,
  RECIPES_BY_ID,
  STATIONS_BY_ID,
} from "../data/registries";
import { RECIPES } from "../data/recipes";
import { RESOURCES } from "../data/resources";
import { STATIONS } from "../data/stations";
import { ActionDef, ExpeditionDef, GameState, RecipeDef, StationDef } from "../data/types";
import {
  getBuildingCount,
  getEffectiveInputs,
  getMoraleDurationMultiplier,
  getResource,
  getStorageLimit,
  getToolSpeedMultiplier,
  getTotalFood,
  hasTool,
  hasBuilding,
  hasVessel,
} from "./gameState";

export type AccordionSection = "gather" | "craft" | "build" | "explore";


function resourceHasUse(resourceId: string, state: GameState): boolean {
  return RECIPES.some((recipe) => {
    const effectiveInputs = getEffectiveInputs(recipe, state);
    const usesResource = effectiveInputs.some((input) => input.resourceId === resourceId);
    if (!usesResource) return false;
    if (recipe.buildingOutput && state.buildings.includes(recipe.buildingOutput)) {
      // For stackable buildings, the recipe can still be used
      const bdef = BUILDINGS[recipe.buildingOutput];
      if (!bdef?.maxCount || bdef.maxCount <= 1) return false;
    }
    if (recipe.oneTimeCraft && recipe.output && getResource(state, recipe.output.resourceId) >= 1) return false;
    if (recipe.oneTimeCraft && recipe.toolOutput && state.tools.includes(recipe.toolOutput)) return false;
    return true;
  });
}

export function selectAvailableActions(state: GameState): ActionDef[] {
  return ACTIONS.filter((action) => {
    const skill = state.skills[action.skillId];
    if (action.requiredSkillLevel && skill.level < action.requiredSkillLevel) return false;
    if (action.requiredBiome && !state.discoveredBiomes.includes(action.requiredBiome)) return false;
    if (action.requiredBuildings?.some((buildingId) => !state.buildings.includes(buildingId))) return false;
    if (action.requiredTools?.some((toolId) => !hasTool(state, toolId))) return false;
    if (action.requiredResources?.some((resId) => getResource(state, resId) < 1)) return false;
    return true;
  });
}

export function selectAvailableRecipes(state: GameState): RecipeDef[] {
  return RECIPES.filter((recipe) => {
    const skill = state.skills[recipe.skillId];
    if (recipe.requiredSkillLevel && skill.level < recipe.requiredSkillLevel) return false;
    if (recipe.requiredSkills?.some((req) => state.skills[req.skillId].level < req.level)) return false;
    if (recipe.requiredItems?.some((itemId) => getResource(state, itemId) < 1)) return false;
    if (recipe.requiredTools?.some((toolId) => !hasTool(state, toolId))) return false;
    if (recipe.requiredBuildings?.some((buildingId) => !state.buildings.includes(buildingId))) return false;
    // Hide raft recipe if player already has a dugout (strictly better vessel)
    if (recipe.buildingOutput === "raft" && hasBuilding(state, "dugout")) return false;
    // Hide twist cordage once braid cordage is unlocked (strictly better)
    if (recipe.id === "twist_cordage" && state.buildings.includes("fiber_loom")) return false;
    // Hide building recipes if building already exists (or at max count for stackable)
    if (recipe.buildingOutput && state.buildings.includes(recipe.buildingOutput)) {
      const bdef = BUILDINGS[recipe.buildingOutput];
      if (!bdef?.maxCount || bdef.maxCount <= 1) return false;
      // Stackable: hide if at max count
      if (getBuildingCount(state, recipe.buildingOutput) >= bdef.maxCount) return false;
      // For stackable upgrade recipes, hide if no source building left to upgrade
      if (recipe.replacesBuilding && !state.buildings.includes(recipe.replacesBuilding)) return false;
    }
    // For upgrade recipes that haven't reached max yet, still need a source building
    if (recipe.replacesBuilding && !state.buildings.includes(recipe.replacesBuilding)) return false;
    if (recipe.oneTimeCraft && recipe.output && getResource(state, recipe.output.resourceId) >= 1) return false;
    if (recipe.oneTimeCraft && recipe.toolOutput && state.tools.includes(recipe.toolOutput)) return false;
    if (recipe.oneTimeCraft && recipe.output && !resourceHasUse(recipe.output.resourceId, state)) return false;
    if (recipe.id === "split_bamboo_cane" && !resourceHasUse("bamboo_splinter", state)) return false;
    if (getEffectiveInputs(recipe, state).some((input) => !state.discoveredResources.includes(input.resourceId))) return false;
    return true;
  });
}

export function selectAvailableExpeditions(state: GameState): ExpeditionDef[] {
  return EXPEDITIONS.filter((expedition) => {
    if (expedition.requiredVessel && !hasVessel(state, expedition.requiredVessel)) return false;
    if (expedition.requiredBiomes?.some((biomeId) => !state.discoveredBiomes.includes(biomeId))) return false;
    if (expedition.hideWhenAllFound) {
      const discoverableBiomes = expedition.outcomes
        .filter((outcome) => outcome.biomeDiscovery)
        .map((outcome) => outcome.biomeDiscovery!);
      if (discoverableBiomes.length > 0 && discoverableBiomes.every((biomeId) => state.discoveredBiomes.includes(biomeId))) {
        return false;
      }
    }
    return true;
  });
}

export function selectAvailableStations(state: GameState): StationDef[] {
  return STATIONS.filter((station) => {
    const skill = state.skills[station.skillId];
    if (station.requiredSkillLevel && skill.level < station.requiredSkillLevel) return false;
    if (station.requiredTool && !hasTool(state, station.requiredTool)) return false;
    if (station.requiredBuildings?.some((buildingId) => !state.buildings.includes(buildingId))) return false;
    // For stations with maxDeployedPerBuildings, check that at least one applicable building exists
    if (station.maxDeployedPerBuildings) {
      const totalPlots = station.maxDeployedPerBuildings.reduce(
        (sum, bid) => sum + getBuildingCount(state, bid), 0
      );
      if (totalPlots === 0) return false;
    }
    return true;
  });
}

export function selectCurrentActionTiming(
  state: GameState,
  now = Date.now()
): { actionProgress: number; actionDuration: number } {
  const moraleMultiplier = getMoraleDurationMultiplier(state.morale);
  if (!state.currentAction) {
    return { actionProgress: 0, actionDuration: 0 };
  }

  if (state.currentAction.type === "gather") {
    const action = ACTIONS_BY_ID[state.currentAction.actionId];
    if (!action) return { actionProgress: 0, actionDuration: 0 };
    const skillLevel = state.skills[action.skillId].level;
    const toolMultiplier = getToolSpeedMultiplier(state, action.id);
    const effectiveDuration = Math.round(
      action.durationMs *
        getDurationMultiplier(action.skillId, skillLevel, action.id) *
        moraleMultiplier *
        toolMultiplier
    );
    return {
      actionDuration: effectiveDuration,
      actionProgress: Math.min(1, (now - state.currentAction.startedAt) / effectiveDuration),
    };
  }

  if (state.currentAction.type === "craft") {
    const recipeId = state.currentAction.recipeId;
    const recipe = recipeId ? RECIPES_BY_ID[recipeId] : undefined;
    if (!recipe) return { actionProgress: 0, actionDuration: 0 };
    const toolMultiplier = getToolSpeedMultiplier(state, recipe.id);
    const effectiveDuration = Math.round(recipe.durationMs * moraleMultiplier * toolMultiplier);
    return {
      actionDuration: effectiveDuration,
      actionProgress: Math.min(1, (now - state.currentAction.startedAt) / effectiveDuration),
    };
  }

  const expeditionId = state.currentAction.expeditionId;
  const expedition = expeditionId ? EXPEDITIONS_BY_ID[expeditionId] : undefined;
  if (!expedition) return { actionProgress: 0, actionDuration: 0 };
  const effectiveDuration = Math.round(expedition.durationMs * moraleMultiplier);
  return {
    actionDuration: effectiveDuration,
    actionProgress: Math.min(1, (now - state.currentAction.startedAt) / effectiveDuration),
  };
}

export function selectCurrentActionName(state: GameState): string | null {
  if (!state.currentAction) return null;
  if (state.currentAction.type === "gather") {
    return ACTIONS_BY_ID[state.currentAction.actionId]?.name ?? null;
  }
  if (state.currentAction.type === "craft") {
    return state.currentAction.recipeId
      ? RECIPES_BY_ID[state.currentAction.recipeId]?.name ?? null
      : null;
  }
  return state.currentAction.expeditionId
    ? EXPEDITIONS_BY_ID[state.currentAction.expeditionId]?.name ?? null
    : null;
}

export function selectGatherActions(actions: ActionDef[]): ActionDef[] {
  return actions.filter((action) => action.panel === "gather");
}

export function selectBuildActions(actions: ActionDef[]): ActionDef[] {
  return actions.filter((action) => action.panel === "build");
}

export function selectCraftRecipes(recipes: RecipeDef[]): RecipeDef[] {
  return recipes.filter((recipe) => recipe.panel === "craft");
}

export function selectBuildRecipes(recipes: RecipeDef[]): RecipeDef[] {
  return recipes.filter((recipe) => recipe.panel === "build");
}

export function selectHasAnyXp(state: GameState): boolean {
  return Object.values(state.skills).some((skill) => skill.xp > 0);
}

export function selectHasFoodAccess(state: GameState): boolean {
  return getTotalFood(state) >= 1 || state.discoveredBiomes.length > 1;
}

export function selectHasAnyResource(state: GameState): boolean {
  return Object.values(state.resources).some((amount) => amount > 0);
}

export function selectVisibleSections(params: {
  hasFoodAccess: boolean;
  craftRecipeCount: number;
  buildRecipeCount: number;
  buildActionCount: number;
  buildingCount: number;
  availableStationCount: number;
  deployedStationCount: number;
}): AccordionSection[] {
  const sections: AccordionSection[] = ["gather"];
  if (params.craftRecipeCount > 0) sections.push("craft");
  if (
    params.buildRecipeCount > 0 ||
    params.buildActionCount > 0 ||
    params.buildingCount > 0 ||
    params.availableStationCount > 0 ||
    params.deployedStationCount > 0
  ) {
    sections.push("build");
  }
  if (params.hasFoodAccess) sections.push("explore");
  return sections;
}

export interface ActionStatusInfo {
  /** For craft recipes: how many times the recipe can be repeated with current inputs */
  craftsRemaining?: number;
  /** Input resources with their current amounts (for craft recipes) */
  inputs?: { name: string; have: number; need: number }[];
  /** Output resources with current amount / storage limit */
  outputs?: { name: string; amount: number; limit: number }[];
}

export function selectActionStatusInfo(state: GameState): ActionStatusInfo | null {
  if (!state.currentAction) return null;

  if (state.currentAction.type === "gather") {
    const action = ACTIONS_BY_ID[state.currentAction.actionId];
    if (!action) return null;
    const outputs = action.drops
      .filter((d) => d.chance === undefined || d.chance >= 0.5)
      .map((d) => ({
        name: RESOURCES[d.resourceId]?.name ?? d.resourceId,
        amount: getResource(state, d.resourceId),
        limit: getStorageLimit(state, d.resourceId),
      }));
    return outputs.length > 0 ? { outputs } : null;
  }

  if (state.currentAction.type === "craft") {
    const recipeId = state.currentAction.recipeId;
    const recipe = recipeId ? RECIPES_BY_ID[recipeId] : undefined;
    if (!recipe) return null;

    const effectiveInputs = getEffectiveInputs(recipe, state);
    const inputs = effectiveInputs.map((inp) => ({
      name: RESOURCES[inp.resourceId]?.name ?? inp.resourceId,
      have: getResource(state, inp.resourceId),
      need: inp.amount,
    }));

    const craftsRemaining = effectiveInputs.length > 0
      ? Math.min(...effectiveInputs.map((inp) => Math.floor(getResource(state, inp.resourceId) / inp.amount)))
      : undefined;

    const outputs: ActionStatusInfo["outputs"] = [];
    if (recipe.output) {
      outputs.push({
        name: RESOURCES[recipe.output.resourceId]?.name ?? recipe.output.resourceId,
        amount: getResource(state, recipe.output.resourceId),
        limit: getStorageLimit(state, recipe.output.resourceId),
      });
    }

    return {
      craftsRemaining,
      inputs: inputs.length > 0 ? inputs : undefined,
      outputs: outputs.length > 0 ? outputs : undefined,
    };
  }

  return null;
}

export function selectReadyStationCount(state: GameState, now = Date.now()): number {
  return state.stations.filter((station) => {
    const def = STATIONS_BY_ID[station.stationId];
    return def ? now >= station.deployedAt + def.durationMs : false;
  }).length;
}
