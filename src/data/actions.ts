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
    requiredSkillLevel: 5,
    xpGain: 12,
  },

  // Fishing (spear tier)
  {
    id: "spear_fish",
    name: "Spear Fish",
    description: "Use your bamboo spear to reliably catch fish.",
    skillId: "fishing",
    panel: "gather",
    durationMs: 5000,
    drops: [
      { resourceId: "small_fish", amount: 1 },
      { resourceId: "large_fish", amount: 1, chance: 0 },
      { resourceId: "shell", amount: 1, chance: 0.3 },
    ],
    requiredTools: ["bamboo_spear"],
    xpGain: 12,
  },

  // Fishing (drop line tier)
  {
    id: "drop_line_fish",
    name: "Drop Line Fishing",
    description:
      "Lower a baited gorge hook into deeper water. Slower, but catches bigger fish.",
    skillId: "fishing",
    panel: "gather",
    durationMs: 8000,
    drops: [
      { resourceId: "small_fish", amount: 1 },
      { resourceId: "large_fish", amount: 1, chance: 0.25 },
      { resourceId: "shell", amount: 1, chance: 0.2 },
    ],
    requiredSkillLevel: 8,
    requiredTools: ["gorge_hook"],
    xpGain: 18,
  },

  // Basket trap moved to stations system (set-wait-collect)
];
