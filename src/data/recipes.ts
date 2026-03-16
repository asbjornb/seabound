import { RecipeDef } from "./types";

export const RECIPES: RecipeDef[] = [
  // ═══════════════════════════════════════
  // PHASE 1 — Bamboo Tier: First Tools
  // ═══════════════════════════════════════
  {
    id: "split_bamboo_cane",
    name: "Split Bamboo Cane",
    description: "Split a bamboo cane into sharp splinters.",
    skillId: "woodworking",
    inputs: [{ resourceId: "bamboo_cane", amount: 1 }],
    output: { resourceId: "bamboo_splinter", amount: 2 },
    durationMs: 3000,
    requiredSkillLevel: 1,
    xpGain: 8,
  },
  {
    id: "craft_bamboo_knife",
    name: "Bamboo Knife",
    description:
      "Bind a bamboo splinter into a cutting blade. Unlocks new gathering.",
    skillId: "crafting",
    inputs: [
      { resourceId: "bamboo_splinter", amount: 1 },
      { resourceId: "vine", amount: 2 },
    ],
    output: { resourceId: "bamboo_knife", amount: 1 },
    durationMs: 4000,
    requiredSkillLevel: 2,
    oneTimeCraft: true,
    xpGain: 12,
  },
  {
    id: "craft_shell_scraper",
    name: "Shell Scraper",
    description: "Bind a shell to a flat stone for scraping bark.",
    skillId: "crafting",
    inputs: [
      { resourceId: "flat_stone", amount: 1 },
      { resourceId: "shell", amount: 1 },
    ],
    output: { resourceId: "shell_scraper", amount: 1 },
    durationMs: 3000,
    requiredSkillLevel: 1,
    oneTimeCraft: true,
    xpGain: 8,
  },

  // ═══════════════════════════════════════
  // Fiber & Cordage Chain
  // ═══════════════════════════════════════
  {
    id: "dry_fiber",
    name: "Dry Fiber",
    description: "Lay rough fibers out to dry in the sun.",
    skillId: "preservation",
    inputs: [{ resourceId: "rough_fiber", amount: 2 }],
    output: { resourceId: "dried_fiber", amount: 2 },
    durationMs: 5000,
    xpGain: 10,
  },
  {
    id: "twist_cordage",
    name: "Twist Cordage",
    description: "Twist dried fibers into strong cordage.",
    skillId: "crafting",
    inputs: [{ resourceId: "dried_fiber", amount: 2 }],
    output: { resourceId: "cordage", amount: 1 },
    durationMs: 4000,
    xpGain: 10,
  },

  // ═══════════════════════════════════════
  // PHASE 1b — Fire Chain
  // ═══════════════════════════════════════
  {
    id: "craft_bow_drill",
    name: "Bow Drill Kit",
    description: "Assemble a friction fire-starting kit.",
    skillId: "crafting",
    inputs: [
      { resourceId: "bamboo_cane", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1 },
      { resourceId: "cordage", amount: 1 },
      { resourceId: "flat_stone", amount: 1 },
    ],
    output: { resourceId: "bow_drill_kit", amount: 1 },
    durationMs: 6000,
    requiredSkillLevel: 2,
    oneTimeCraft: true,
    xpGain: 15,
  },

  // ═══════════════════════════════════════
  // Settlement Building Recipes
  // ═══════════════════════════════════════
  {
    id: "build_camp_fire",
    name: "Light Camp Fire",
    description:
      "Use the bow drill kit with tinder to start a fire. A permanent settlement building.",
    skillId: "crafting",
    inputs: [
      { resourceId: "bow_drill_kit", amount: 1 },
      { resourceId: "coconut_husk_fiber", amount: 2 },
      { resourceId: "dry_grass", amount: 2 },
      { resourceId: "driftwood_branch", amount: 3 },
    ],
    output: { resourceId: "bow_drill_kit", amount: 0 }, // placeholder, buildingOutput takes precedence
    buildingOutput: "camp_fire",
    durationMs: 8000,
    requiredSkillLevel: 2,
    xpGain: 20,
  },
  {
    id: "build_palm_leaf_pile",
    name: "Palm Leaf Pile",
    description:
      "Heap palm fronds together to keep materials off the wet sand.",
    skillId: "construction",
    inputs: [
      { resourceId: "palm_frond", amount: 8 },
      { resourceId: "driftwood_branch", amount: 2 },
    ],
    output: { resourceId: "palm_frond", amount: 0 }, // placeholder
    buildingOutput: "palm_leaf_pile",
    durationMs: 5000,
    xpGain: 15,
  },
  {
    id: "build_drying_rack",
    name: "Drying Rack",
    description:
      "Build a bamboo frame for drying fiber, fish, and hides in the sun.",
    skillId: "crafting",
    inputs: [
      { resourceId: "bamboo_cane", amount: 4 },
      { resourceId: "cordage", amount: 3 },
    ],
    output: { resourceId: "bamboo_cane", amount: 0 }, // placeholder
    buildingOutput: "drying_rack",
    durationMs: 8000,
    requiredSkillLevel: 5,
    xpGain: 25,
  },

  // ═══════════════════════════════════════
  // Fire-dependent recipes (require camp_fire building)
  // ═══════════════════════════════════════
  {
    id: "craft_bamboo_spear",
    name: "Bamboo Spear",
    description: "Fire-harden a bamboo tip into a spear. Requires camp fire.",
    skillId: "crafting",
    inputs: [{ resourceId: "bamboo_cane", amount: 2 }],
    output: { resourceId: "bamboo_spear", amount: 1 },
    requiredBuildings: ["camp_fire"],
    durationMs: 5000,
    oneTimeCraft: true,
    xpGain: 12,
  },
  {
    id: "craft_digging_stick",
    name: "Digging Stick",
    description:
      "Fire-harden a bamboo point for digging. Requires camp fire.",
    skillId: "crafting",
    inputs: [{ resourceId: "bamboo_cane", amount: 1 }],
    output: { resourceId: "digging_stick", amount: 1 },
    requiredBuildings: ["camp_fire"],
    durationMs: 4000,
    oneTimeCraft: true,
    xpGain: 10,
  },

  // ═══════════════════════════════════════
  // Cooking (requires camp_fire building)
  // ═══════════════════════════════════════
  {
    id: "cook_fish",
    name: "Cook Fish",
    description: "Grill fish over the campfire.",
    skillId: "crafting",
    inputs: [{ resourceId: "small_fish", amount: 1 }],
    output: { resourceId: "cooked_fish", amount: 1 },
    requiredBuildings: ["camp_fire"],
    durationMs: 3000,
    xpGain: 5,
  },
  {
    id: "cook_crab",
    name: "Cook Crab",
    description: "Roast crab over the fire.",
    skillId: "crafting",
    inputs: [{ resourceId: "crab", amount: 1 }],
    output: { resourceId: "cooked_crab", amount: 1 },
    requiredBuildings: ["camp_fire"],
    durationMs: 3000,
    xpGain: 5,
  },
];
