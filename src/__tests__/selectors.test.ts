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

  it("returns false for resources with no use and no food/water value", () => {
    const state = makeState();
    // A made-up resource that doesn't exist shouldn't have use
    expect(resourceHasUse("totally_fake_resource_xyz", state)).toBe(false);
  });
});
