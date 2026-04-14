import { getDurationMultiplier } from "../data/milestones";
import {
  getActions,
  getActionById,
  getBiomes,
  getBuildings,
  getExpeditionById,
  getExpeditions,
  getRecipeById,
  getRecipes,
  getResources,
  getSkills,
  getStationById,
  getStations,
} from "../data/registry";
import { xpForLevel } from "../data/skills";
import type { ActionDef, ExpeditionDef, GameState, RecipeDef, SkillId, StationDef } from "../data/types";
import {
  getBuildingCount,
  getBuildingExpeditionSpeedMultiplier,
  getGroupBuildingCount,
  getEffectiveInputs,
  getEffectiveMaxCount,
  getMoraleDurationMultiplier,
  getResource,
  getStorageLimit,
  getToolSpeedMultiplier,
  getTotalFood,
  hasTool,
  hasVessel,
  resolveAlternateInputs,
} from "./gameState";

export type GameTab = "gather" | "inventory" | "equipment" | "craft" | "tend" | "build" | "explore" | "skills" | "routines";

export type GameScreen = "island" | "mainland";

/** Skills that belong to the mainland screen. Everything else is island. */
const MAINLAND_SKILLS = new Set(["combat", "mining", "smithing"]);


export function resourceHasUse(resourceId: string, state: GameState, _visited?: Set<string>): boolean {
  const RESOURCES = getResources();
  const def = RESOURCES[resourceId];
  // Food/water resources are always useful — consumed by expeditions and survival
  if (def?.foodValue || def?.waterValue) return true;
  // Resources consumed by station setup are always useful
  if (getStations().some((station) => station.setupInputs?.some((inp) => inp.resourceId === resourceId))) return true;
  const BUILDINGS = getBuildings();
  return getRecipes().some((recipe) => {
    const effectiveInputs = getEffectiveInputs(recipe, state);
    const usesResource = effectiveInputs.some((input) => input.resourceId === resourceId || input.alternateResourceId === resourceId);
    const requiresResource = recipe.requiredItems?.some((requiredItem) => requiredItem === resourceId);
    if (!usesResource && !requiresResource) return false;
    if (recipe.buildingOutput && state.buildings.includes(recipe.buildingOutput)) {
      const bdef = BUILDINGS[recipe.buildingOutput];
      if (!bdef?.maxCount || bdef.maxCount <= 1) return false;
    }
    if (recipe.oneTimeCraft && recipe.output && getResource(state, recipe.output.resourceId) >= 1) return false;
    if (recipe.oneTimeCraft && recipe.toolOutput && state.tools.includes(recipe.toolOutput)) return false;
    // Transitive check: if this recipe's output is also marked output_no_use and that
    // output itself has no remaining use, this recipe doesn't count as a use either
    if (recipe.output && !recipe.buildingOutput && !recipe.toolOutput &&
        recipe.hideWhen?.some((cond) => cond.type === "output_no_use")) {
      const visited = _visited ?? new Set<string>();
      if (visited.has(recipe.output.resourceId)) return false;
      visited.add(recipe.output.resourceId);
      if (!resourceHasUse(recipe.output.resourceId, state, visited)) return false;
    }
    return true;
  });
}

export function selectAvailableActions(state: GameState): ActionDef[] {
  return getActions().filter((action) => {
    const skill = state.skills[action.skillId];
    if (action.requiredSkillLevel && skill.level < action.requiredSkillLevel) return false;
    if (action.requiredBiome && !state.discoveredBiomes.includes(action.requiredBiome)) return false;
    if (action.requiredBuildings?.some((buildingId) => !state.buildings.includes(buildingId))) return false;
    if (action.requiredTools?.some((toolId) => !hasTool(state, toolId))) return false;
    if (action.requiredResources?.some((resId) => getResource(state, resId) < 1)) return false;
    if (action.oneTimeAction && action.drops.some((drop) => getResource(state, drop.resourceId) >= 1)) return false;
    if (action.hideWhen) {
      const allMet = action.hideWhen.every((cond) => {
        switch (cond.type) {
          case "has_building":
            return state.buildings.includes(cond.buildingId);
          case "has_tool":
            return state.tools.includes(cond.toolId);
          case "has_biome":
            return state.discoveredBiomes.includes(cond.biomeId);
          default:
            return false;
        }
      });
      if (allMet) return false;
    }
    return true;
  });
}

export function selectAvailableRecipes(state: GameState): RecipeDef[] {
  const BUILDINGS = getBuildings();
  const allRecipes = getRecipes();

  // Build upgrade chain: maps each building to what it was upgraded into
  // e.g. sleeping_mat -> hammock -> thatched_hut
  const upgradedTo = new Map<string, string>();
  for (const r of allRecipes) {
    if (r.replacesBuilding && r.buildingOutput) {
      upgradedTo.set(r.replacesBuilding, r.buildingOutput);
    }
  }

  // Check if a building exists in state OR any upgrade in its chain does
  function hasBuildingOrUpgrade(buildingId: string): boolean {
    if (state.buildings.includes(buildingId)) return true;
    const next = upgradedTo.get(buildingId);
    if (next) return hasBuildingOrUpgrade(next);
    return false;
  }

  return allRecipes.filter((recipe) => {
    const skill = state.skills[recipe.skillId];
    if (recipe.requiredSkillLevel && skill.level < recipe.requiredSkillLevel) return false;
    if (recipe.requiredSkills?.some((req) => state.skills[req.skillId].level < req.level)) return false;
    if (recipe.requiredItems?.some((itemId) => getResource(state, itemId) < 1)) return false;
    if (recipe.requiredTools?.some((toolId) => !hasTool(state, toolId))) return false;
    if (recipe.requiredBuildings?.some((buildingId) => !state.buildings.includes(buildingId))) return false;
    // Data-driven hide rules
    if (recipe.hideWhen) {
      const allMet = recipe.hideWhen.every((cond) => {
        switch (cond.type) {
          case "has_building":
            return hasBuildingOrUpgrade(cond.buildingId);
          case "has_tool":
            return state.tools.includes(cond.toolId);
          case "has_biome":
            return state.discoveredBiomes.includes(cond.biomeId);
          case "output_no_use":
            return recipe.output ? !resourceHasUse(recipe.output.resourceId, state) : false;
          default:
            return false;
        }
      });
      if (allMet) return false;
    }
    // Hide building recipes if building already exists OR has been upgraded
    if (recipe.buildingOutput && hasBuildingOrUpgrade(recipe.buildingOutput)) {
      const bdef = BUILDINGS[recipe.buildingOutput];
      if (!bdef?.maxCount || bdef.maxCount <= 1) return false;
      // Stackable: hide if at effective max count (includes bonuses from other buildings)
      // Use group-aware count so upgrade chains share a single cap
      if (getGroupBuildingCount(state, recipe.buildingOutput) >= getEffectiveMaxCount(state, recipe.buildingOutput)) return false;
      // For stackable upgrade recipes, hide if no source building left to upgrade
      if (recipe.replacesBuilding && !state.buildings.includes(recipe.replacesBuilding)) return false;
    }
    // For non-upgrade building recipes with a shared group, hide if group is at max
    // (covers the case where you have 0 of this specific building but group is full)
    if (recipe.buildingOutput && !recipe.replacesBuilding) {
      const bdef = BUILDINGS[recipe.buildingOutput];
      if (bdef?.maxCountGroup && getGroupBuildingCount(state, recipe.buildingOutput) >= getEffectiveMaxCount(state, recipe.buildingOutput)) return false;
    }
    // For upgrade recipes that haven't reached max yet, still need a source building
    if (recipe.replacesBuilding && !state.buildings.includes(recipe.replacesBuilding)) return false;
    if (recipe.oneTimeCraft && recipe.output && getResource(state, recipe.output.resourceId) >= 1) return false;
    if (recipe.oneTimeCraft && recipe.toolOutput && state.tools.includes(recipe.toolOutput)) return false;
    if (recipe.oneTimeCraft && recipe.output && !resourceHasUse(recipe.output.resourceId, state)) return false;
    if (getEffectiveInputs(recipe, state).some((input) => !state.discoveredResources.includes(input.resourceId))) return false;
    return true;
  });
}

export function selectAvailableExpeditions(state: GameState): ExpeditionDef[] {
  return getExpeditions().filter((expedition) => {
    if (expedition.victory && state.mainlandUnlocked) return false;
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
  return getStations().filter((station) => {
    const skill = state.skills[station.skillId];
    if (station.requiredSkillLevel && skill.level < station.requiredSkillLevel) return false;
    if (station.requiredTool && !hasTool(state, station.requiredTool)) return false;
    if (station.requiredBuildings?.some((buildingId) => !state.buildings.includes(buildingId))) return false;
    if (station.requiredBiomes?.some((biomeId) => !state.discoveredBiomes.includes(biomeId))) return false;
    // Hide charting stations once the target biome is discovered or fully charted
    if (station.chartBiome && (
      state.discoveredBiomes.includes(station.chartBiome) ||
      (state.chartProgress[station.chartBiome] ?? 0) >= 1
    )) return false;
    // Hide stations whose setup inputs haven't been discovered yet
    if (station.setupInputs?.some((input) => !state.discoveredResources.includes(input.resourceId))) return false;
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

/** Stations the player can't deploy yet (skill too low) but has the setup inputs for.
 *  Shown as locked previews so the player knows what level to aim for. */
export function selectLockedStations(state: GameState): StationDef[] {
  const available = selectAvailableStations(state);
  const availableIds = new Set(available.map((s) => s.id));
  return getStations().filter((station) => {
    if (availableIds.has(station.id)) return false;
    // Hide charting stations once the target biome is discovered or fully charted
    if (station.chartBiome && (
      state.discoveredBiomes.includes(station.chartBiome) ||
      (state.chartProgress[station.chartBiome] ?? 0) >= 1
    )) return false;
    // Only show if locked specifically by skill level
    const skill = state.skills[station.skillId];
    if (!station.requiredSkillLevel || skill.level >= station.requiredSkillLevel) return false;
    // Must have the setup inputs (the seed/cutting) to tease
    if (!station.setupInputs || station.setupInputs.length === 0) return false;
    if (!station.setupInputs.some((inp) => getResource(state, inp.resourceId) > 0)) return false;
    // Must meet all other requirements (tool, buildings, building slots)
    if (station.requiredTool && !hasTool(state, station.requiredTool)) return false;
    if (station.requiredBuildings?.some((bid) => !state.buildings.includes(bid))) return false;
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
    const action = getActionById(state.currentAction.actionId);
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
    const recipe = recipeId ? getRecipeById(recipeId) : undefined;
    if (!recipe) return { actionProgress: 0, actionDuration: 0 };
    const toolMultiplier = getToolSpeedMultiplier(state, recipe.id);
    const craftSkillLevel = state.skills[recipe.skillId]?.level ?? 1;
    const craftMilestoneMultiplier = getDurationMultiplier(recipe.skillId, craftSkillLevel, recipe.id);
    const effectiveDuration = Math.round(recipe.durationMs * craftMilestoneMultiplier * moraleMultiplier * toolMultiplier);
    return {
      actionDuration: effectiveDuration,
      actionProgress: Math.min(1, (now - state.currentAction.startedAt) / effectiveDuration),
    };
  }

  const expeditionId = state.currentAction.expeditionId;
  const expedition = expeditionId ? getExpeditionById(expeditionId) : undefined;
  if (!expedition) return { actionProgress: 0, actionDuration: 0 };
  const expSkillLevel = state.skills[expedition.skillId]?.level ?? 1;
  const expMilestoneMultiplier = getDurationMultiplier(expedition.skillId, expSkillLevel, expedition.id);
  const expBuildingMultiplier = getBuildingExpeditionSpeedMultiplier(state, expedition.skillId);
  const effectiveDuration = Math.round(expedition.durationMs * expMilestoneMultiplier * moraleMultiplier * expBuildingMultiplier);
  return {
    actionDuration: effectiveDuration,
    actionProgress: Math.min(1, (now - state.currentAction.startedAt) / effectiveDuration),
  };
}

export function selectCurrentActionName(state: GameState): string | null {
  if (!state.currentAction) return null;
  if (state.currentAction.type === "gather") {
    return getActionById(state.currentAction.actionId)?.name ?? null;
  }
  if (state.currentAction.type === "craft") {
    return state.currentAction.recipeId
      ? getRecipeById(state.currentAction.recipeId)?.name ?? null
      : null;
  }
  return state.currentAction.expeditionId
    ? getExpeditionById(state.currentAction.expeditionId)?.name ?? null
    : null;
}

export interface CurrentSkillInfo {
  skillId: SkillId;
  skillName: string;
  level: number;
  progress: number; // 0-1 within current level
  xpIntoLevel: number;
  xpNeeded: number;
}

export function selectCurrentSkillInfo(state: GameState): CurrentSkillInfo | null {
  if (!state.currentAction) return null;

  let skillId: SkillId | undefined;
  if (state.currentAction.type === "gather") {
    skillId = getActionById(state.currentAction.actionId)?.skillId;
  } else if (state.currentAction.type === "craft") {
    skillId = state.currentAction.recipeId
      ? getRecipeById(state.currentAction.recipeId)?.skillId
      : undefined;
  } else {
    skillId = state.currentAction.expeditionId
      ? getExpeditionById(state.currentAction.expeditionId)?.skillId
      : undefined;
  }

  if (!skillId) return null;
  const skills = getSkills();
  const def = skills[skillId];
  if (!def) return null;

  const skill = state.skills[skillId];
  const currentLevelXp = xpForLevel(skill.level);
  const nextLevelXp = xpForLevel(skill.level + 1);
  const xpIntoLevel = skill.xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  return {
    skillId,
    skillName: def.name,
    level: skill.level,
    progress: xpNeeded > 0 ? xpIntoLevel / xpNeeded : 1,
    xpIntoLevel,
    xpNeeded,
  };
}

export function selectUndiscoveredBiomeCount(state: GameState, expeditionId?: string): number {
  if (expeditionId) {
    const exp = getExpeditionById(expeditionId);
    if (exp) {
      const biomes = exp.outcomes
        .filter((o) => o.biomeDiscovery)
        .map((o) => o.biomeDiscovery!);
      return biomes.filter((b) => !state.discoveredBiomes.includes(b)).length;
    }
  }
  const totalBiomes = Object.keys(getBiomes()).length;
  return totalBiomes - state.discoveredBiomes.length;
}

export function isMainlandSkill(skillId: string): boolean {
  return MAINLAND_SKILLS.has(skillId);
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

/** Filter actions to only those belonging to the given screen. */
export function selectActionsByScreen(actions: ActionDef[], screen: GameScreen): ActionDef[] {
  return actions.filter((a) =>
    screen === "mainland" ? MAINLAND_SKILLS.has(a.skillId) : !MAINLAND_SKILLS.has(a.skillId)
  );
}

/** Filter recipes to only those belonging to the given screen.
 *  Equipment crafting recipes (those with equipmentOutput) always belong to mainland. */
export function selectRecipesByScreen(recipes: RecipeDef[], screen: GameScreen): RecipeDef[] {
  return recipes.filter((r) => {
    const isMainland = MAINLAND_SKILLS.has(r.skillId) || !!r.equipmentOutput;
    return screen === "mainland" ? isMainland : !isMainland;
  });
}

/** Filter expeditions to only those belonging to the given screen. */
export function selectExpeditionsByScreen(expeditions: ExpeditionDef[], screen: GameScreen): ExpeditionDef[] {
  return expeditions.filter((e) =>
    screen === "mainland" ? !!e.mainland : !e.mainland
  );
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
  hasEquipment: boolean;
  craftRecipeCount: number;
  buildRecipeCount: number;
  buildActionCount: number;
  buildingCount: number;
  availableStationCount: number;
  deployedStationCount: number;
  routinesUnlocked: boolean;
  gatherActionCount?: number;
  screen?: GameScreen;
}): GameTab[] {
  if (params.screen === "mainland") {
    // Mainland has a simpler tab set — no tend/build
    const tabs: GameTab[] = [];
    if ((params.gatherActionCount ?? 0) > 0) tabs.push("gather");
    if (params.craftRecipeCount > 0) tabs.push("craft");
    if (params.hasFoodAccess) tabs.push("explore");
    if (params.hasEquipment) tabs.push("equipment");
    if (params.routinesUnlocked) tabs.push("routines");
    if (params.hasAnyResource) tabs.push("inventory");
    if (params.hasAnyXp) tabs.push("skills");
    return tabs;
  }
  const tabs: GameTab[] = ["gather"];
  if (params.craftRecipeCount > 0) tabs.push("craft");
  if (params.availableStationCount > 0 || params.deployedStationCount > 0) {
    tabs.push("tend");
  }
  if (
    params.buildRecipeCount > 0 ||
    params.buildActionCount > 0 ||
    params.buildingCount > 0
  ) {
    tabs.push("build");
  }
  if (params.hasFoodAccess) tabs.push("explore");
  if (params.routinesUnlocked) tabs.push("routines");
  if (params.hasAnyResource) tabs.push("inventory");
  if (params.hasAnyXp) tabs.push("skills");
  return tabs;
}

/** Check if the player has any mainland skill XP. */
export function selectHasMainlandXp(state: GameState): boolean {
  return Array.from(MAINLAND_SKILLS).some((skillId) => (state.skills[skillId]?.xp ?? 0) > 0);
}

/** Check if the player has any mainland resources in inventory. */
export function selectHasMainlandResources(state: GameState): boolean {
  const RESOURCES = getResources();
  return Object.entries(state.resources).some(([id, amount]) => {
    if (amount <= 0) return false;
    const def = RESOURCES[id];
    return def?.tags?.includes("mainland");
  });
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

  const RESOURCES = getResources();

  if (state.currentAction.type === "gather") {
    const action = getActionById(state.currentAction.actionId);
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
    const recipe = recipeId ? getRecipeById(recipeId) : undefined;
    if (!recipe) return null;

    const effectiveInputs = getEffectiveInputs(recipe, state);
    const resolvedInputs = resolveAlternateInputs(effectiveInputs, state);
    const inputs = resolvedInputs.map((inp) => ({
      name: RESOURCES[inp.resourceId]?.name ?? inp.resourceId,
      have: getResource(state, inp.resourceId),
      need: inp.amount,
    }));

    const craftsRemaining = resolvedInputs.length > 0
      ? Math.min(...resolvedInputs.map((inp) => Math.floor(getResource(state, inp.resourceId) / inp.amount)))
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
    const def = getStationById(station.stationId);
    return def ? now >= station.deployedAt + def.durationMs : false;
  }).length;
}
