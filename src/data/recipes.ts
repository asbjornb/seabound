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
    xpGain: 8,
  },

  // ═══════════════════════════════════════
  // Fiber & Cordage Chain
  // ═══════════════════════════════════════
  {
    id: "roll_fiber",
    name: "Roll Rough Cordage",
    description: "Roll rough fibers together into crude rope.",
    skillId: "crafting",
    inputs: [{ resourceId: "rough_fiber", amount: 3 }],
    output: { resourceId: "rough_cordage", amount: 1 },
    durationMs: 3000,
    xpGain: 8,
  },
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
      { resourceId: "rough_cordage", amount: 1 },
      { resourceId: "flat_stone", amount: 1 },
    ],
    output: { resourceId: "bow_drill_kit", amount: 1 },
    durationMs: 6000,
    requiredSkillLevel: 2,
    xpGain: 15,
  },
  {
    id: "craft_bamboo_spear",
    name: "Bamboo Spear",
    description:
      "Fire-harden a bamboo tip into a spear. Requires bow drill kit (fire).",
    skillId: "crafting",
    inputs: [{ resourceId: "bamboo_cane", amount: 2 }],
    output: { resourceId: "bamboo_spear", amount: 1 },
    requiredItems: ["bow_drill_kit"],
    durationMs: 5000,
    xpGain: 12,
  },
  {
    id: "craft_digging_stick",
    name: "Digging Stick",
    description:
      "Fire-harden a bamboo point for digging. Requires bow drill kit (fire).",
    skillId: "crafting",
    inputs: [{ resourceId: "bamboo_cane", amount: 1 }],
    output: { resourceId: "digging_stick", amount: 1 },
    requiredItems: ["bow_drill_kit"],
    durationMs: 4000,
    xpGain: 10,
  },

  // ═══════════════════════════════════════
  // Cooking (requires bow_drill_kit / fire)
  // ═══════════════════════════════════════
  {
    id: "cook_fish",
    name: "Cook Fish",
    description: "Grill fish over the campfire.",
    skillId: "crafting",
    inputs: [{ resourceId: "small_fish", amount: 1 }],
    output: { resourceId: "cooked_fish", amount: 1 },
    requiredItems: ["bow_drill_kit"],
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
    requiredItems: ["bow_drill_kit"],
    durationMs: 3000,
    xpGain: 5,
  },
];
