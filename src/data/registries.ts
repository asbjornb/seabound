import { ACTIONS } from "./actions";
import { EXPEDITIONS } from "./expeditions";
import { RECIPES } from "./recipes";
import { STATIONS } from "./stations";

function createRegistry<T extends { id: string }>(
  items: readonly T[]
): Record<string, T> {
  const registry: Record<string, T> = {};
  for (const item of items) {
    registry[item.id] = item;
  }
  return registry;
}

export const ACTIONS_BY_ID = createRegistry(ACTIONS);
export const RECIPES_BY_ID = createRegistry(RECIPES);
export const EXPEDITIONS_BY_ID = createRegistry(EXPEDITIONS);
export const STATIONS_BY_ID = createRegistry(STATIONS);
