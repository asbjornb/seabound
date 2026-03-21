import { ACTIONS } from "../data/actions";
import { EXPEDITIONS } from "../data/expeditions";
import { getDurationMultiplier } from "../data/milestones";
import {
  ACTIONS_BY_ID,
  EXPEDITIONS_BY_ID,
  RECIPES_BY_ID,
  STATIONS_BY_ID,
} from "../data/registries";
import { RECIPES } from "../data/recipes";
import { STATIONS } from "../data/stations";
import { ActionDef, ExpeditionDef, GameState, RecipeDef, StationDef } from "../data/types";
import {
  getMoraleDurationMultiplier,
  getResource,
  getToolSpeedMultiplier,
  getTotalFood,
} from "./gameState";

export type GameTab = "gather" | "inventory" | "craft" | "camp" | "explore" | "skills";


function resourceHasUse(resourceId: string, state: GameState): boolean {
  return RECIPES.some((recipe) => {
    const usesResource = recipe.inputs.some((input) => input.resourceId === resourceId);
    if (!usesResource) return false;
    if (recipe.buildingOutput && state.buildings.includes(recipe.buildingOutput)) return false;
    if (recipe.oneTimeCraft && recipe.output && getResource(state, recipe.output.resourceId) >= 1) return false;
    return true;
  });
}

export function selectAvailableActions(state: GameState): ActionDef[] {
  return ACTIONS.filter((action) => {
    const skill = state.skills[action.skillId];
    if (action.requiredSkillLevel && skill.level < action.requiredSkillLevel) return false;
    if (action.requiredBiome && !state.discoveredBiomes.includes(action.requiredBiome)) return false;
    if (action.requiredBuildings?.some((buildingId) => !state.buildings.includes(buildingId))) return false;
    if (action.requiredTools?.some((toolId) => getResource(state, toolId) < 1)) return false;
    return true;
  });
}

export function selectAvailableRecipes(state: GameState): RecipeDef[] {
  return RECIPES.filter((recipe) => {
    const skill = state.skills[recipe.skillId];
    if (recipe.requiredSkillLevel && skill.level < recipe.requiredSkillLevel) return false;
    if (recipe.requiredItems?.some((itemId) => getResource(state, itemId) < 1)) return false;
    if (recipe.requiredBuildings?.some((buildingId) => !state.buildings.includes(buildingId))) return false;
    if (recipe.buildingOutput && state.buildings.includes(recipe.buildingOutput)) return false;
    if (recipe.oneTimeCraft && recipe.output && getResource(state, recipe.output.resourceId) >= 1) return false;
    if (recipe.oneTimeCraft && recipe.output && !resourceHasUse(recipe.output.resourceId, state)) return false;
    if (recipe.id === "split_bamboo_cane" && !resourceHasUse("bamboo_splinter", state)) return false;
    if (recipe.inputs.some((input) => !state.discoveredResources.includes(input.resourceId))) return false;
    return true;
  });
}

export function selectAvailableExpeditions(state: GameState): ExpeditionDef[] {
  return EXPEDITIONS.filter((expedition) => {
    if (expedition.requiredVessel && getResource(state, expedition.requiredVessel) < 1) return false;
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
    if (station.requiredTool && getResource(state, station.requiredTool) < 1) return false;
    if (station.requiredBuildings?.some((buildingId) => !state.buildings.includes(buildingId))) return false;
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

export function selectCampActions(actions: ActionDef[]): ActionDef[] {
  return actions.filter((action) => action.panel === "camp");
}

export function selectCraftRecipes(recipes: RecipeDef[]): RecipeDef[] {
  return recipes.filter((recipe) => recipe.panel === "craft");
}

export function selectCampRecipes(recipes: RecipeDef[]): RecipeDef[] {
  return recipes.filter((recipe) => recipe.panel === "camp");
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

export function selectVisibleTabs(params: {
  hasFoodAccess: boolean;
  hasAnyResource: boolean;
  hasAnyXp: boolean;
  craftRecipeCount: number;
  campRecipeCount: number;
  campActionCount: number;
  buildingCount: number;
  availableStationCount: number;
  deployedStationCount: number;
}): GameTab[] {
  const tabs: GameTab[] = ["gather"];
  if (params.hasFoodAccess) tabs.push("explore");
  if (params.craftRecipeCount > 0) tabs.push("craft");
  if (
    params.campRecipeCount > 0 ||
    params.campActionCount > 0 ||
    params.buildingCount > 0 ||
    params.availableStationCount > 0 ||
    params.deployedStationCount > 0
  ) {
    tabs.push("camp");
  }
  if (params.hasAnyResource) tabs.push("inventory");
  if (params.hasAnyXp) tabs.push("skills");
  return tabs;
}

export function selectReadyStationCount(state: GameState, now = Date.now()): number {
  return state.stations.filter((station) => {
    const def = STATIONS_BY_ID[station.stationId];
    return def ? now >= station.deployedAt + def.durationMs : false;
  }).length;
}
