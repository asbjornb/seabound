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
    durationMs: 3000,
    drops: [{ resourceId: "driftwood_branch", amount: 1 }],
    xpGain: 5,
  },
  {
    id: "collect_beach_stone",
    name: "Collect Beach Stone",
    description: "Search the beach for useful stones.",
    skillId: "foraging",
    durationMs: 3000,
    drops: [
      { resourceId: "flat_stone", amount: 1, chance: 0.25 },
    ],
    requiredSkillLevel: 2,
    xpGain: 5,
  },
  {
    id: "collect_palm_frond",
    name: "Collect Palm Frond",
    description: "Gather fallen palm fronds from the coconut grove floor.",
    skillId: "foraging",
    durationMs: 3000,
    drops: [{ resourceId: "palm_frond", amount: 2 }],
    requiredBiome: "coconut_grove",
    xpGain: 5,
  },
  {
    id: "collect_dry_tinder",
    name: "Collect Dry Tinder",
    description: "Shred coconut husk and gather dry grass for fire-starting.",
    skillId: "foraging",
    durationMs: 4000,
    drops: [
      { resourceId: "coconut_husk_fiber", amount: 1 },
      { resourceId: "dry_grass", amount: 1 },
    ],
    requiredSkillLevel: 3,
    xpGain: 8,
  },

  // Fishing
  {
    id: "wade_tidal_pool",
    name: "Wade Tidal Pool",
    description: "Wade into shallow pools to catch small fish and crabs.",
    skillId: "fishing",
    durationMs: 4000,
    drops: [
      { resourceId: "small_fish", amount: 1, chance: 0.1 },
      { resourceId: "crab", amount: 1, chance: 0.1 },
      { resourceId: "shell", amount: 1 },
    ],
    xpGain: 8,
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
    durationMs: 4000,
    drops: [{ resourceId: "bamboo_cane", amount: 1 }],
    requiredBiome: "bamboo_grove",
    xpGain: 8,
  },
  // Fishing (spear tier)
  {
    id: "spear_fish",
    name: "Spear Fish",
    description: "Use your bamboo spear to catch larger fish.",
    skillId: "fishing",
    durationMs: 5000,
    drops: [
      { resourceId: "small_fish", amount: 1 },
      { resourceId: "shell", amount: 1, chance: 0.3 },
    ],
    requiredTools: ["bamboo_spear"],
    xpGain: 12,
  },
];
