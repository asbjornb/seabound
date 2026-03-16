import { BUILDINGS } from "../data/buildings";
import { RESOURCES } from "../data/resources";
import { BuildingId, GameState, ResourceId, SkillId } from "../data/types";

const ALL_SKILLS: SkillId[] = [
  "foraging",
  "fishing",
  "woodworking",
  "crafting",
  "weaving",
  "construction",
  "farming",
  "navigation",
  "preservation",
];

export function createInitialState(): GameState {
  const skills = {} as GameState["skills"];
  for (const id of ALL_SKILLS) {
    skills[id] = { xp: 0, level: 1 };
  }
  return {
    resources: {},
    skills,
    discoveredBiomes: ["beach"],
    buildings: [] as BuildingId[],
    currentAction: null,
    lastTickAt: Date.now(),
    totalPlayTimeMs: 0,
  };
}

const SAVE_KEY = "seabound_save";

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const loaded = JSON.parse(raw) as GameState;
    // Migration: ensure new fields exist
    if (!loaded.discoveredBiomes) {
      loaded.discoveredBiomes = ["beach"];
    }
    // Ensure all skills exist (in case save is from old version)
    for (const id of ALL_SKILLS) {
      if (!loaded.skills[id]) {
        loaded.skills[id] = { xp: 0, level: 1 };
      }
    }
    // Migration: ensure buildings array exists
    if (!loaded.buildings) {
      loaded.buildings = [];
      // If player already has bow_drill_kit, auto-grant camp_fire building
      // so they don't lose access to fire-dependent recipes
      if ((loaded.resources["bow_drill_kit"] ?? 0) >= 1) {
        loaded.buildings.push("camp_fire");
      }
    }
    return loaded;
  } catch {
    return null;
  }
}

export function getResource(state: GameState, id: string): number {
  return state.resources[id] ?? 0;
}

/** Default per-item storage limit before any building bonuses. */
export const BASE_STORAGE_LIMIT = 10;

/** Get the storage limit for a specific resource, accounting for building bonuses. */
export function getStorageLimit(state: GameState, resourceId: string): number {
  const def = RESOURCES[resourceId];
  if (!def) return BASE_STORAGE_LIMIT;

  let limit = BASE_STORAGE_LIMIT;
  for (const bid of state.buildings) {
    const bdef = BUILDINGS[bid];
    if (bdef?.storageBonus) {
      for (const bonus of bdef.storageBonus) {
        if (bonus.category === def.category) {
          limit += bonus.amount;
        }
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

/** Resources that count as food for expedition costs. */
export const FOOD_RESOURCES: ResourceId[] = [
  "small_fish",
  "crab",
  "coconut",
  "cooked_fish",
  "cooked_crab",
];

/** Total food items the player currently has. */
export function getTotalFood(state: GameState): number {
  return FOOD_RESOURCES.reduce(
    (sum, id) => sum + (state.resources[id] ?? 0),
    0
  );
}

/** Deduct `amount` food from inventory, drawing from available food resources. Returns record of what was taken, or null if insufficient. */
export function deductFood(state: GameState, amount: number): Record<string, number> | null {
  if (getTotalFood(state) < amount) return null;
  const taken: Record<string, number> = {};
  let remaining = amount;
  for (const id of FOOD_RESOURCES) {
    if (remaining <= 0) break;
    const have = state.resources[id] ?? 0;
    const take = Math.min(have, remaining);
    state.resources[id] = have - take;
    if (take > 0) taken[id] = take;
    remaining -= take;
  }
  return taken;
}
