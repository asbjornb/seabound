import { getDataPack, getPackLookups } from "../data/dataPack";
import { GameState, RecipeDef, RecipeInput, TagInput } from "../data/types";

/** Return recipe inputs with building-removed inputs filtered out. */
export function getEffectiveInputs(recipe: RecipeDef, state: GameState): RecipeInput[] {
  return recipe.inputs.filter(
    (inp) => !inp.removedByBuilding || !state.buildings.includes(inp.removedByBuilding)
  );
}

/**
 * Resolve tag-based inputs into concrete RecipeInput[].
 * Picks `count` distinct resources the player owns (>=1) that have the given tag,
 * preferring lower food-value items first (using FOOD_VALUES order for "food" tag,
 * alphabetical otherwise).
 * Returns null if the player doesn't have enough distinct tagged resources.
 */
export function resolveTagInputs(
  tagInputs: TagInput[],
  state: GameState,
  excludeIds?: Set<string>
): RecipeInput[] | null {
  const pack = getDataPack();
  const result: RecipeInput[] = [];
  for (const ti of tagInputs) {
    // Find all resources with this tag that the player has >=1 of
    const candidates = Object.values(pack.resources)
      .filter((r) => r.tags?.includes(ti.tag) && (state.resources[r.id] ?? 0) >= 1)
      .filter((r) => !excludeIds || !excludeIds.has(r.id))
      .map((r) => r.id);

    // Sort by food value (low first) for "food" tag, otherwise alphabetical
    if (ti.tag === "food") {
      const foodOrder = new Map(pack.foodValues.map((f, i) => [f.id, i]));
      candidates.sort((a, b) => (foodOrder.get(a) ?? 999) - (foodOrder.get(b) ?? 999));
    } else {
      candidates.sort();
    }

    if (candidates.length < ti.count) return null;

    // Pick the first `count` candidates
    for (let i = 0; i < ti.count; i++) {
      result.push({ resourceId: candidates[i], amount: 1 });
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
  const pack = getDataPack();
  const skills = {} as GameState["skills"];
  for (const id of Object.keys(pack.skills)) {
    skills[id] = { xp: 0, level: 1 };
  }
  return {
    resources: {},
    tools: [],
    skills,
    discoveredBiomes: [...pack.startingBiomes],
    buildings: [],
    currentAction: null,
    lastTickAt: Date.now(),
    totalPlayTimeMs: 0,
    morale: 100,
    moraleDecayProgressMs: 0,
    discoveryLog: [],
    discoveredResources: [],
    stations: [],
    seenPhases: [pack.startingPhase],
    repetitiveActionCount: 0,
  };
}

const SAVE_KEY = "seabound_save";

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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
  const pack = getDataPack();

  const loaded = structuredClone(raw) as GameState;
  if (!loaded.resources || typeof loaded.resources !== "object") {
    loaded.resources = {};
  }
  if (!loaded.skills || typeof loaded.skills !== "object") {
    loaded.skills = {} as GameState["skills"];
  }

  // Migration: ensure new fields exist
  if (!loaded.discoveredBiomes) {
    loaded.discoveredBiomes = [...pack.startingBiomes];
  }
  // Ensure all skills exist (in case save is from old version)
  for (const id of Object.keys(pack.skills)) {
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
    if ((loaded.resources[toolId] ?? 0) >= 1 && !loaded.tools.includes(toolId)) {
      loaded.tools.push(toolId);
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
          loaded.buildings.push(buildingId);
        }
      } else if (!loaded.buildings.includes(buildingId)) {
        loaded.buildings.push(buildingId);
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
    loaded.seenPhases = [pack.startingPhase];
  }
  // Migration: ensure repetitiveActionCount exists
  if (loaded.repetitiveActionCount == null) {
    loaded.repetitiveActionCount = 0;
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
    if (!pack.resources[id]) {
      delete loaded.resources[id];
    }
  }
  loaded.discoveredResources = loaded.discoveredResources.filter(
    (id) => !!pack.resources[id]
  );
  loaded.buildings = loaded.buildings.filter((id) => !!pack.buildings[id]);

  return loaded;
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
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

export function hasTool(state: GameState, toolId: string): boolean {
  return state.tools.includes(toolId);
}

export function hasBuilding(state: GameState, buildingId: string): boolean {
  return state.buildings.includes(buildingId);
}

/** Vessel tier ordering — higher-tier vessels satisfy lower-tier requirements. */
export function hasVessel(state: GameState, vesselId: string): boolean {
  const pack = getDataPack();
  const requiredTier = pack.vesselTiers.indexOf(vesselId);
  if (requiredTier === -1) return hasBuilding(state, vesselId);
  return pack.vesselTiers.slice(requiredTier).some((v) => state.buildings.includes(v));
}

export function getBuildingCount(state: GameState, buildingId: string): number {
  return state.buildings.filter((b) => b === buildingId).length;
}

/** Check if a resource has a given tag. */
export function resourceHasTag(resourceId: string, tag: string): boolean {
  const pack = getDataPack();
  const def = pack.resources[resourceId];
  return def?.tags?.includes(tag) ?? false;
}

/** Get the storage limit for a specific resource, accounting for building bonuses. */
export function getStorageLimit(state: GameState, resourceId: string): number {
  const pack = getDataPack();
  const def = pack.resources[resourceId];
  if (!def) return pack.baseStorageLimit;

  let limit = pack.baseStorageLimit;
  const tags = def.tags ?? [];

  for (const bid of state.buildings) {
    const bdef = pack.buildings[bid];
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

/** Add resource, clamping to the storage limit. Returns the amount actually added.
 *  If current amount already exceeds the limit (e.g. old save), no more is added but nothing is removed. */
export function addResource(state: GameState, resourceId: string, amount: number): number {
  const current = state.resources[resourceId] ?? 0;
  const limit = getStorageLimit(state, resourceId);
  if (current >= limit) {
    // Already at or over cap — don't add, but don't reduce either
    return 0;
  }
  const space = limit - current;
  const actuallyAdded = Math.min(amount, space);
  state.resources[resourceId] = current + actuallyAdded;
  return actuallyAdded;
}

/** Morale decay rate: 1 point per this many ms of play time. */
export const MORALE_DECAY_INTERVAL_MS = 120000; // 1 morale per 2 minutes

/** Duration multiplier from morale. At 100 = 0.8 (20% faster), 50 = 1.0, 0 = 1.2 (20% slower).
 *  Morale can exceed 100 (soft cap) with diminishing returns above. */
export function getMoraleDurationMultiplier(morale: number): number {
  return 1 - 0.2 * (morale - 50) / 50;
}

/** Get tool-based speed multiplier for an action or recipe.
 *  Stacks multiplicatively if multiple tools apply. */
export function getToolSpeedMultiplier(state: GameState, actionOrRecipeId: string): number {
  const { toolSpeedMap } = getPackLookups();
  const tools = toolSpeedMap.get(actionOrRecipeId);
  if (!tools) return 1;
  let mult = 1;
  for (const t of tools) {
    if (state.tools.includes(t.toolId)) {
      mult *= t.multiplier;
    }
  }
  return mult;
}

/** Get tool-based output bonus chance for a recipe.
 *  Returns the combined chance of +1 bonus output (stacks additively). */
export function getToolOutputBonusChance(state: GameState, recipeId: string): number {
  const { toolOutputMap } = getPackLookups();
  const tools = toolOutputMap.get(recipeId);
  if (!tools) return 0;
  let chance = 0;
  for (const t of tools) {
    if (state.tools.includes(t.toolId)) {
      chance += t.chance;
    }
  }
  return Math.min(1, chance);
}

/** Total food value the player currently has. */
export function getTotalFood(state: GameState): number {
  const pack = getDataPack();
  return pack.foodValues.reduce(
    (sum, f) => sum + (state.resources[f.id] ?? 0) * f.value,
    0
  );
}

/** Get the food value of a single resource item. Returns 0 if not food. */
export function getFoodValue(resourceId: string): number {
  const pack = getDataPack();
  return pack.foodValues.find((f) => f.id === resourceId)?.value ?? 0;
}

/** Total water value the player currently has. */
export function getTotalWater(state: GameState): number {
  const pack = getDataPack();
  return pack.waterValues.reduce(
    (sum, w) => sum + (state.resources[w.id] ?? 0) * w.value,
    0
  );
}

/** Deduct `amount` water value from inventory. Returns record of what was taken, or null if insufficient. */
export function deductWater(state: GameState, amount: number): Record<string, number> | null {
  if (getTotalWater(state) < amount) return null;
  const pack = getDataPack();
  const taken: Record<string, number> = {};
  let remaining = amount;
  for (const w of pack.waterValues) {
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
    for (const w of pack.waterValues) {
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
  const pack = getDataPack();
  const taken: Record<string, number> = {};
  let remaining = amount;
  for (const f of pack.foodValues) {
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
    for (const f of pack.foodValues) {
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
