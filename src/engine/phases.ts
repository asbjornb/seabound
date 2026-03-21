import { GameState } from "../data/types";

export type GamePhase = "bare_hands" | "bamboo" | "fire" | "stone" | "maritime";

export interface PhaseInfo {
  id: GamePhase;
  index: number;
  name: string;
  tagline: string;
}

export const PHASES: PhaseInfo[] = [
  { id: "bare_hands", index: 0, name: "Bare Hands", tagline: "Washed ashore. Everything starts here." },
  { id: "bamboo", index: 1, name: "Bamboo", tagline: "The grove provides. Tools take shape." },
  { id: "fire", index: 2, name: "Fire", tagline: "The night no longer owns you." },
  { id: "stone", index: 3, name: "Stone & Clay", tagline: "The island yields its deeper secrets." },
  { id: "maritime", index: 4, name: "Maritime", tagline: "The horizon opens." },
];

/** Determine the highest phase the player has reached. */
export function getCurrentPhase(state: GameState): PhaseInfo {
  const has = (id: string) => (state.resources[id] ?? 0) >= 1;
  const hasBuilding = (id: string) => state.buildings.includes(id as never);
  const hasBiome = (id: string) => state.discoveredBiomes.includes(id as never);

  // Maritime: has raft or dugout
  if (has("raft") || has("dugout")) return PHASES[4];

  // Stone: has stone tools or clay items
  if (has("hammerstone") || has("stone_flake") || has("stone_blade") || has("stone_axe") || has("clay") || has("shaped_clay_pot")) return PHASES[3];

  // Fire: has camp fire building
  if (hasBuilding("camp_fire")) return PHASES[2];

  // Bamboo: discovered bamboo grove or has bamboo items
  if (hasBiome("bamboo_grove") || has("bamboo_cane") || has("bamboo_knife")) return PHASES[1];

  return PHASES[0];
}
