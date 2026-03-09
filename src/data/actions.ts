import { ActionDef } from "./types";

export const ACTIONS: ActionDef[] = [
  // Woodcutting
  {
    id: "gather_sticks",
    name: "Gather Sticks",
    description: "Pick up fallen sticks from the forest floor.",
    skillId: "woodcutting",
    durationMs: 3000,
    drops: [{ resourceId: "sticks", amount: 2 }],
    xpGain: 5,
  },
  {
    id: "strip_bark",
    name: "Strip Bark",
    description: "Peel bark from fallen logs.",
    skillId: "woodcutting",
    durationMs: 4000,
    drops: [
      { resourceId: "bark", amount: 1 },
      { resourceId: "sticks", amount: 1, chance: 0.3 },
    ],
    xpGain: 8,
  },
  {
    id: "chop_wood",
    name: "Chop Wood",
    description: "Fell a tree and split it into logs. Requires an axe.",
    skillId: "woodcutting",
    durationMs: 6000,
    drops: [
      { resourceId: "wood", amount: 1 },
      { resourceId: "sticks", amount: 1, chance: 0.5 },
    ],
    requiredTools: ["stone_axe"],
    requiredSkillLevel: 3,
    xpGain: 20,
  },

  // Mining
  {
    id: "knap_flint",
    name: "Knap Flint",
    description: "Strike stones together to produce sharp flint flakes.",
    skillId: "mining",
    durationMs: 4000,
    drops: [
      { resourceId: "flint", amount: 1 },
      { resourceId: "stone", amount: 1, chance: 0.5 },
    ],
    xpGain: 8,
  },
  {
    id: "collect_stones",
    name: "Collect Stones",
    description: "Gather loose stones from the ground.",
    skillId: "mining",
    durationMs: 3000,
    drops: [
      { resourceId: "stone", amount: 2 },
      { resourceId: "flint", amount: 1, chance: 0.15 },
    ],
    xpGain: 5,
  },
  {
    id: "mine_stone",
    name: "Mine Stone",
    description: "Break chunks from a rock face. Requires a pickaxe.",
    skillId: "mining",
    durationMs: 6000,
    drops: [
      { resourceId: "stone", amount: 3 },
      { resourceId: "flint", amount: 1, chance: 0.3 },
      { resourceId: "clay", amount: 1, chance: 0.2 },
    ],
    requiredTools: ["stone_pickaxe"],
    requiredSkillLevel: 3,
    xpGain: 20,
  },

  // Foraging
  {
    id: "gather_fiber",
    name: "Gather Fiber",
    description: "Pull tough fibers from wild plants.",
    skillId: "foraging",
    durationMs: 3000,
    drops: [{ resourceId: "fiber", amount: 2 }],
    xpGain: 5,
  },
  {
    id: "pick_berries",
    name: "Pick Berries",
    description: "Search bushes for ripe berries.",
    skillId: "foraging",
    durationMs: 4000,
    drops: [
      { resourceId: "berries", amount: 2 },
      { resourceId: "fiber", amount: 1, chance: 0.3 },
    ],
    xpGain: 8,
  },
  {
    id: "hunt_mushrooms",
    name: "Hunt Mushrooms",
    description: "Search damp areas for edible mushrooms.",
    skillId: "foraging",
    durationMs: 5000,
    drops: [{ resourceId: "mushrooms", amount: 1 }],
    requiredSkillLevel: 2,
    xpGain: 12,
  },
  {
    id: "dig_clay",
    name: "Dig Clay",
    description: "Dig soft clay from the riverbank.",
    skillId: "foraging",
    durationMs: 5000,
    drops: [{ resourceId: "clay", amount: 2 }],
    requiredSkillLevel: 3,
    xpGain: 15,
  },
];
