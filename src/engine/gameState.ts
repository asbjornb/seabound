import { BUILDINGS } from "../data/buildings";
import { RESOURCES } from "../data/resources";
import { BuildingId, GameState, ResourceId, SkillId } from "../data/types";

const ALL_SKILLS: SkillId[] = [
  "foraging",
  "fishing",
  "woodworking",
  "crafting",
  "cooking",
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
    discoveryLog: [],
    discoveredResources: [],
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
  // Woven baskets: +1 storage per basket for small non-food items
  const size = def.size ?? "small";
  if (size === "small" && def.category !== "food") {
    limit += state.resources["woven_basket"] ?? 0;
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

/** Food resources and their food value. Ordered low-value first so deductFood prefers cheap food. */
export const FOOD_VALUES: { id: ResourceId; value: number }[] = [
  { id: "coconut", value: 1 },
  { id: "small_fish", value: 1 },
  { id: "crab", value: 1 },
  { id: "large_fish", value: 2 },
  { id: "cooked_fish", value: 2 },
  { id: "cooked_crab", value: 2 },
  { id: "cooked_large_fish", value: 4 },
];

/** Total food value the player currently has. */
export function getTotalFood(state: GameState): number {
  return FOOD_VALUES.reduce(
    (sum, f) => sum + (state.resources[f.id] ?? 0) * f.value,
    0
  );
}

/** Get the food value of a single resource item. Returns 0 if not food. */
export function getFoodValue(resourceId: string): number {
  return FOOD_VALUES.find((f) => f.id === resourceId)?.value ?? 0;
}

/** Deduct `amount` food value from inventory, preferring low-value food first. Returns record of what was taken, or null if insufficient. */
export function deductFood(state: GameState, amount: number): Record<string, number> | null {
  if (getTotalFood(state) < amount) return null;
  const taken: Record<string, number> = {};
  let remaining = amount;
  for (const f of FOOD_VALUES) {
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
    for (const f of FOOD_VALUES) {
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
