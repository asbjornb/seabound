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
          { resourceId: "flat_stone", amount: 2 },
        ],
      },
      {
        weight: 35,
        description:
          "The dense undergrowth turns you back. You return with nothing useful.",
      },
    ],
  },
  {
    id: "venture_inland",
    name: "Venture Inland",
    description:
      "Push deeper into the island interior, following animal trails and streams. Costs 8 food per trip.",
    skillId: "navigation",
    durationMs: 12000,
    foodCost: 8,
    xpGain: 25,
    outcomes: [
      {
        weight: 3,
        description:
          "You follow a creek upstream and find a riverbank thick with clay deposits deep in the jungle interior!",
        biomeDiscovery: "jungle_interior",
        requiredBiomes: ["coconut_grove"],
      },
      {
        weight: 30,
        description:
          "You find some useful materials deeper in the brush.",
        drops: [
          { resourceId: "bamboo_cane", amount: 2 },
          { resourceId: "dry_grass", amount: 1 },
        ],
      },
      {
        weight: 25,
        description:
          "You discover a small clearing with useful stones and shells scattered about.",
        drops: [
          { resourceId: "flat_stone", amount: 2 },
          { resourceId: "large_shell", amount: 1, chance: 0.5 },
        ],
      },
      {
        weight: 42,
        description:
          "The jungle is thick and disorienting. You circle back to camp with nothing to show for it.",
      },
    ],
  },
];
