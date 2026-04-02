import { describe, it, expect } from "vitest";
import { processTick } from "../engine/tick";
import { getRecipeById } from "../data/registry";
import { makeState } from "./testHelpers";

describe("repeatable craft", () => {
  it("consumes inputs each cycle and produces output", () => {
    const recipe = getRecipeById("shred_coconut_husk")!;
    expect(recipe).toBeDefined();
    expect(recipe.repeatable).toBe(true);
    // shred_coconut_husk: 1 coconut_husk → 1 rough_fiber, 5s

    const state = makeState({
      currentAction: {
        type: "craft",
        actionId: "shred_coconut_husk",
        recipeId: "shred_coconut_husk",
        startedAt: 0,
      },
      resources: { coconut_husk: 3 },
      discoveredResources: ["coconut_husk"],
    });

    // Enough time for 2 completions
    const result = processTick(state, recipe.durationMs * 2 + 1);

    expect(result.completions.length).toBe(2);
    expect(state.resources["coconut_husk"]).toBe(1); // 3 - 2 consumed
    expect(state.resources["rough_fiber"]).toBeGreaterThanOrEqual(2);
  });

  it("stops when inputs run out", () => {
    const recipe = getRecipeById("shred_coconut_husk")!;

    const state = makeState({
      currentAction: {
        type: "craft",
        actionId: "shred_coconut_husk",
        recipeId: "shred_coconut_husk",
        startedAt: 0,
      },
      resources: { coconut_husk: 1 },
      discoveredResources: ["coconut_husk"],
    });

    // Enough time for 5 completions, but only 1 input
    const result = processTick(state, recipe.durationMs * 5);

    expect(result.completions.length).toBe(1);
    expect(state.currentAction).toBeNull(); // stopped due to no more inputs
    expect(state.resources["coconut_husk"]).toBe(0);
  });

  it("non-repeatable recipe completes once then stops", () => {
    // craft_bamboo_knife: oneTimeCraft, non-repeatable
    const recipe = getRecipeById("craft_bamboo_knife")!;
    expect(recipe).toBeDefined();
    expect(recipe.repeatable).toBeFalsy();

    const state = makeState({
      currentAction: {
        type: "craft",
        actionId: "craft_bamboo_knife",
        recipeId: "craft_bamboo_knife",
        startedAt: 0,
      },
      resources: { bamboo_splinter: 5 },
      discoveredResources: ["bamboo_splinter"],
    });

    const result = processTick(state, recipe.durationMs * 5);

    // Only 1 completion for non-repeatable
    expect(result.completions.length).toBe(1);
    expect(state.currentAction).toBeNull();
  });
});

describe("expedition food/water consumption", () => {
  it("stops expedition when food runs out", () => {
    // explore_beach costs 4 food per cycle, 8s duration
    const state = makeState({
      currentAction: {
        type: "expedition",
        actionId: "explore_beach",
        expeditionId: "explore_beach",
        startedAt: 0,
      },
      resources: { coconut: 4 }, // 4 food value total
      discoveredBiomes: ["beach"],
    });

    // Enough time for several cycles (8s each)
    processTick(state, 8000 * 5);

    // Should have completed 1 cycle (consuming 4 food), then stopped
    expect(state.resources["coconut"]).toBe(0);
    expect(state.currentAction).toBeNull();
  });
});
