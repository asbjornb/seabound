import { ActionDef } from "./types";

export const ACTIONS: ActionDef[] = [
  // ═══════════════════════════════════════
  // PHASE 0 — Bare Hands (Beach biome, always available)
  // ═══════════════════════════════════════

  // Foraging
  {
    id: "gather_coconuts",
    name: "Gather Fallen Coconuts",
    description: "Pick up coconuts from beneath the palm trees in the grove.",
    skillId: "foraging",
    panel: "gather",
    durationMs: 3000,
    drops: [
      { resourceId: "coconut", amount: 1 },
      { resourceId: "coconut_husk", amount: 1, chance: 0.4 },
    ],
    requiredBiome: "coconut_grove",
    xpGain: 5,
  },
  {
    id: "collect_driftwood",
    name: "Collect Driftwood",
    description: "Gather sun-bleached branches washed up on the shore.",
    skillId: "foraging",
    panel: "gather",
    durationMs: 3000,
    drops: [
      { resourceId: "driftwood_branch", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1, chance: 0 },
    ],
    xpGain: 5,
  },
  {
    id: "comb_rocky_shore",
    name: "Comb Rocky Shore",
    description: "Search the rocky shoreline for useful stones and chert nodules.",
    skillId: "foraging",
    panel: "gather",
    durationMs: 4000,
    drops: [
      { resourceId: "flat_stone", amount: 1, chance: 0.2 },
      { resourceId: "chert", amount: 1, chance: 0.15 },
    ],
    requiredBiome: "rocky_shore",
    xpGain: 8,
  },
  {
    id: "collect_palm_frond",
    name: "Collect Palm Frond",
    description: "Gather fallen palm fronds from the coconut grove floor.",
    skillId: "foraging",
    panel: "gather",
    durationMs: 3000,
    drops: [{ resourceId: "palm_frond", amount: 2 }],
    requiredBiome: "coconut_grove",
    xpGain: 5,
  },
  {
    id: "collect_dry_grass",
    name: "Collect Dry Grass",
    description: "Gather tough, sun-dried grass from the rocky shoreline.",
    skillId: "foraging",
    panel: "gather",
    durationMs: 4000,
    drops: [
      { resourceId: "dry_grass", amount: 1 },
      { resourceId: "wild_seed", amount: 1, chance: 0 },
    ],
    requiredBiome: "rocky_shore",
    xpGain: 8,
  },

  // Fishing
  {
    id: "wade_tidal_pool",
    name: "Wade Tidal Pool",
    description: "Wade into shallow pools to catch small fish and crabs.",
    skillId: "fishing",
    panel: "gather",
    durationMs: 4000,
    drops: [
      { resourceId: "small_fish", amount: 1, chance: 0.1 },
      { resourceId: "crab", amount: 1, chance: 0.1 },
      { resourceId: "shell", amount: 1 },
      { resourceId: "large_shell", amount: 1, chance: 0.01 },
    ],
    xpGain: 8,
    hideWhen: [{ type: "has_biome", biomeId: "rocky_shore" }],
  },
  {
    id: "comb_rock_pools",
    name: "Comb Rock Pools",
    description:
      "Pick through the deeper rocky pools — better spots for crabs to hide.",
    skillId: "fishing",
    panel: "gather",
    durationMs: 4000,
    drops: [
      { resourceId: "small_fish", amount: 1, chance: 0.15 },
      { resourceId: "crab", amount: 1, chance: 0.35 },
      { resourceId: "shell", amount: 1 },
      { resourceId: "large_shell", amount: 1, chance: 0.01 },
    ],
    requiredBiome: "rocky_shore",
    xpGain: 8,
  },

  // Construction
  {
    id: "dig_drainage_trench",
    name: "Dig Drainage Trench",
    description:
      "Use a large shell to dig channels around camp. Hard labor, but good practice.",
    skillId: "construction",
    panel: "build",
    durationMs: 30000,
    drops: [],
    requiredResources: ["large_shell"],
    xpGain: 10,
  },

  // ═══════════════════════════════════════
  // PHASE 1 — Bamboo Tier (requires bamboo_grove biome)
  // ═══════════════════════════════════════

  // Woodworking
  {
    id: "harvest_bamboo",
    name: "Harvest Bamboo Cane",
    description: "Cut bamboo canes from the grove.",
    skillId: "woodworking",
    panel: "gather",
    durationMs: 4000,
    drops: [{ resourceId: "bamboo_cane", amount: 1 }],
    requiredBiome: "bamboo_grove",
    xpGain: 8,
  },
  // Woodworking — Tree Felling
  {
    id: "fell_large_tree",
    name: "Fell Large Tree",
    description:
      "Chop down a large jungle tree with the stone axe. Exhausting work.",
    skillId: "woodworking",
    panel: "gather",
    durationMs: 15000,
    drops: [{ resourceId: "large_log", amount: 1 }],
    requiredBiome: "jungle_interior",
    requiredTools: ["stone_axe"],
    xpGain: 30,
  },

  // Water collection moved to recipe "fill_water_pot" (requires well building)

  // ═══════════════════════════════════════
  // PHASE 2 — Clay Tier (requires jungle_interior biome)
  // ═══════════════════════════════════════

  {
    id: "dig_clay",
    name: "Dig Clay",
    description: "Dig clay from the riverbank deposits in the jungle interior.",
    skillId: "foraging",
    panel: "gather",
    durationMs: 5000,
    drops: [{ resourceId: "clay", amount: 1 }],
    requiredBiome: "jungle_interior",
    xpGain: 12,
  },

  // Fishing (spear tier)
  {
    id: "spear_fish",
    name: "Spear Fish",
    description:
      "Wade the shallows with your bamboo spear — quick strikes on fish, crabs, and shells.",
    skillId: "fishing",
    panel: "gather",
    durationMs: 5000,
    drops: [
      { resourceId: "small_fish", amount: 1 },
      { resourceId: "crab", amount: 1, chance: 0.3 },
      { resourceId: "shell", amount: 1, chance: 0.25 },
      { resourceId: "large_fish", amount: 1, chance: 0.05 },
    ],
    requiredTools: ["bamboo_spear"],
    xpGain: 12,
  },

  // Fishing (drop line tier)
  {
    id: "drop_line_fish",
    name: "Drop Line Fishing",
    description:
      "Lower a baited gorge hook into deep water. Slower, but targets bigger fish.",
    skillId: "fishing",
    panel: "gather",
    durationMs: 8000,
    drops: [
      { resourceId: "small_fish", amount: 1 },
      { resourceId: "large_fish", amount: 1, chance: 0.5 },
      { resourceId: "large_shell", amount: 1, chance: 0.08 },
    ],
    requiredTools: ["gorge_hook"],
    xpGain: 18,
  },

  // Basket trap moved to stations system (set-wait-collect)

  // ═══════════════════════════════════════
  // MAINLAND — Mining
  // ═══════════════════════════════════════
  {
    id: "prospect_copper",
    name: "Prospect Copper Vein",
    description: "Chip away at exposed green-streaked rock to extract copper ore.",
    skillId: "mining",
    panel: "gather",
    durationMs: 16000,
    drops: [
      { resourceId: "copper_ore", amount: 1 },
      { resourceId: "native_copper", amount: 1, chance: 0.15 },
    ],
    requiredBiome: "coastal_cliffs",
    xpGain: 15,
  },
  {
    id: "prospect_tin",
    name: "Prospect Tin Deposit",
    description: "Search riverbeds and cliff faces for dark cassiterite pebbles.",
    skillId: "mining",
    panel: "gather",
    durationMs: 20000,
    drops: [
      { resourceId: "tin_ore", amount: 1 },
      { resourceId: "flat_stone", amount: 1, chance: 0.1 },
    ],
    requiredBiome: "coastal_cliffs",
    requiredSkillLevel: 5,
    xpGain: 22,
  },
  {
    id: "mine_iron",
    name: "Mine Iron Ore",
    description: "Dig into red-earth hillside deposits to pry out heavy iron ore.",
    skillId: "mining",
    panel: "gather",
    durationMs: 24000,
    drops: [
      { resourceId: "iron_ore", amount: 1 },
      { resourceId: "flat_stone", amount: 1, chance: 0.15 },
    ],
    requiredBiome: "inland_hills",
    requiredSkillLevel: 10,
    xpGain: 35,
  },
];
