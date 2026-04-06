import {
  getBiomes,
  getBuildings,
  getPhases,
  getResources,
  getSkills,
  getTools,
  getFoodValues,
  getWaterValues,
} from "../data/registry";
import type { BuildingId, DiscoveryEntry, GameState, RecipeDef, RecipeInput, ResourceId, TagInput, ToolId } from "../data/types";

/** Return recipe inputs with building-removed inputs filtered out. */
export function getEffectiveInputs(recipe: RecipeDef, state: GameState): RecipeInput[] {
  return recipe.inputs.filter(
    (inp) => !inp.removedByBuilding || !state.buildings.includes(inp.removedByBuilding)
  );
}

/** Resolve alternate resources: if player can't afford primary, use alternate. */
export function resolveAlternateInputs(inputs: RecipeInput[], state: GameState): RecipeInput[] {
  return inputs.map(inp => {
    if (inp.alternateResourceId && (state.resources[inp.resourceId] ?? 0) < inp.amount
        && (state.resources[inp.alternateResourceId] ?? 0) >= inp.amount) {
      return { ...inp, resourceId: inp.alternateResourceId };
    }
    return inp;
  });
}

/** Check if player can afford an input, considering alternates. */
export function canAffordInput(inp: RecipeInput, state: GameState): boolean {
  if ((state.resources[inp.resourceId] ?? 0) >= inp.amount) return true;
  if (inp.alternateResourceId && (state.resources[inp.alternateResourceId] ?? 0) >= inp.amount) return true;
  return false;
}

/**
 * Resolve tag-based inputs into concrete RecipeInput[].
 * Picks `count` distinct resources the player owns (>=1) that have the given tag,
 * preferring lower food-value items first (using foodValue for "food" tag,
 * alphabetical otherwise).
 * Returns null if the player doesn't have enough distinct tagged resources.
 */
export function resolveTagInputs(
  tagInputs: TagInput[],
  state: GameState,
  excludeIds?: Set<string>
): RecipeInput[] | null {
  const RESOURCES = getResources();
  const result: RecipeInput[] = [];
  for (const ti of tagInputs) {
    // Find all resources with this tag that the player has >=1 of
    const candidates = Object.values(RESOURCES)
      .filter((r) => r.tags?.includes(ti.tag) && (state.resources[r.id] ?? 0) >= 1)
      .filter((r) => !excludeIds || !excludeIds.has(r.id))
      .map((r) => r.id);

    // Sort by food value (low first) for "food" tag, otherwise alphabetical
    if (ti.tag === "food") {
      const foodOrder = new Map(getFoodValues().map((f, i) => [f.id, i]));
      candidates.sort((a, b) => (foodOrder.get(a) ?? 999) - (foodOrder.get(b) ?? 999));
    } else {
      candidates.sort();
    }

    if (candidates.length < ti.count) return null;

    // Pick the first `count` candidates
    for (let i = 0; i < ti.count; i++) {
      result.push({ resourceId: candidates[i] as ResourceId, amount: 1 });
    }
  }
  return result;
}

/**
 * Check if tag-based inputs can be satisfied (player has enough distinct tagged resources).
 */
export function canAffordTagInputs(tagInputs: TagInput[], state: GameState): boolean {
  return resolveTagInputs(tagInputs, state) !== null;
}

export function createInitialState(): GameState {
  const SKILLS = getSkills();
  const skills = {} as GameState["skills"];
  for (const id of Object.keys(SKILLS)) {
    skills[id] = { xp: 0, level: 1 };
  }

  // Find starting biomes from data
  const biomes = getBiomes();
  const startingBiomes = Object.values(biomes)
    .filter((b) => b.startingBiome)
    .map((b) => b.id);

  // Find default phase
  const phases = getPhases();
  const defaultPhase = phases.find((p) => p.conditions.length === 0);
  const startingPhases = defaultPhase ? [defaultPhase.id] : [];

  return {
    resources: {},
    tools: [],
    skills,
    discoveredBiomes: startingBiomes.length > 0 ? startingBiomes : ["beach"],
    buildings: [] as BuildingId[],
    currentAction: null,
    lastTickAt: Date.now(),
    totalPlayTimeMs: 0,
    morale: 55,
    moraleDecayProgressMs: 0,
    discoveryLog: [],
    discoveredResources: [],
    stations: [],
    seenPhases: startingPhases.length > 0 ? startingPhases : ["bare_hands"],
    repetitiveActionCount: 0,
    savedActionProgress: {},
    completedActions: [],
    completedRecipes: [],
    expeditionPity: {},
    lastSeenDiscoveryId: -1,
    actionCompletions: 0,
    actionCompletionCounts: {},
    seenLoreNotes: [],
    activePlayTimeMs: 0,
    sentMilestones: [],
    routines: [],
    activeRoutine: null,
    actionQueue: [],
    queueMode: false,
    equipmentInventory: [],
    loadout: {},
  };
}

/**
 * Current mainland experimental version. Bump this when the mainland save
 * format changes in a way that old mainland state can't be migrated — the
 * normalizer will auto-reset mainland fields while preserving island progress.
 */
export const MAINLAND_VERSION = 1;

/** Reset all mainland-specific state, preserving island progression. */
export function resetMainlandState(state: GameState): void {
  state.equipmentInventory = [];
  state.loadout = {};
  state.mainlandVersion = MAINLAND_VERSION;
  // Clear pity counters for mainland expeditions (island expeditions keep theirs)
  // Individual mainland expedition pity keys will be re-accumulated naturally
}

const SAVE_KEY = "seabound_save";

export function getSaveKey(modId?: string): string {
  return modId && modId !== "base" ? `seabound_save_mod_${modId}` : SAVE_KEY;
}

export function saveGame(state: GameState): void {
  localStorage.setItem(getSaveKey(state.modId), JSON.stringify(state));
}

/** IDs that were resources in old saves but are now tools */
const OLD_TOOL_RESOURCE_IDS: string[] = [
  "bamboo_knife", "bow_drill_kit", "bamboo_spear", "hammerstone",
  "shell_adze", "stone_axe", "obsidian_blade", "gorge_hook",
  "basket_trap", "crucible",
];

/** IDs that were resources in old saves but are now buildings */
const OLD_BUILDING_RESOURCE_IDS: string[] = ["raft", "dugout", "woven_basket"];

export function normalizeGameState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;

  const RESOURCES = getResources();
  const BUILDINGS = getBuildings();
  const SKILLS = getSkills();
  const loaded = structuredClone(raw) as GameState;
  if (!loaded.resources || typeof loaded.resources !== "object") {
    loaded.resources = {};
  }
  if (!loaded.skills || typeof loaded.skills !== "object") {
    loaded.skills = {} as GameState["skills"];
  }

  // Migration: ensure new fields exist
  if (!loaded.discoveredBiomes) {
    loaded.discoveredBiomes = ["beach"];
  }
  // Ensure all skills exist (in case save is from old version)
  for (const id of Object.keys(SKILLS)) {
    if (!loaded.skills[id]) {
      loaded.skills[id] = { xp: 0, level: 1 };
    }
  }
  // Migration: remove preservation skill (merged into cooking/crafting)
  if (loaded.skills["preservation"]) {
    delete loaded.skills["preservation"];
  }
  // Migration: ensure buildings array exists
  if (!loaded.buildings) {
    loaded.buildings = [];
    // If player already has bow_drill_kit (old resource or new tool), auto-grant camp_fire building
    if ((loaded.resources["bow_drill_kit"] ?? 0) >= 1) {
      loaded.buildings.push("camp_fire");
    }
  }
  // Migration: ensure tools array exists
  if (!loaded.tools) {
    loaded.tools = [];
  }
  // Migration: move old tool resources to tools array
  for (const toolId of OLD_TOOL_RESOURCE_IDS) {
    if ((loaded.resources[toolId] ?? 0) >= 1 && !loaded.tools.includes(toolId as ToolId)) {
      loaded.tools.push(toolId as ToolId);
    }
    delete loaded.resources[toolId];
  }
  // Migration: move old structure resources (raft, dugout, woven_basket) to buildings
  for (const buildingId of OLD_BUILDING_RESOURCE_IDS) {
    const count = loaded.resources[buildingId] ?? 0;
    if (count >= 1) {
      if (buildingId === "woven_basket") {
        // Stackable: add multiple entries
        for (let i = 0; i < count; i++) {
          loaded.buildings.push(buildingId as BuildingId);
        }
      } else if (!loaded.buildings.includes(buildingId as BuildingId)) {
        loaded.buildings.push(buildingId as BuildingId);
      }
    }
    delete loaded.resources[buildingId];
  }
  // Migration: ensure morale exists
  if (loaded.morale == null) {
    loaded.morale = 100;
  }
  // Migration: ensure moraleDecayProgressMs exists
  if (loaded.moraleDecayProgressMs == null) {
    loaded.moraleDecayProgressMs = 0;
  }
  // Migration: ensure discoveryLog exists
  if (!loaded.discoveryLog) {
    loaded.discoveryLog = [];
  }
  // Migration: ensure discoveredResources exists (backfill from inventory)
  if (!loaded.discoveredResources) {
    loaded.discoveredResources = Object.keys(loaded.resources).filter(
      (id) => (loaded.resources[id] ?? 0) > 0
    );
  }
  // Migration: ensure stations array exists
  if (!loaded.stations) {
    loaded.stations = [];
  }
  // Migration: ensure seenPhases exists
  if (!loaded.seenPhases) {
    loaded.seenPhases = ["bare_hands"];
  }
  // Migration: ensure repetitiveActionCount exists
  if (loaded.repetitiveActionCount == null) {
    loaded.repetitiveActionCount = 0;
  }
  // Migration: ensure savedActionProgress exists
  if (!loaded.savedActionProgress) {
    loaded.savedActionProgress = {};
  }
  // Migration: ensure completedActions/completedRecipes exist
  if (!loaded.completedActions) {
    loaded.completedActions = [];
  }
  if (!loaded.completedRecipes) {
    loaded.completedRecipes = [];
  }
  // Migration: ensure expeditionPity exists
  if (!loaded.expeditionPity) {
    loaded.expeditionPity = {};
  }
  // Migration: ensure lastSeenDiscoveryId exists (default to latest so old saves don't re-toast)
  if (loaded.lastSeenDiscoveryId == null) {
    loaded.lastSeenDiscoveryId = loaded.discoveryLog.length > 0
      ? Math.max(...loaded.discoveryLog.map((e: DiscoveryEntry) => e.id))
      : -1;
  }
  // Migration: grant rocky_shore biome if player already has flat_stone or chert
  if (!loaded.discoveredBiomes.includes("rocky_shore")) {
    if ((loaded.resources["flat_stone"] ?? 0) > 0 || (loaded.resources["chert"] ?? 0) > 0) {
      loaded.discoveredBiomes.push("rocky_shore");
    }
  }
  // Migration: replace removed action IDs with merged action
  if (loaded.currentAction && (loaded.currentAction.actionId === "collect_beach_stone" || loaded.currentAction.actionId === "collect_chert")) {
    loaded.currentAction.actionId = "comb_rocky_shore";
  }
  if (loaded.currentAction && typeof loaded.currentAction !== "object") {
    loaded.currentAction = null;
  }
  // Migration: remove items/buildings that no longer exist in current data
  for (const id of Object.keys(loaded.resources)) {
    if (!RESOURCES[id]) {
      delete loaded.resources[id];
    }
  }
  loaded.discoveredResources = loaded.discoveredResources.filter(
    (id) => !!RESOURCES[id]
  );
  // Migration: ensure all owned resources are in discoveredResources
  for (const id of Object.keys(loaded.resources)) {
    if ((loaded.resources[id] ?? 0) > 0 && !loaded.discoveredResources.includes(id)) {
      loaded.discoveredResources.push(id);
    }
  }
  loaded.buildings = loaded.buildings.filter((id) => !!BUILDINGS[id]);
  // Migration: ensure analytics fields exist
  if (loaded.actionCompletions == null) {
    loaded.actionCompletions = 0;
  }
  if (!loaded.actionCompletionCounts || typeof loaded.actionCompletionCounts !== "object") {
    loaded.actionCompletionCounts = {};
  }
  if (!loaded.seenLoreNotes) {
    loaded.seenLoreNotes = [];
  }
  if (loaded.activePlayTimeMs == null) {
    loaded.activePlayTimeMs = 0;
  }
  if (!loaded.sentMilestones) {
    loaded.sentMilestones = [];
  }
  // Migration: ensure routines fields exist
  if (!loaded.routines) {
    loaded.routines = [];
  }
  if (loaded.activeRoutine === undefined) {
    loaded.activeRoutine = null;
  }
  // Migration: ensure actionQueue exists
  if (!loaded.actionQueue) {
    loaded.actionQueue = [];
  }
  // Migration: ensure queueMode exists
  if (loaded.queueMode === undefined) {
    loaded.queueMode = false;
  }
  // Migration: mainlandUnlocked defaults to undefined (falsy), no action needed
  // Migration: ensure equipment system fields exist
  if (!loaded.equipmentInventory) {
    loaded.equipmentInventory = [];
  }
  if (!loaded.loadout) {
    loaded.loadout = {};
  }
  // Migration: reset mainland state when experimental version changes
  if (loaded.mainlandUnlocked && (loaded.mainlandVersion ?? 0) < MAINLAND_VERSION) {
    resetMainlandState(loaded);
  }

  return loaded;
}

export function loadGame(modId?: string): GameState | null {
  const raw = localStorage.getItem(getSaveKey(modId));
  if (!raw) return null;
  try {
    return normalizeGameState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function getResource(state: GameState, id: string): number {
  return state.resources[id] ?? 0;
}

export function hasTool(state: GameState, toolId: ToolId): boolean {
  return state.tools.includes(toolId);
}

export function hasBuilding(state: GameState, buildingId: BuildingId): boolean {
  return state.buildings.includes(buildingId);
}

/** Vessel tier check — higher-tier vessels satisfy lower-tier requirements. Uses data-driven vesselTier. */
export function hasVessel(state: GameState, vesselId: BuildingId): boolean {
  const BUILDINGS = getBuildings();
  const requiredDef = BUILDINGS[vesselId];
  if (!requiredDef?.vesselTier) return hasBuilding(state, vesselId);

  const requiredTier = requiredDef.vesselTier;
  return state.buildings.some((bid) => {
    const bdef = BUILDINGS[bid];
    return bdef?.vesselTier != null && bdef.vesselTier >= requiredTier;
  });
}

export function getBuildingCount(state: GameState, buildingId: BuildingId): number {
  return state.buildings.filter((b) => b === buildingId).length;
}

/** Get the total count of all buildings sharing a maxCountGroup with the given building.
 *  If the building has no group, returns the count of just that building. */
export function getGroupBuildingCount(state: GameState, buildingId: BuildingId): number {
  const BUILDINGS = getBuildings();
  const bdef = BUILDINGS[buildingId];
  if (!bdef?.maxCountGroup) return getBuildingCount(state, buildingId);
  const group = bdef.maxCountGroup;
  return state.buildings.filter((b) => BUILDINGS[b]?.maxCountGroup === group).length;
}

/** Get effective maxCount for a stackable building, including bonuses from other buildings. */
export function getEffectiveMaxCount(state: GameState, buildingId: BuildingId): number {
  const BUILDINGS = getBuildings();
  const bdef = BUILDINGS[buildingId];
  const base = bdef?.maxCount ?? 1;
  let bonus = 0;
  for (const b of Object.values(BUILDINGS)) {
    if (b.maxCountBonuses && state.buildings.includes(b.id)) {
      for (const mcb of b.maxCountBonuses) {
        if (mcb.buildingId === buildingId) bonus += mcb.amount;
      }
    }
  }
  return base + bonus;
}

/** Check if a resource has a given tag. */
export function resourceHasTag(resourceId: string, tag: string): boolean {
  const RESOURCES = getResources();
  const def = RESOURCES[resourceId];
  return def?.tags?.includes(tag) ?? false;
}

/** Default per-item storage limit before any building bonuses. */
export const BASE_STORAGE_LIMIT = 10;

/** Get the storage limit for a specific resource, accounting for building bonuses. */
export function getStorageLimit(state: GameState, resourceId: string): number {
  const RESOURCES = getResources();
  const BUILDINGS = getBuildings();
  const def = RESOURCES[resourceId];
  if (!def) return BASE_STORAGE_LIMIT;

  let limit = BASE_STORAGE_LIMIT;
  const tags = def.tags ?? [];

  for (const bid of state.buildings) {
    const bdef = BUILDINGS[bid];
    if (bdef?.storageBonus) {
      for (const bonus of bdef.storageBonus) {
        // Check tag filter: if tag is set, item must have it
        if (bonus.tag && !tags.includes(bonus.tag)) continue;
        // Check excludeTags filter: item must NOT have any of these
        if (bonus.excludeTags && bonus.excludeTags.some((t) => tags.includes(t))) continue;
        limit += bonus.amount;
      }
    }
  }

  return limit;
}

/** Get total count of all resources sharing the same storageCapGroup. */
export function getStorageGroupTotal(state: GameState, groupId: string): number {
  const RESOURCES = getResources();
  let total = 0;
  for (const [rid, def] of Object.entries(RESOURCES)) {
    if (def.storageCapGroup === groupId) {
      total += state.resources[rid] ?? 0;
    }
  }
  return total;
}

/** Check if a resource is at its storage cap, accounting for group caps. */
export function isAtStorageCap(state: GameState, resourceId: string): boolean {
  const RESOURCES = getResources();
  const def = RESOURCES[resourceId];
  const limit = getStorageLimit(state, resourceId);
  const groupId = def?.storageCapGroup;
  const used = groupId ? getStorageGroupTotal(state, groupId) : (state.resources[resourceId] ?? 0);
  return used >= limit;
}

/** Get the names of other resources sharing the same storageCapGroup. */
export function getStorageGroupMembers(state: GameState, resourceId: string): { id: string; name: string; amount: number }[] {
  const RESOURCES = getResources();
  const def = RESOURCES[resourceId];
  if (!def?.storageCapGroup) return [];
  const members: { id: string; name: string; amount: number }[] = [];
  for (const [rid, rdef] of Object.entries(RESOURCES)) {
    if (rdef.storageCapGroup === def.storageCapGroup && rid !== resourceId) {
      members.push({ id: rid, name: rdef.name, amount: state.resources[rid] ?? 0 });
    }
  }
  return members;
}

/** Add resource, clamping to the storage limit. Returns the amount actually added.
 *  If current amount already exceeds the limit (e.g. old save), no more is added but nothing is removed.
 *  Resources with a storageCapGroup share their cap with all resources in the group. */
export function addResource(state: GameState, resourceId: string, amount: number): number {
  const RESOURCES = getResources();
  const def = RESOURCES[resourceId];
  const current = state.resources[resourceId] ?? 0;
  const limit = getStorageLimit(state, resourceId);

  // For grouped resources, available space is based on the group total
  const groupId = def?.storageCapGroup;
  const used = groupId ? getStorageGroupTotal(state, groupId) : current;

  if (used >= limit) {
    return 0;
  }
  const space = limit - used;
  const actuallyAdded = Math.min(amount, space);
  state.resources[resourceId] = current + actuallyAdded;
  return actuallyAdded;
}

/** Morale decay rate: 1 point per this many ms of play time. */
export const MORALE_DECAY_INTERVAL_MS = 120000; // 1 morale per 2 minutes

/** Get the effective morale decay interval, accounting for comfort buildings.
 *  Returns the base interval divided by (1 - best comfort reduction). */
export function getEffectiveDecayInterval(state: GameState): number {
  const BUILDINGS = getBuildings();
  let bestReduction = 0;
  for (const bid of state.buildings) {
    const bdef = BUILDINGS[bid];
    if (bdef?.comfortDecayReduction && bdef.comfortDecayReduction > bestReduction) {
      bestReduction = bdef.comfortDecayReduction;
    }
  }
  if (bestReduction <= 0) return MORALE_DECAY_INTERVAL_MS;
  return Math.round(MORALE_DECAY_INTERVAL_MS / (1 - bestReduction));
}

/** Duration multiplier from morale. At 100 = 0.8 (20% faster), 50 = 1.0, 0 = 1.2 (20% slower).
 *  Morale can exceed 100 (soft cap) with diminishing returns above. */
export function getMoraleDurationMultiplier(morale: number): number {
  return 1 - 0.2 * (morale - 50) / 50;
}

/** Calculate effective morale gain after soft cap (half effect above 100). */
export function getEffectiveMoraleGain(currentMorale: number, amount: number): number {
  if (currentMorale < 100) {
    const belowCap = Math.min(amount, 100 - currentMorale);
    const aboveCap = amount - belowCap;
    return belowCap + (aboveCap > 0 ? Math.floor(aboveCap / 2) : 0);
  }
  return Math.floor(amount / 2);
}

/** Get tool-based speed multiplier for an action or recipe.
 *  Stacks multiplicatively if multiple tools apply. */
export function getToolSpeedMultiplier(state: GameState, actionOrRecipeId: string): number {
  const TOOLS = getTools();
  let mult = 1;
  for (const t of Object.values(TOOLS)) {
    if (!t.speedBonus) continue;
    const ids = [...(t.speedBonus.actionIds ?? []), ...(t.speedBonus.recipeIds ?? [])];
    if (!ids.includes(actionOrRecipeId)) continue;
    if (state.tools.includes(t.id)) {
      mult *= t.speedBonus.multiplier;
    }
  }
  return mult;
}

/** Get tool-based output bonus chance for a recipe.
 *  Returns the combined chance of +1 bonus output (stacks additively). */
export function getToolOutputBonusChance(state: GameState, recipeId: string): number {
  const TOOLS = getTools();
  let chance = 0;
  for (const t of Object.values(TOOLS)) {
    if (!t.outputBonus) continue;
    if (!t.outputBonus.recipeIds.includes(recipeId)) continue;
    if (state.tools.includes(t.id)) {
      chance += t.outputBonus.chance;
    }
  }
  return Math.min(1, chance);
}

/** Total food value the player currently has (data-driven from registry). */
export function getTotalFood(state: GameState): number {
  return getFoodValues().reduce(
    (sum, f) => sum + (state.resources[f.id] ?? 0) * f.value,
    0
  );
}

/** Get the food value of a single resource item. Returns 0 if not food. */
export function getFoodValue(resourceId: string): number {
  const RESOURCES = getResources();
  return RESOURCES[resourceId]?.foodValue ?? 0;
}

/** Total water value the player currently has (data-driven from registry). */
export function getTotalWater(state: GameState): number {
  return getWaterValues().reduce(
    (sum, w) => sum + (state.resources[w.id] ?? 0) * w.value,
    0
  );
}

/** Deduct `amount` water value from inventory. Returns record of what was taken, or null if insufficient. */
export function deductWater(state: GameState, amount: number): Record<string, number> | null {
  if (getTotalWater(state) < amount) return null;
  const waterValues = getWaterValues();
  const taken: Record<string, number> = {};
  let remaining = amount;
  for (const w of waterValues) {
    if (remaining <= 0) break;
    const have = state.resources[w.id] ?? 0;
    const canTake = Math.min(have, Math.floor(remaining / w.value));
    if (canTake > 0) {
      state.resources[w.id] = have - canTake;
      taken[w.id] = canTake;
      remaining -= canTake * w.value;
    }
  }
  if (remaining > 0) {
    for (const w of waterValues) {
      if (remaining <= 0) break;
      const have = state.resources[w.id] ?? 0;
      if (have > 0 && w.value >= remaining) {
        state.resources[w.id] = have - 1;
        taken[w.id] = (taken[w.id] ?? 0) + 1;
        remaining -= w.value;
        break;
      }
    }
  }
  return remaining <= 0 ? taken : null;
}

/** Deduct `amount` food value from inventory, preferring low-value food first. Returns record of what was taken, or null if insufficient. */
export function deductFood(state: GameState, amount: number): Record<string, number> | null {
  if (getTotalFood(state) < amount) return null;
  const foodValues = getFoodValues();
  const taken: Record<string, number> = {};
  let remaining = amount;
  for (const f of foodValues) {
    if (remaining <= 0) break;
    const have = state.resources[f.id] ?? 0;
    const canTake = Math.min(have, Math.floor(remaining / f.value));
    if (canTake > 0) {
      state.resources[f.id] = have - canTake;
      taken[f.id] = canTake;
      remaining -= canTake * f.value;
    }
  }
  // Second pass: if there's remaining < a food's value but we have high-value food, use one
  if (remaining > 0) {
    for (const f of foodValues) {
      if (remaining <= 0) break;
      const have = state.resources[f.id] ?? 0;
      if (have > 0 && f.value >= remaining) {
        state.resources[f.id] = have - 1;
        taken[f.id] = (taken[f.id] ?? 0) + 1;
        remaining -= f.value;
        break;
      }
    }
  }
  return remaining <= 0 ? taken : null;
}
