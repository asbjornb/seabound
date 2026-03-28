/**
 * @deprecated Use ../data/registry.ts instead. This file is kept for backward compatibility.
 */
import { getActionById, getExpeditionById, getRecipeById, getStationById } from "./registry";

export const ACTIONS_BY_ID = new Proxy({} as Record<string, any>, {
  get: (_, key: string) => getActionById(key),
});
export const RECIPES_BY_ID = new Proxy({} as Record<string, any>, {
  get: (_, key: string) => getRecipeById(key),
});
export const EXPEDITIONS_BY_ID = new Proxy({} as Record<string, any>, {
  get: (_, key: string) => getExpeditionById(key),
});
export const STATIONS_BY_ID = new Proxy({} as Record<string, any>, {
  get: (_, key: string) => getStationById(key),
});
