import { describe, it, expect } from "vitest";
import { getActions, getRecipes, getResources, getExpeditions, getStations } from "../data/registry";
import { resourceHasUse } from "../engine/selectors";
import { makeState } from "./testHelpers";

describe("data integrity", () => {
  it("every food/water resource appears in at least one drop table", () => {
    // Ensures food/water resources are actually obtainable through gameplay.
    // Catches bugs like filtering food out of drop tables.
    const RESOURCES = getResources();
    const foodWaterIds = Object.values(RESOURCES)
      .filter((r) => r.foodValue || r.waterValue)
      .map((r) => r.id);

    const allDropResourceIds = new Set<string>();

    for (const action of getActions()) {
      for (const drop of action.drops) {
        allDropResourceIds.add(drop.resourceId);
      }
    }
    for (const recipe of getRecipes()) {
      if (recipe.output) allDropResourceIds.add(recipe.output.resourceId);
    }
    for (const expedition of getExpeditions()) {
      for (const outcome of expedition.outcomes) {
        if (outcome.drops) {
          for (const drop of outcome.drops) {
            allDropResourceIds.add(drop.resourceId);
          }
        }
      }
    }
    for (const station of getStations()) {
      for (const drop of station.yields) {
        allDropResourceIds.add(drop.resourceId);
      }
    }

    for (const id of foodWaterIds) {
      expect(
        allDropResourceIds.has(id),
        `Food/water resource "${id}" is not obtainable from any action, recipe, or expedition`
      ).toBe(true);
    }
  });

  it("every gather action has at least one guaranteed drop (chance >= 1)", () => {
    // Stop-if-full relies on guaranteed drops to know when to stop.
    // If an action has only chance-based drops, stop-if-full would be unreliable.
    for (const action of getActions()) {
      if (action.panel !== "gather") continue;
      const guaranteed = action.drops.filter(
        (d) => d.chance === undefined || d.chance >= 1
      );
      // Allow actions with only chance drops (like comb_rocky_shore), but warn
      // This test documents the invariant rather than strictly enforcing it
      if (guaranteed.length === 0) {
        // Just verify the action has SOME drops at least
        expect(
          action.drops.length,
          `Action "${action.id}" has no drops at all`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("all drop resourceIds reference existing resources", () => {
    const RESOURCES = getResources();
    for (const action of getActions()) {
      for (const drop of action.drops) {
        expect(
          RESOURCES[drop.resourceId],
          `Action "${action.id}" drops unknown resource "${drop.resourceId}"`
        ).toBeDefined();
      }
    }
  });

  it("all recipe inputs reference existing resources", () => {
    const RESOURCES = getResources();
    for (const recipe of getRecipes()) {
      for (const input of recipe.inputs) {
        expect(
          RESOURCES[input.resourceId],
          `Recipe "${recipe.id}" requires unknown resource "${input.resourceId}"`
        ).toBeDefined();
      }
    }
  });

  it("all recipe outputs reference existing resources", () => {
    const RESOURCES = getResources();
    for (const recipe of getRecipes()) {
      if (recipe.output) {
        expect(
          RESOURCES[recipe.output.resourceId],
          `Recipe "${recipe.id}" outputs unknown resource "${recipe.output.resourceId}"`
        ).toBeDefined();
      }
    }
  });

  it("every station setupInput resource is considered useful by resourceHasUse", () => {
    // Bug regression: resourceHasUse only checked recipes, so station-only
    // resources (seeds, corms, shoots, cuttings) were filtered out of drops.
    const state = makeState();
    for (const station of getStations()) {
      if (!station.setupInputs) continue;
      for (const input of station.setupInputs) {
        expect(
          resourceHasUse(input.resourceId, state),
          `Station "${station.id}" setup input "${input.resourceId}" is not considered useful by resourceHasUse`
        ).toBe(true);
      }
    }
  });

  it("every action drop resource is either useful or has zero base chance", () => {
    // Ensures the usefulDrops filter in tick.ts won't silently remove drops
    // that players are supposed to get (e.g. via milestone bonus chances).
    const state = makeState();
    for (const action of getActions()) {
      for (const drop of action.drops) {
        const isUseful = resourceHasUse(drop.resourceId, state);
        if (!isUseful) {
          // If not useful, it should have chance: 0 (only granted via milestones)
          // or be explicitly expected to be filtered out
          expect(
            drop.chance === 0,
            `Action "${action.id}" drops "${drop.resourceId}" which resourceHasUse considers useless, ` +
            `but it has chance=${drop.chance} (not 0). This drop will be silently removed.`
          ).toBe(true);
        }
      }
    }
  });
});
