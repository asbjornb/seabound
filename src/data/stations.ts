import { StationDef } from "./types";

export const STATIONS: StationDef[] = [
  {
    id: "deploy_basket_trap",
    name: "Basket Trap",
    description:
      "Submerge your basket trap in the shallows and wait for fish to swim in.",
    skillId: "fishing",
    durationMs: 120000, // 2 minutes
    requiredTool: "basket_trap",
    requiredSkillLevel: 10,
    yields: [
      { resourceId: "small_fish", amount: 2 },
      { resourceId: "large_fish", amount: 1, chance: 0.2 },
      { resourceId: "crab", amount: 1, chance: 0.35 },
      { resourceId: "shell", amount: 1, chance: 0.25 },
    ],
    xpGain: 30,
  },

  // ═══════════════════════════════════════
  // Farming Stations
  // ═══════════════════════════════════════
  {
    id: "plant_wild_seeds",
    name: "Plant Wild Seeds",
    description:
      "Sow wild seeds in a cleared plot and wait for whatever grows.",
    skillId: "farming",
    durationMs: 180000, // 3 minutes
    requiredTool: "digging_stick",
    setupInputs: [{ resourceId: "wild_seed", amount: 3 }],
    yields: [
      { resourceId: "rough_fiber", amount: 2 },
      { resourceId: "wild_seed", amount: 1, chance: 0.35 },
      { resourceId: "root_vegetable", amount: 1, chance: 0.25 },
    ],
    xpGain: 15,
    maxDeployedPerBuildings: ["cleared_plot", "tended_garden", "farm_plot"],
  },
  {
    id: "cultivate_taro",
    name: "Cultivate Taro",
    description:
      "Plant a taro corm in watered soil and wait for it to mature.",
    skillId: "farming",
    durationMs: 300000, // 5 minutes
    requiredTool: "digging_stick",
    requiredSkillLevel: 5,
    requiredBuildings: ["well"],
    setupInputs: [{ resourceId: "taro_corm", amount: 1 }],
    yields: [
      { resourceId: "taro_root", amount: 2 },
      { resourceId: "taro_corm", amount: 1, chance: 0.6 },
      { resourceId: "taro_corm", amount: 1, chance: 0.15 },
    ],
    xpGain: 25,
    maxDeployedPerBuildings: ["tended_garden", "farm_plot"],
  },
  {
    id: "grow_bananas",
    name: "Grow Bananas",
    description:
      "Plant a banana shoot in rich soil and wait for a bunch to ripen.",
    skillId: "farming",
    durationMs: 480000, // 8 minutes
    requiredTool: "digging_stick",
    requiredSkillLevel: 10,
    requiredBuildings: ["well"],
    setupInputs: [{ resourceId: "banana_shoot", amount: 1 }],
    yields: [
      { resourceId: "banana", amount: 4 },
      { resourceId: "banana_shoot", amount: 1, chance: 0.7 },
    ],
    xpGain: 35,
    maxDeployedPerBuildings: ["farm_plot"],
  },
  {
    id: "grow_breadfruit",
    name: "Grow Breadfruit",
    description:
      "Plant a breadfruit cutting in rich soil. Slow to grow, but bountiful.",
    skillId: "farming",
    durationMs: 600000, // 10 minutes
    requiredTool: "digging_stick",
    requiredSkillLevel: 12,
    requiredBuildings: ["well"],
    setupInputs: [{ resourceId: "breadfruit_cutting", amount: 1 }],
    yields: [
      { resourceId: "breadfruit", amount: 5 },
      { resourceId: "breadfruit_cutting", amount: 1, chance: 0.5 },
    ],
    xpGain: 45,
    maxDeployedPerBuildings: ["farm_plot"],
  },
];
