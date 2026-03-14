import { GameState, SkillId } from "../data/types";

export function createInitialState(): GameState {
  const skills = {} as GameState["skills"];
  const allSkills: SkillId[] = [
    "woodcutting",
    "mining",
    "foraging",
    "crafting",
    "firemaking",
    "exploration",
  ];
  for (const id of allSkills) {
    skills[id] = { xp: 0, level: 1 };
  }
  return {
    resources: {},
    skills,
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
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function getResource(state: GameState, id: string): number {
  return state.resources[id] ?? 0;
}
