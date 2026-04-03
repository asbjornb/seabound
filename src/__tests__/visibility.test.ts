import { describe, it, expect } from "vitest";
import { selectAvailableActions, selectAvailableRecipes, selectAvailableExpeditions } from "../engine/selectors";
import type { GameState } from "../data/types";
import { makeState } from "./testHelpers";

describe("selectAvailableActions", () => {
  it("includes basic actions with no requirements", () => {
    const state = makeState();
    const actions = selectAvailableActions(state);
    // collect_driftwood has no biome/tool requirements
    expect(actions.some((a) => a.id === "collect_driftwood")).toBe(true);
  });

  it("excludes actions requiring undiscovered biomes", () => {
    const state = makeState({ discoveredBiomes: ["beach"] });
    const actions = selectAvailableActions(state);
    // gather_coconuts requires coconut_grove biome
    expect(actions.some((a) => a.id === "gather_coconuts")).toBe(false);
  });

  it("includes actions once biome is discovered", () => {
    const state = makeState({ discoveredBiomes: ["beach", "coconut_grove"] });
    const actions = selectAvailableActions(state);
    expect(actions.some((a) => a.id === "gather_coconuts")).toBe(true);
  });

  it("excludes actions requiring missing tools", () => {
    const state = makeState({ discoveredBiomes: ["beach", "coconut_grove"] });
    const actions = selectAvailableActions(state);
    // Actions requiring tools should be excluded when tools aren't owned
    const toolActions = actions.filter((a) => a.requiredTools && a.requiredTools.length > 0);
    for (const action of toolActions) {
      for (const toolId of action.requiredTools!) {
        expect(state.tools.includes(toolId)).toBe(true);
      }
    }
  });
});

describe("selectAvailableRecipes", () => {
  it("includes basic recipes with discoverable inputs", () => {
    const state = makeState({
      discoveredResources: ["coconut_husk"],
    });
    const recipes = selectAvailableRecipes(state);
    // shred_coconut_husk needs coconut_husk (discovered)
    expect(recipes.some((r) => r.id === "shred_coconut_husk")).toBe(true);
  });

  it("excludes recipes with undiscovered inputs", () => {
    const state = makeState({
      discoveredResources: [],
    });
    const recipes = selectAvailableRecipes(state);
    // shred_coconut_husk needs coconut_husk (not discovered)
    expect(recipes.some((r) => r.id === "shred_coconut_husk")).toBe(false);
  });

  it("hides building recipes once building is built (non-stackable)", () => {
    const state = makeState({
      buildings: ["camp_fire"],
      discoveredResources: ["driftwood_branch", "coconut_husk", "dry_grass"],
      tools: ["bow_drill_kit"],
    });
    const recipes = selectAvailableRecipes(state);
    // camp_fire recipe should be hidden since building exists
    expect(recipes.some((r) => r.buildingOutput === "camp_fire")).toBe(false);
  });

  it("hides oneTimeCraft recipes after output is obtained", () => {
    const state = makeState({
      discoveredResources: ["rough_fiber"],
      tools: ["bamboo_knife"], // already crafted
    });
    const recipes = selectAvailableRecipes(state);
    // craft_bamboo_knife is oneTimeCraft; should be hidden if tool is owned
    expect(recipes.some((r) => r.id === "craft_bamboo_knife")).toBe(false);
  });
});

describe("building upgrade chains hide base recipes", () => {
  function stateWithConstructionLevel(level: number, extra: Partial<GameState> = {}) {
    const base = makeState(extra);
    base.skills.construction = { level, xp: 0 };
    return base;
  }

  // Sleeping mat → Hammock → Thatched hut chain
  it("hides sleeping mat recipe when hammock is built", () => {
    const state = stateWithConstructionLevel(10, {
      buildings: ["hammock"],
      discoveredResources: ["palm_frond", "dry_grass"],
    });
    const recipes = selectAvailableRecipes(state);
    expect(recipes.some((r) => r.id === "build_sleeping_mat")).toBe(false);
  });

  it("hides sleeping mat recipe when thatched hut is built (two levels up)", () => {
    const state = stateWithConstructionLevel(15, {
      buildings: ["thatched_hut"],
      discoveredResources: ["palm_frond", "dry_grass"],
    });
    const recipes = selectAvailableRecipes(state);
    expect(recipes.some((r) => r.id === "build_sleeping_mat")).toBe(false);
  });

  it("hides hammock recipe when thatched hut is built", () => {
    const state = stateWithConstructionLevel(15, {
      buildings: ["thatched_hut"],
      discoveredResources: ["cordage", "dried_fiber", "driftwood_branch"],
    });
    const recipes = selectAvailableRecipes(state);
    expect(recipes.some((r) => r.id === "build_hammock")).toBe(false);
  });

  // Dugout → Outrigger canoe chain
  it("hides dugout recipe when outrigger canoe is built", () => {
    const state = stateWithConstructionLevel(10, {
      buildings: ["outrigger_canoe"],
      discoveredResources: ["shaped_hull", "cordage", "bamboo_cane"],
    });
    const recipes = selectAvailableRecipes(state);
    expect(recipes.some((r) => r.id === "build_dugout")).toBe(false);
  });

  // Verify base recipe still shows when no shelter is built yet
  it("still shows sleeping mat recipe when no shelter is built yet", () => {
    const state = stateWithConstructionLevel(10, {
      buildings: [],
      discoveredResources: ["palm_frond", "dry_grass"],
    });
    const recipes = selectAvailableRecipes(state);
    expect(recipes.some((r) => r.id === "build_sleeping_mat")).toBe(true);
  });
});

describe("selectAvailableExpeditions", () => {
  it("includes expeditions with no vessel requirement", () => {
    const state = makeState();
    const expeditions = selectAvailableExpeditions(state);
    // explore_beach requires no vessel
    expect(expeditions.some((e) => e.id === "explore_beach")).toBe(true);
  });

  it("excludes expeditions requiring vessels the player doesn't have", () => {
    const state = makeState();
    const expeditions = selectAvailableExpeditions(state);
    // coastal_sail requires a vessel (raft)
    const vesselExpeditions = expeditions.filter((e) => e.requiredVessel);
    for (const exp of vesselExpeditions) {
      // If it's available, the player must have the vessel
      expect(state.buildings.includes(exp.requiredVessel!)).toBe(true);
    }
  });
});
