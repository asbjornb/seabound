/**
 * Re-exports pack lookup tables for backwards compatibility.
 * New code should import from dataPack.ts directly.
 */
import { getPackLookups } from "./dataPack";

export function getActionsByID() {
  return getPackLookups().actionsByID;
}
export function getRecipesByID() {
  return getPackLookups().recipesByID;
}
export function getExpeditionsByID() {
  return getPackLookups().expeditionsByID;
}
export function getStationsByID() {
  return getPackLookups().stationsByID;
}
