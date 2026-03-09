import { RecipeDef } from "./types";

export const RECIPES: RecipeDef[] = [
  // Basic crafting
  {
    id: "craft_stone_knife",
    name: "Stone Knife",
    description: "Knap a sharp flint blade and bind it to a handle.",
    skillId: "crafting",
    inputs: [
      { resourceId: "flint", amount: 2 },
      { resourceId: "sticks", amount: 1 },
    ],
    output: { resourceId: "stone_knife", amount: 1 },
    durationMs: 5000,
    xpGain: 15,
  },
  {
    id: "craft_stone_axe",
    name: "Stone Axe",
    description: "Lash a stone head to a wooden handle.",
    skillId: "crafting",
    inputs: [
      { resourceId: "stone", amount: 2 },
      { resourceId: "sticks", amount: 2 },
      { resourceId: "fiber", amount: 3 },
    ],
    output: { resourceId: "stone_axe", amount: 1 },
    durationMs: 8000,
    requiredSkillLevel: 2,
    xpGain: 25,
  },
  {
    id: "craft_stone_pickaxe",
    name: "Stone Pickaxe",
    description: "Fashion a pointed stone into a mining tool.",
    skillId: "crafting",
    inputs: [
      { resourceId: "stone", amount: 2 },
      { resourceId: "flint", amount: 1 },
      { resourceId: "sticks", amount: 2 },
      { resourceId: "fiber", amount: 3 },
    ],
    output: { resourceId: "stone_pickaxe", amount: 1 },
    durationMs: 8000,
    requiredSkillLevel: 2,
    xpGain: 25,
  },
  {
    id: "craft_rope",
    name: "Rope",
    description: "Twist dried fibers into strong rope.",
    skillId: "crafting",
    inputs: [{ resourceId: "dried_fiber", amount: 3 }],
    output: { resourceId: "rope", amount: 1 },
    durationMs: 5000,
    requiredSkillLevel: 2,
    xpGain: 15,
  },
  {
    id: "dry_fiber",
    name: "Dry Fiber",
    description: "Lay plant fibers out to dry in the sun.",
    skillId: "crafting",
    inputs: [{ resourceId: "fiber", amount: 3 }],
    output: { resourceId: "dried_fiber", amount: 2 },
    durationMs: 4000,
    xpGain: 10,
  },

  // Firemaking
  {
    id: "build_campfire",
    name: "Build Campfire",
    description:
      "Arrange wood and kindling into a campfire. The heart of your settlement.",
    skillId: "firemaking",
    inputs: [
      { resourceId: "wood", amount: 3 },
      { resourceId: "sticks", amount: 5 },
      { resourceId: "bark", amount: 2 },
    ],
    output: { resourceId: "campfire", amount: 1 },
    durationMs: 10000,
    xpGain: 30,
  },

  // Clay work
  {
    id: "craft_clay_pot",
    name: "Clay Pot",
    description: "Shape and fire a clay pot. Requires a campfire.",
    skillId: "crafting",
    inputs: [{ resourceId: "clay", amount: 4 }],
    output: { resourceId: "clay_pot", amount: 1 },
    durationMs: 8000,
    requiredSkillLevel: 3,
    xpGain: 25,
  },

  // Shelter
  {
    id: "build_shelter",
    name: "Wooden Shelter",
    description: "Construct a rough shelter from logs, sticks, and rope.",
    skillId: "crafting",
    inputs: [
      { resourceId: "wood", amount: 5 },
      { resourceId: "sticks", amount: 8 },
      { resourceId: "rope", amount: 2 },
      { resourceId: "bark", amount: 4 },
    ],
    output: { resourceId: "wooden_shelter", amount: 1 },
    durationMs: 15000,
    requiredSkillLevel: 4,
    xpGain: 50,
  },
];
