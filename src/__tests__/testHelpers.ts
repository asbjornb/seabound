import type { GameState } from "../data/types";
import { createInitialState } from "../engine/gameState";

/**
 * Create a fresh game state for testing, with optional overrides.
 */
export function makeState(overrides?: Partial<GameState>): GameState {
  const base = createInitialState();
  // Fix lastTickAt so tests are deterministic
  base.lastTickAt = 0;
  return { ...base, ...overrides };
}
