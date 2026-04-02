import { describe, it, expect } from "vitest";
import { resourceHasUse } from "../engine/selectors";
import { makeState } from "./testHelpers";

describe("resourceHasUse", () => {
  it("considers food resources useful even if no recipe consumes them", () => {
    // Bug regression: coconut (foodValue=1) was filtered out because
    // resourceHasUse only checked recipe inputs, not food/water status.
    const state = makeState();
    expect(resourceHasUse("coconut", state)).toBe(true);
  });

  it("considers water resources useful even if no recipe consumes them", () => {
    const state = makeState();
    // fresh_water has waterValue
    expect(resourceHasUse("fresh_water", state)).toBe(true);
  });

  it("returns true for resources used as recipe inputs", () => {
    const state = makeState();
    // driftwood_branch is used in multiple recipes
    expect(resourceHasUse("driftwood_branch", state)).toBe(true);
  });

  it("considers station setup input resources useful", () => {
    // Bug regression: wild_seed, taro_corm, banana_shoot, breadfruit_cutting
    // are consumed by station setupInputs, not recipes. resourceHasUse must
    // check stations too, otherwise these drops get filtered out of actions.
    const state = makeState();
    expect(resourceHasUse("wild_seed", state)).toBe(true);
    expect(resourceHasUse("taro_corm", state)).toBe(true);
    expect(resourceHasUse("banana_shoot", state)).toBe(true);
    expect(resourceHasUse("breadfruit_cutting", state)).toBe(true);
  });

  it("considers resources used as recipe requiredItems useful", () => {
    // Bug regression: stone_flake is a requiredItem for gorge_hook recipe,
    // but resourceHasUse only checked recipe inputs, not requiredItems.
    // This caused chert to appear useless (via transitive output_no_use),
    // hiding the Comb Rocky Shores action and locking players out of the
    // gorge hook progression chain.
    const state = makeState();
    expect(resourceHasUse("stone_flake", state)).toBe(true);
  });

  it("returns false for resources with no use and no food/water value", () => {
    const state = makeState();
    // A made-up resource that doesn't exist shouldn't have use
    expect(resourceHasUse("totally_fake_resource_xyz", state)).toBe(false);
  });
});
