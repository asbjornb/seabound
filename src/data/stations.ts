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
];
