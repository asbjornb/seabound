import { getPhases } from "../data/registry";
import type { GameState, PhaseDef } from "../data/types";

export type GamePhase = string;

export interface PhaseInfo {
  id: string;
  index: number;
  name: string;
  tagline: string;
}

/** Determine the highest phase the player has reached (data-driven). */
export function getCurrentPhase(state: GameState): PhaseInfo {
  const phases = getPhases();
  const sorted = [...phases].sort((a, b) => a.order - b.order);

  let best: PhaseDef = sorted[0];

  for (const phase of sorted) {
    if (phase.conditions.length === 0) continue; // default phase
    const matches = phase.conditions.some((cond) => {
      switch (cond.type) {
        case "has_resource":
          return (state.resources[cond.id] ?? 0) >= 1;
        case "has_building":
          return state.buildings.includes(cond.id);
        case "has_biome":
          return state.discoveredBiomes.includes(cond.id);
        case "has_tool":
          return state.tools.includes(cond.id);
        default:
          return false;
      }
    });
    if (matches && phase.order > best.order) {
      best = phase;
    }
  }

  return {
    id: best.id,
    index: best.order,
    name: best.name,
    tagline: best.tagline,
  };
}
