import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import type { GameState } from "../data/types";
import { getActionById, getRecipeById, getExpeditionById } from "../data/registry";
import { processTick } from "../engine/tick";
import { selectAvailableActions, selectAvailableRecipes, selectAvailableExpeditions } from "../engine/selectors";
import { xpForLevel } from "../data/skills";
import { makeState } from "./testHelpers";

/**
 * Critical Path Simulation: Beach → Dugout
 *
 * A scripted play-through of the entire progression from a fresh beach start
 * to assembling a dugout canoe. Tests that every step in the critical path
 * is completable — actions produce the right outputs, recipes consume the
 * right inputs, tools/buildings are granted, biomes are discovered, and
 * prerequisites gate correctly.
 *
 * Math.random is mocked to 0.001 so all chance-based drops succeed and
 * expeditions consistently discover the first available biome.
 */
describe("Critical Path: Beach → Dugout", () => {
  let state: GameState;
  let mockRandom: MockInstance;

  beforeEach(() => {
    state = makeState();
    state.morale = 50; // multiplier = 1.0 for predictable timing
    mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.001);
  });

  afterEach(() => {
    mockRandom.mockRestore();
  });

  // ── Helpers ──────────────────────────────────────────────────────

  /** Run a gather action once and return completions. */
  function gather(actionId: string) {
    const def = getActionById(actionId);
    expect(def, `action ${actionId} should exist`).toBeDefined();
    state.currentAction = {
      type: "gather",
      actionId,
      startedAt: state.lastTickAt,
    };
    state.repetitiveActionCount = 0;
    const result = processTick(state, state.lastTickAt + Math.ceil(def!.durationMs * 1.5));
    expect(result.completions.length, `${actionId} should complete`).toBeGreaterThanOrEqual(1);
    return result;
  }

  /** Run a craft recipe once and return completions. */
  function craft(recipeId: string) {
    const def = getRecipeById(recipeId);
    expect(def, `recipe ${recipeId} should exist`).toBeDefined();
    state.currentAction = {
      type: "craft",
      actionId: recipeId,
      recipeId,
      startedAt: state.lastTickAt,
    };
    state.repetitiveActionCount = 0;
    const result = processTick(state, state.lastTickAt + Math.ceil(def!.durationMs * 1.5));
    expect(result.completions.length, `${recipeId} should complete`).toBeGreaterThanOrEqual(1);
    return result;
  }

  /** Run an expedition once and return completions. */
  function expedition(expeditionId: string) {
    const def = getExpeditionById(expeditionId);
    expect(def, `expedition ${expeditionId} should exist`).toBeDefined();
    state.currentAction = {
      type: "expedition",
      actionId: expeditionId,
      expeditionId,
      startedAt: state.lastTickAt,
    };
    state.repetitiveActionCount = 0;
    const result = processTick(state, state.lastTickAt + Math.ceil(def!.durationMs * 1.5));
    expect(result.completions.length, `${expeditionId} should complete`).toBeGreaterThanOrEqual(1);
    return result;
  }

  /** Set a skill to a specific level (shortcut past grinding). */
  function setSkill(skillId: string, level: number) {
    state.skills[skillId] = { level, xp: xpForLevel(level) };
  }

  /** Grant resources directly (adds to inventory and discoveredResources). */
  function grant(resources: Record<string, number>) {
    for (const [id, amount] of Object.entries(resources)) {
      state.resources[id] = (state.resources[id] ?? 0) + amount;
      if (!state.discoveredResources.includes(id)) {
        state.discoveredResources.push(id);
      }
    }
  }

  /** Assert an action is currently available via selectors. */
  function assertActionAvailable(actionId: string) {
    const available = selectAvailableActions(state);
    expect(
      available.some((a) => a.id === actionId),
      `action ${actionId} should be available`,
    ).toBe(true);
  }

  /** Assert a recipe is currently available via selectors. */
  function assertRecipeAvailable(recipeId: string) {
    const available = selectAvailableRecipes(state);
    expect(
      available.some((r) => r.id === recipeId),
      `recipe ${recipeId} should be available`,
    ).toBe(true);
  }

  /** Assert an expedition is currently available via selectors. */
  function assertExpeditionAvailable(expeditionId: string) {
    const available = selectAvailableExpeditions(state);
    expect(
      available.some((e) => e.id === expeditionId),
      `expedition ${expeditionId} should be available`,
    ).toBe(true);
  }

  // ── Test ─────────────────────────────────────────────────────────

  it("completes the full beach-to-dugout progression", () => {
    // ═══ PHASE 0: Beach Start ═══
    expect(state.discoveredBiomes).toContain("beach");
    expect(state.discoveredBiomes).toHaveLength(1);

    // Collect driftwood (always available on beach)
    assertActionAvailable("collect_driftwood");
    gather("collect_driftwood");
    expect(state.resources.driftwood_branch).toBeGreaterThan(0);

    // Wade tidal pool — shells, small fish, crab
    assertActionAvailable("wade_tidal_pool");
    gather("wade_tidal_pool");
    expect(state.resources.shell).toBeGreaterThan(0);
    expect(state.resources.small_fish).toBeGreaterThan(0);

    // Explore beach → discover coconut_grove
    grant({ small_fish: 10 }); // food for expedition
    assertExpeditionAvailable("explore_beach");
    expedition("explore_beach");
    expect(state.discoveredBiomes).toContain("coconut_grove");

    // Explore beach again → discover rocky_shore
    grant({ small_fish: 10 });
    expedition("explore_beach");
    expect(state.discoveredBiomes).toContain("rocky_shore");

    // ═══ PHASE 1: Gather from New Biomes ═══

    assertActionAvailable("gather_coconuts");
    gather("gather_coconuts");
    expect(state.resources.coconut).toBeGreaterThan(0);
    expect(state.resources.coconut_husk).toBeGreaterThan(0);

    assertActionAvailable("collect_palm_frond");
    gather("collect_palm_frond");
    expect(state.resources.palm_frond).toBeGreaterThan(0);

    assertActionAvailable("comb_rocky_shore");
    gather("comb_rocky_shore");
    expect(state.resources.flat_stone).toBeGreaterThan(0);
    expect(state.resources.chert).toBeGreaterThan(0);

    assertActionAvailable("collect_dry_grass");
    gather("collect_dry_grass");
    expect(state.resources.dry_grass).toBeGreaterThan(0);

    // Shred coconut husk → rough fiber
    grant({ coconut_husk: 5 });
    assertRecipeAvailable("shred_coconut_husk");
    craft("shred_coconut_husk");
    expect(state.resources.rough_fiber).toBeGreaterThan(0);

    // ═══ PHASE 2: Explore Interior ═══

    // Explore interior → discover bamboo_grove
    grant({ coconut: 10 }); // food
    assertExpeditionAvailable("explore_interior");
    expedition("explore_interior");
    expect(state.discoveredBiomes).toContain("bamboo_grove");

    // Explore interior again → discover jungle_interior
    grant({ coconut: 10 });
    expedition("explore_interior");
    expect(state.discoveredBiomes).toContain("jungle_interior");

    // ═══ PHASE 3: Bamboo Tier — First Tools ═══

    assertActionAvailable("harvest_bamboo");
    gather("harvest_bamboo");
    expect(state.resources.bamboo_cane).toBeGreaterThan(0);

    // Split bamboo → splinters
    grant({ bamboo_cane: 5 });
    assertRecipeAvailable("split_bamboo_cane");
    craft("split_bamboo_cane");
    expect(state.resources.bamboo_splinter).toBeGreaterThan(0);

    // Craft bamboo knife
    grant({ bamboo_splinter: 3 });
    assertRecipeAvailable("craft_bamboo_knife");
    craft("craft_bamboo_knife");
    expect(state.tools).toContain("bamboo_knife");

    // ═══ PHASE 4: Infrastructure ═══

    // Build drying rack (bamboo + palm frond)
    grant({ bamboo_cane: 10, palm_frond: 10 });
    assertRecipeAvailable("build_drying_rack");
    craft("build_drying_rack");
    expect(state.buildings).toContain("drying_rack");

    // Dry fiber → dried fiber
    grant({ rough_fiber: 10 });
    assertRecipeAvailable("dry_fiber");
    craft("dry_fiber");
    expect(state.resources.dried_fiber).toBeGreaterThan(0);

    // Twist cordage → cordage
    grant({ dried_fiber: 10 });
    assertRecipeAvailable("twist_cordage");
    craft("twist_cordage");
    expect(state.resources.cordage).toBeGreaterThan(0);

    // ═══ PHASE 5: Stone Tools ═══

    // Craft hammerstone
    grant({ flat_stone: 10 });
    assertRecipeAvailable("craft_hammerstone");
    craft("craft_hammerstone");
    expect(state.tools).toContain("hammerstone");

    // Strike stone flake
    grant({ chert: 5 });
    assertRecipeAvailable("strike_stone_flake");
    craft("strike_stone_flake");
    expect(state.resources.stone_flake).toBeGreaterThan(0);

    // Knap stone blade
    grant({ stone_flake: 5 });
    assertRecipeAvailable("knap_stone_blade");
    craft("knap_stone_blade");
    expect(state.resources.stone_blade).toBeGreaterThan(0);

    // ═══ PHASE 6: Fire ═══

    // Craft bow drill kit
    grant({ bamboo_cane: 5, driftwood_branch: 5, cordage: 5, flat_stone: 5 });
    assertRecipeAvailable("craft_bow_drill");
    craft("craft_bow_drill");
    expect(state.tools).toContain("bow_drill_kit");

    // Build camp fire
    grant({ coconut_husk: 5, dry_grass: 5, driftwood_branch: 10 });
    assertRecipeAvailable("build_camp_fire");
    craft("build_camp_fire");
    expect(state.buildings).toContain("camp_fire");

    // ═══ PHASE 7: Fire-dependent Tools & Cooking ═══

    // Craft bamboo spear (needs bamboo_knife + camp_fire)
    grant({ bamboo_cane: 5 });
    assertRecipeAvailable("craft_bamboo_spear");
    craft("craft_bamboo_spear");
    expect(state.tools).toContain("bamboo_spear");

    // Cook fish (needs camp_fire)
    setSkill("cooking", 2);
    grant({ small_fish: 5, driftwood_branch: 10, dry_grass: 5, crab: 5 });
    assertRecipeAvailable("cook_fish");
    craft("cook_fish");
    expect(state.resources.cooked_fish).toBeGreaterThan(0);

    // Cook crab (needs cooking 2)
    assertRecipeAvailable("cook_crab");
    craft("cook_crab");
    expect(state.resources.cooked_crab).toBeGreaterThan(0);

    // Craft stone axe
    grant({ stone_blade: 5, driftwood_branch: 10, cordage: 10 });
    assertRecipeAvailable("craft_stone_axe");
    craft("craft_stone_axe");
    expect(state.tools).toContain("stone_axe");

    // ═══ PHASE 8: Maritime — Raft ═══

    setSkill("construction", 5);
    grant({ driftwood_branch: 10, cordage: 10, bamboo_cane: 10 });
    assertRecipeAvailable("build_raft");
    craft("build_raft");
    expect(state.buildings).toContain("raft");

    // Sail to nearby island → discover nearby_island
    grant({ cooked_fish: 10 });
    assertExpeditionAvailable("sail_nearby_island");
    expedition("sail_nearby_island");
    expect(state.discoveredBiomes).toContain("nearby_island");

    // Sail again → get obsidian
    grant({ cooked_fish: 10 });
    expedition("sail_nearby_island");
    expect(state.resources.obsidian).toBeGreaterThan(0);

    // ═══ PHASE 9: Advanced Tools ═══

    // Knap obsidian blade
    grant({ obsidian: 5, flat_stone: 5 });
    assertRecipeAvailable("knap_obsidian_blade");
    craft("knap_obsidian_blade");
    expect(state.tools).toContain("obsidian_blade");

    // Craft gorge hook (crafting 6, needs stone_flake as requiredItem)
    setSkill("crafting", 6);
    grant({ shell: 5, cordage: 5, stone_flake: 5 });
    assertRecipeAvailable("craft_gorge_hook");
    craft("craft_gorge_hook");
    expect(state.tools).toContain("gorge_hook");

    // Craft basket trap (weaving 5, fishing 8, needs obsidian_blade)
    setSkill("weaving", 5);
    setSkill("fishing", 8);
    grant({ bamboo_splinter: 10, cordage: 10 });
    assertRecipeAvailable("craft_basket_trap");
    craft("craft_basket_trap");
    expect(state.tools).toContain("basket_trap");

    // Build fiber loom (weaving 4 — already at 5)
    grant({ bamboo_cane: 10, cordage: 10, palm_frond: 10 });
    assertRecipeAvailable("build_fiber_loom");
    craft("build_fiber_loom");
    expect(state.buildings).toContain("fiber_loom");

    // Braid cordage (requires fiber_loom, replaces twist_cordage)
    grant({ dried_fiber: 10 });
    assertRecipeAvailable("braid_cordage");
    craft("braid_cordage");
    expect(state.resources.cordage).toBeGreaterThan(0);

    // Craft shell adze
    grant({ large_shell: 5, cordage: 5, driftwood_branch: 5 });
    assertRecipeAvailable("craft_shell_adze");
    craft("craft_shell_adze");
    expect(state.tools).toContain("shell_adze");

    // ═══ PHASE 10: Clay & Pottery ═══

    setSkill("foraging", 5);
    assertActionAvailable("dig_clay");
    gather("dig_clay");
    expect(state.resources.clay).toBeGreaterThan(0);

    // Build firing pit
    grant({ flat_stone: 10, driftwood_branch: 10, clay: 10 });
    assertRecipeAvailable("build_firing_pit");
    craft("build_firing_pit");
    expect(state.buildings).toContain("firing_pit");

    // Shape clay pot
    grant({ clay: 10 });
    assertRecipeAvailable("shape_clay_pot");
    craft("shape_clay_pot");
    expect(state.resources.shaped_clay_pot).toBeGreaterThan(0);

    // Fire clay pot (requires firing_pit)
    grant({ driftwood_branch: 10 });
    assertRecipeAvailable("fire_clay_pot");
    craft("fire_clay_pot");
    expect(state.resources.fired_clay_pot).toBeGreaterThan(0);

    // Craft digging stick (requires camp_fire + bamboo_cane + driftwood_branch)
    grant({ bamboo_cane: 2, driftwood_branch: 2 });
    assertRecipeAvailable("craft_digging_stick");
    craft("craft_digging_stick");
    expect(state.tools).toContain("digging_stick");

    // Build well (construction 6, flat_stone + clay + cordage, digging_stick)
    setSkill("construction", 6);
    grant({ flat_stone: 6, clay: 4, cordage: 3 });
    assertRecipeAvailable("build_well");
    craft("build_well");
    expect(state.buildings).toContain("well");

    // Fill water pot at the well (consumes fired_clay_pot → fresh_water)
    grant({ fired_clay_pot: 1 });
    assertRecipeAvailable("fill_water_pot");
    craft("fill_water_pot");
    expect(state.resources.fresh_water).toBeGreaterThan(0);

    // ═══ PHASE 11: Dugout Canoe ═══

    // Fell large tree (woodworking 10, jungle_interior, stone_axe)
    setSkill("woodworking", 10);
    assertActionAvailable("fell_large_tree");
    gather("fell_large_tree");
    expect(state.resources.large_log).toBeGreaterThan(0);

    // Char log interior (camp_fire + large_log + dry_grass + coconut_husk + driftwood)
    grant({ dry_grass: 10, coconut_husk: 10, driftwood_branch: 10 });
    assertRecipeAvailable("char_log_interior");
    craft("char_log_interior");
    expect(state.resources.charred_log).toBe(1);

    // Scrape hull (shell_adze + charred_log)
    assertRecipeAvailable("scrape_hull");
    craft("scrape_hull");
    expect(state.resources.shaped_hull).toBe(1);
    expect(state.resources.charred_log).toBe(0); // consumed

    // Assemble dugout canoe
    grant({ cordage: 10, bamboo_cane: 10 });
    assertRecipeAvailable("assemble_dugout");
    craft("assemble_dugout");

    // ═══ VICTORY ═══
    expect(state.buildings).toContain("dugout");
    expect(state.resources.shaped_hull).toBe(0); // consumed
  });

  it("verifies prerequisite gating blocks premature access", () => {
    // Coconut gathering requires coconut_grove biome
    const actions = selectAvailableActions(state);
    expect(actions.some((a) => a.id === "gather_coconuts")).toBe(false);

    // Bamboo harvesting requires bamboo_grove biome
    expect(actions.some((a) => a.id === "harvest_bamboo")).toBe(false);

    // Fell large tree requires woodworking 10 + jungle_interior + stone_axe
    expect(actions.some((a) => a.id === "fell_large_tree")).toBe(false);

    // Craft bamboo spear requires bamboo_knife tool + camp_fire building
    grant({ bamboo_cane: 5 });
    const recipes = selectAvailableRecipes(state);
    expect(recipes.some((r) => r.id === "craft_bamboo_spear")).toBe(false);

    // Sail to nearby island requires a vessel (raft or dugout)
    const expeditions = selectAvailableExpeditions(state);
    expect(expeditions.some((e) => e.id === "sail_nearby_island")).toBe(false);

  });

  it("verifies dugout voyage is available after building dugout", () => {
    // Fast-forward: grant dugout and required biomes
    state.buildings.push("dugout");
    state.discoveredBiomes.push("coconut_grove", "rocky_shore", "bamboo_grove", "jungle_interior");

    assertExpeditionAvailable("dugout_voyage");

    // Run a dugout voyage — needs food + water
    grant({ cooked_fish: 10, fresh_water: 10 });
    const result = expedition("dugout_voyage");
    expect(result.completions).toHaveLength(1);
    expect(result.completions[0].skillId).toBe("navigation");
  });
});
