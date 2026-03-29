import { describe, it, expect } from "vitest";
import {
  deductFood,
  deductWater,
  getTotalFood,
  getTotalWater,
  getMoraleDurationMultiplier,
  getEffectiveMoraleGain,
  addResource,
  getStorageLimit,
  BASE_STORAGE_LIMIT,
} from "../engine/gameState";
import { makeState } from "./testHelpers";

describe("deductFood", () => {
  it("returns null when not enough food", () => {
    const state = makeState();
    expect(deductFood(state, 5)).toBeNull();
  });

  it("deducts low-value food first", () => {
    const state = makeState({ resources: { coconut: 5, grilled_fish: 3 } });
    // coconut has foodValue=1, grilled_fish has foodValue=2
    // Requesting 3 food: should take 3 coconuts (3×1=3), not 1 grilled_fish + 1 coconut
    const taken = deductFood(state, 3);
    expect(taken).not.toBeNull();
    expect(taken!["coconut"]).toBe(3);
    expect(taken!["grilled_fish"]).toBeUndefined();
    expect(state.resources["coconut"]).toBe(2);
  });

  it("uses high-value food in second pass for remainder", () => {
    // If we have 0 low-value food and need 1 food, should use 1 high-value food
    const state = makeState({ resources: { cooked_fish: 2 } });
    // cooked_fish has foodValue=2. Need 1 food. First pass: floor(1/2)=0 taken.
    // Second pass: cooked_fish.value(2) >= remaining(1), take 1.
    const taken = deductFood(state, 1);
    expect(taken).not.toBeNull();
    expect(taken!["cooked_fish"]).toBe(1);
    expect(state.resources["cooked_fish"]).toBe(1);
  });

  it("combines low and high value food across passes", () => {
    const state = makeState({ resources: { coconut: 2, cooked_fish: 2 } });
    // Need 5 food. First pass: 2 coconuts (2×1=2), 1 cooked_fish (floor(3/2)=1, 1×2=2).
    // Remaining = 1. Second pass: cooked_fish.value(2) >= 1, take 1.
    const taken = deductFood(state, 5);
    expect(taken).not.toBeNull();
    expect(state.resources["coconut"]).toBe(0);
    expect(state.resources["cooked_fish"]).toBe(0);
  });

  it("does not mutate state when insufficient", () => {
    const state = makeState({ resources: { coconut: 1 } });
    const result = deductFood(state, 10);
    expect(result).toBeNull();
    // State unchanged because of early return
    expect(state.resources["coconut"]).toBe(1);
  });
});

describe("deductWater", () => {
  it("returns null when not enough water", () => {
    const state = makeState();
    expect(deductWater(state, 5)).toBeNull();
  });

  it("deducts water correctly", () => {
    const state = makeState({ resources: { fresh_water: 5 } });
    const taken = deductWater(state, 3);
    expect(taken).not.toBeNull();
    expect(taken!["fresh_water"]).toBe(3);
    expect(state.resources["fresh_water"]).toBe(2);
  });
});

describe("getTotalFood / getTotalWater", () => {
  it("sums food values correctly", () => {
    // coconut(1) × 3 + cooked_fish(2) × 2 = 7
    const state = makeState({ resources: { coconut: 3, cooked_fish: 2 } });
    expect(getTotalFood(state)).toBe(7);
  });

  it("returns 0 with no food resources", () => {
    const state = makeState({ resources: { driftwood_branch: 5 } });
    expect(getTotalFood(state)).toBe(0);
  });

  it("sums water values correctly", () => {
    const state = makeState({ resources: { fresh_water: 4 } });
    expect(getTotalWater(state)).toBe(4);
  });
});

describe("getMoraleDurationMultiplier", () => {
  it("returns 1.2 at morale 0 (20% slower)", () => {
    expect(getMoraleDurationMultiplier(0)).toBeCloseTo(1.2);
  });

  it("returns 1.0 at morale 50 (neutral)", () => {
    expect(getMoraleDurationMultiplier(50)).toBeCloseTo(1.0);
  });

  it("returns 0.8 at morale 100 (20% faster)", () => {
    expect(getMoraleDurationMultiplier(100)).toBeCloseTo(0.8);
  });

  it("goes below 0.8 for morale above 100", () => {
    expect(getMoraleDurationMultiplier(150)).toBeLessThan(0.8);
  });
});

describe("getEffectiveMoraleGain", () => {
  it("gives full effect below 100", () => {
    expect(getEffectiveMoraleGain(80, 10)).toBe(10);
  });

  it("halves effect above 100", () => {
    expect(getEffectiveMoraleGain(100, 10)).toBe(5);
  });

  it("splits between full and half when crossing 100", () => {
    // At 95, gain 10: 5 below cap (full), 5 above (halved = 2)
    expect(getEffectiveMoraleGain(95, 10)).toBe(7);
  });
});

describe("addResource", () => {
  it("adds resource up to storage limit", () => {
    const state = makeState();
    const added = addResource(state, "coconut", 5);
    expect(added).toBe(5);
    expect(state.resources["coconut"]).toBe(5);
  });

  it("clamps to storage limit", () => {
    const state = makeState();
    const limit = getStorageLimit(state, "coconut");
    const added = addResource(state, "coconut", limit + 50);
    expect(added).toBe(limit);
    expect(state.resources["coconut"]).toBe(limit);
  });

  it("returns 0 when already at cap", () => {
    const state = makeState();
    const limit = getStorageLimit(state, "coconut");
    state.resources["coconut"] = limit;
    const added = addResource(state, "coconut", 5);
    expect(added).toBe(0);
    expect(state.resources["coconut"]).toBe(limit);
  });
});

describe("getStorageLimit", () => {
  it("returns base limit with no buildings", () => {
    const state = makeState();
    expect(getStorageLimit(state, "driftwood_branch")).toBe(BASE_STORAGE_LIMIT);
  });

  it("applies building storage bonus for matching tag", () => {
    // camp_fire gives +10 to "food" tagged items
    const state = makeState({ buildings: ["camp_fire"] });
    const foodLimit = getStorageLimit(state, "coconut"); // tagged "food"
    const nonFoodLimit = getStorageLimit(state, "driftwood_branch"); // no food tag
    expect(foodLimit).toBe(BASE_STORAGE_LIMIT + 10);
    expect(nonFoodLimit).toBe(BASE_STORAGE_LIMIT);
  });

  it("applies untagged bonus to all resources", () => {
    // palm_leaf_pile gives +10 to ALL items (no tag filter)
    const state = makeState({ buildings: ["palm_leaf_pile"] });
    expect(getStorageLimit(state, "driftwood_branch")).toBe(BASE_STORAGE_LIMIT + 10);
    expect(getStorageLimit(state, "coconut")).toBe(BASE_STORAGE_LIMIT + 10);
  });

  it("stacks multiple building bonuses", () => {
    // camp_fire (+10 food) + palm_leaf_pile (+10 all)
    const state = makeState({ buildings: ["camp_fire", "palm_leaf_pile"] });
    const foodLimit = getStorageLimit(state, "coconut");
    expect(foodLimit).toBe(BASE_STORAGE_LIMIT + 10 + 10);
  });

  it("respects excludeTags", () => {
    // woven_basket gives +1 but excludes "food" and "large" tags
    const state = makeState({ buildings: ["woven_basket"] });
    const foodLimit = getStorageLimit(state, "coconut"); // food tag → excluded
    const largeLimit = getStorageLimit(state, "driftwood_branch"); // large tag → excluded
    const normalLimit = getStorageLimit(state, "flat_stone"); // no food/large tag → gets bonus
    expect(foodLimit).toBe(BASE_STORAGE_LIMIT);
    expect(largeLimit).toBe(BASE_STORAGE_LIMIT);
    expect(normalLimit).toBe(BASE_STORAGE_LIMIT + 1);
  });
});
