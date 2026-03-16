import { ExpeditionDef } from "./types";

export const EXPEDITIONS: ExpeditionDef[] = [
  {
    id: "scout_island",
    name: "Scout the Island",
    description:
      "A short scouting trip along the shore and into the treeline. Costs 5 food per trip.",
    skillId: "navigation",
    durationMs: 8000,
    foodCost: 5,
    xpGain: 15,
    outcomes: [
      {
        weight: 25,
        description:
          "You follow a trail inland and discover a grove thick with coconut palms and lush undergrowth!",
        biomeDiscovery: "coconut_grove",
      },
      {
        weight: 10,
        description: "You push through the brush and discover a bamboo grove!",
        biomeDiscovery: "bamboo_grove",
        requiredBiomes: ["coconut_grove"],
      },
      {
        weight: 30,
        description:
          "You find some useful stones along a creek bed, but nothing remarkable.",
        drops: [
          { resourceId: "round_stone", amount: 2 },
          { resourceId: "flat_stone", amount: 1 },
        ],
      },
      {
        weight: 35,
        description:
          "The dense undergrowth turns you back. You return with nothing useful.",
      },
    ],
  },
];
