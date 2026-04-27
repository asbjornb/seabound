import { describe, it, expect } from "vitest";
import { processTick } from "../engine/tick";
import { getStorageLimit } from "../engine/gameState";
import { getActionById, getRecipeById } from "../data/registry";
import { makeState } from "./testHelpers";

describe("stop-if-full", () => {
  it("stops gathering when any drop hits storage cap mid-action", () => {
    const action = getActionById("collect_driftwood")!;
    expect(action).toBeDefined();
    // collect_driftwood drops driftwood_branch (guaranteed, chance=1)
    expect(action.drops.length).toBeGreaterThan(0);
    expect(action.drops[0].resourceId).toBe("driftwood_branch");

    const state = makeState({
      currentAction: {
        actionId: "collect_driftwood",
        startedAt: 0,
        type: "gather",
      },
      discoveredResources: ["driftwood_branch"],
    });

    // Fill driftwood_branch to cap
    const limit = getStorageLimit(state, "driftwood_branch");
    state.resources["driftwood_branch"] = limit;

    // Process enough time for multiple completions
    const result = processTick(state, action.durationMs * 5);

    // Action should have been stopped
    expect(state.currentAction).toBeNull();
    // Should have completed at most 1 cycle (the one that filled it)
    // Since it was already full, it should stop after the first completion
    expect(result.completions.length).toBeLessThanOrEqual(1);
  });

  it("does NOT stop on drops that were already full when action started", () => {
    // gather_coconuts: coconut (guaranteed), coconut_husk (chance=0.4)
    // If husk is already at cap when the player clicks, fullAtStart excludes it
    // so the action keeps gathering coconuts until coconut also fills.
    const action = getActionById("gather_coconuts")!;
    expect(action).toBeDefined();

    const state = makeState({
      currentAction: {
        actionId: "gather_coconuts",
        startedAt: 0,
        type: "gather",
        fullAtStart: ["coconut_husk"],
      },
      discoveredBiomes: ["beach", "coconut_grove"],
      discoveredResources: ["coconut", "coconut_husk"],
    });

    const huskLimit = getStorageLimit(state, "coconut_husk");
    state.resources["coconut_husk"] = huskLimit;
    state.resources["coconut"] = 0;

    processTick(state, action.durationMs * 3);

    expect(state.currentAction).not.toBeNull();
  });

  it("ignores resources that were already full when action started (fullAtStart)", () => {
    const action = getActionById("collect_driftwood")!;

    const state = makeState({
      currentAction: {
        actionId: "collect_driftwood",
        startedAt: 0,
        type: "gather",
        fullAtStart: ["driftwood_branch"], // was already full when started
      },
      discoveredResources: ["driftwood_branch"],
    });

    const limit = getStorageLimit(state, "driftwood_branch");
    state.resources["driftwood_branch"] = limit;

    // Process enough time for several completions
    processTick(state, action.durationMs * 3);

    // Should NOT stop — driftwood was already full at start, so it's excluded
    // (no other guaranteed drops to check, so isOutputFull returns false)
    expect(state.currentAction).not.toBeNull();
  });
});

describe("gather drops", () => {
  it("includes food resources in gather drops", () => {
    // Bug regression: food resources were filtered out of usefulDrops
    // because resourceHasUse didn't consider food/water as useful.
    const action = getActionById("gather_coconuts")!;

    const state = makeState({
      currentAction: {
        actionId: "gather_coconuts",
        startedAt: 0,
        type: "gather",
      },
      discoveredBiomes: ["beach", "coconut_grove"],
    });

    // Process one completion
    const result = processTick(state, action.durationMs + 1);

    expect(result.completions.length).toBe(1);
    // The guaranteed drop should be coconut (a food resource)
    const coconutDrop = result.completions[0].drops.find(
      (d) => d.name === "coconut"
    );
    expect(coconutDrop).toBeDefined();
    expect(coconutDrop!.amount).toBeGreaterThan(0);
  });
});

describe("offline progress", () => {
  it("processes many completions for a long offline gap", () => {
    const action = getActionById("collect_driftwood")!;
    expect(action).toBeDefined();

    const state = makeState({
      currentAction: {
        actionId: "collect_driftwood",
        startedAt: 0,
        type: "gather",
      },
      discoveredResources: ["driftwood_branch"],
    });

    // Simulate 1 hour offline (3,600,000ms)
    const offlineMs = 3_600_000;
    const result = processTick(state, offlineMs);

    const expectedCompletions = Math.floor(offlineMs / action.durationMs);
    expect(result.completions.length).toBeGreaterThan(0);
    // Should complete many cycles (unless storage fills)
    expect(result.completions.length).toBeLessThanOrEqual(expectedCompletions);
    // Resources should have been added
    expect(state.resources["driftwood_branch"]).toBeGreaterThan(0);
    // Action should still be running (or stopped due to full storage)
    // Either way, lastTickAt should be updated
    expect(state.lastTickAt).toBe(offlineMs);
  });

  it("returns unusedMs when action stops due to full storage", () => {
    const action = getActionById("collect_driftwood")!;

    const state = makeState({
      currentAction: {
        actionId: "collect_driftwood",
        startedAt: 0,
        type: "gather",
      },
      discoveredResources: ["driftwood_branch"],
    });

    // Fill storage almost to cap (leave room for 1)
    const limit = getStorageLimit(state, "driftwood_branch");
    state.resources["driftwood_branch"] = limit - 1;

    // Simulate enough time for many completions
    const result = processTick(state, action.durationMs * 100);

    // Action should have stopped due to full storage
    expect(state.currentAction).toBeNull();
    // unusedMs should be > 0 (remaining time after the stop)
    expect(result.unusedMs).toBeGreaterThan(0);
  });

  it("handles clock skew (startedAt in the future)", () => {
    const state = makeState({
      currentAction: {
        actionId: "collect_driftwood",
        startedAt: 999_999_999, // far in the future
        type: "gather",
      },
    });

    // Process at an earlier time — should not crash or produce negative time
    const result = processTick(state, 1000);

    // Should not have completed any actions (startedAt was reset to now)
    expect(result.completions.length).toBe(0);
    // startedAt should have been clamped to now
    expect(state.currentAction!.startedAt).toBe(1000);
  });

  it("returns unusedMs for repeatable craft that runs out of inputs", () => {
    // craft_rope: repeatable, uses plant_fiber
    const recipe = getRecipeById("craft_rope");
    if (!recipe || !recipe.repeatable) return; // skip if recipe doesn't exist

    const state = makeState({
      currentAction: {
        actionId: "craft_rope",
        startedAt: 0,
        type: "craft",
        recipeId: "craft_rope",
      },
      discoveredResources: ["plant_fiber", "rope"],
    });

    // Give enough inputs for exactly 2 crafts
    const inputAmount = recipe.inputs[0]?.amount ?? 1;
    state.resources[recipe.inputs[0].resourceId] = inputAmount * 2;

    // Simulate enough time for many cycles
    const result = processTick(state, recipe.durationMs * 10);

    // Should have completed 2 crafts then stopped
    expect(result.completions.length).toBe(2);
    // Should have unused time
    expect(result.unusedMs).toBeGreaterThan(0);
    // Action should be stopped (no more inputs)
    expect(state.currentAction).toBeNull();
  });
});
