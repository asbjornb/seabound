import { describe, it, expect } from "vitest";
import { processTick } from "../engine/tick";
import { getStorageLimit } from "../engine/gameState";
import { getActionById } from "../data/registry";
import { makeState } from "./testHelpers";

describe("stop-if-full", () => {
  it("stops gathering when all guaranteed drops are at storage cap", () => {
    // Bug regression: after snapshot refactor, the chance>=1 filter was lost,
    // so stop-if-full checked ALL drops including rare ones and never triggered.
    const action = getActionById("collect_driftwood")!;
    expect(action).toBeDefined();
    // collect_driftwood drops driftwood_branch (guaranteed, chance=1)
    expect(action.drops.length).toBeGreaterThan(0);
    expect(action.drops[0].resourceId).toBe("driftwood_branch");

    const state = makeState({
      stopWhenFull: true,
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

  it("does NOT stop when only rare drops are full but guaranteed drops are not", () => {
    // gather_coconuts: coconut (guaranteed), coconut_husk (chance=0.4)
    const action = getActionById("gather_coconuts")!;
    expect(action).toBeDefined();

    const state = makeState({
      stopWhenFull: true,
      currentAction: {
        actionId: "gather_coconuts",
        startedAt: 0,
        type: "gather",
      },
      discoveredBiomes: ["beach", "coconut_grove"],
      discoveredResources: ["coconut", "coconut_husk"],
    });

    // Fill coconut_husk (rare drop) to cap, but leave coconut (guaranteed) below cap
    const huskLimit = getStorageLimit(state, "coconut_husk");
    state.resources["coconut_husk"] = huskLimit;
    state.resources["coconut"] = 0;

    // Process enough time for several completions
    processTick(state, action.durationMs * 3);

    // Action should still be running because the guaranteed drop (coconut) isn't full
    expect(state.currentAction).not.toBeNull();
  });

  it("ignores resources that were already full when action started (fullAtStart)", () => {
    const action = getActionById("collect_driftwood")!;

    const state = makeState({
      stopWhenFull: true,
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
