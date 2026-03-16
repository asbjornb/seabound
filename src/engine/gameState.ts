import { GameState, SkillId } from "../data/types";

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
    return loaded;
  } catch {
    return null;
  }
}

export function getResource(state: GameState, id: string): number {
  return state.resources[id] ?? 0;
}
