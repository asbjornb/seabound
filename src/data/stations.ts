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
    yields: [
      { resourceId: "small_fish", amount: 2 },
      { resourceId: "large_fish", amount: 1, chance: 0.2 },
      { resourceId: "crab", amount: 1, chance: 0.35 },
      { resourceId: "shell", amount: 1, chance: 0.25 },
    ],
    xpGain: 30,
  },
  {
    id: "harvest_tidal_weir",
    name: "Tidal Weir",
    description:
      "Check the stone weir at low tide and collect whatever swam in.",
    skillId: "fishing",
    durationMs: 480000, // 8 minutes
    requiredBuildings: ["stone_tidal_weir"],
    yields: [
      { resourceId: "small_fish", amount: 5 },
      { resourceId: "large_fish", amount: 2, chance: 0.6 },
      { resourceId: "crab", amount: 2, chance: 0.5 },
      { resourceId: "shell", amount: 1, chance: 0.4 },
    ],
    xpGain: 60,
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
    xpGain: 20,
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
    requiredSkillLevel: 3,
    requiredBuildings: ["well"],
    setupInputs: [{ resourceId: "taro_corm", amount: 1 }],
    yields: [
      { resourceId: "taro_root", amount: 2 },
      { resourceId: "taro_corm", amount: 1, chance: 0.6 },
      { resourceId: "taro_corm", amount: 1, chance: 0.15 },
    ],
    xpGain: 35,
    maxDeployedPerBuildings: ["cleared_plot", "tended_garden", "farm_plot"],
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
    xpGain: 45,
    maxDeployedPerBuildings: ["farm_plot"],
  },
  {
    id: "grow_pandanus",
    name: "Grow Pandanus",
    description:
      "Plant a pandanus cutting in any plot. A perennial crop — it regrows after each harvest.",
    skillId: "farming",
    durationMs: 480000, // 8 minutes
    requiredTool: "digging_stick",
    setupInputs: [{ resourceId: "pandanus_cutting", amount: 1 }],
    yields: [
      { resourceId: "pandanus_leaves", amount: 5 },
      { resourceId: "pandanus_cutting", amount: 1 }, // perennial — always returns cutting
    ],
    xpGain: 45,
    maxDeployedPerBuildings: ["cleared_plot", "tended_garden", "farm_plot"],
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
    xpGain: 55,
    maxDeployedPerBuildings: ["farm_plot"],
  },

  // ═══════════════════════════════════════
  // Charcoal Kiln
  // ═══════════════════════════════════════
  {
    id: "burn_charcoal",
    name: "Burn Charcoal",
    description:
      "Seal large logs in the kiln and slow-burn them into charcoal. An ancient technique — the first industrial fuel.",
    skillId: "cooking",
    durationMs: 600000, // 10 minutes
    requiredBuildings: ["charcoal_kiln"],
    setupInputs: [{ resourceId: "large_log", amount: 3 }],
    yields: [
      { resourceId: "charcoal", amount: 15 },
    ],
    xpGain: 50,
  },

  // ═══════════════════════════════════════
  // Soaking Pit (Pandanus Retting)
  // ═══════════════════════════════════════
  {
    id: "soak_pandanus",
    name: "Soak Pandanus",
    description:
      "Submerge pandanus leaves in the soaking pit. Water breaks down the fibers over time — no active work needed.",
    skillId: "weaving",
    durationMs: 300000, // 5 minutes
    setupInputs: [{ resourceId: "pandanus_leaves", amount: 10 }],
    yields: [
      { resourceId: "retted_pandanus", amount: 10 },
    ],
    xpGain: 40,
    maxDeployedPerBuildings: ["soaking_pit"],
  },

  // ═══════════════════════════════════════
  // Pandanus Grove (Phase 2 — auto-regrow)
  // ═══════════════════════════════════════
  {
    id: "harvest_pandanus_grove",
    name: "Harvest Pandanus Grove",
    description:
      "Harvest leaves from an established pandanus grove. The plants regrow on their own.",
    skillId: "farming",
    durationMs: 360000, // 6 minutes (faster than farm plot)
    yields: [
      { resourceId: "pandanus_leaves", amount: 7 }, // higher output than farm
    ],
    xpGain: 50,
    requiredBuildings: ["pandanus_grove"],
  },
];
