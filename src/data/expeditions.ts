import { ExpeditionDef } from "./types";

export const EXPEDITIONS: ExpeditionDef[] = [
  {
    id: "explore_beach",
    name: "Explore Along the Beach",
    description:
      "Follow the shoreline and nearby treeline looking for useful areas. Costs 5 food per trip.",
    skillId: "navigation",
    durationMs: 8000,
    foodCost: 5,
    xpGain: 15,
    hideWhenAllFound: true,
    outcomes: [
      {
        weight: 25,
        description:
          "You follow a trail inland and discover a grove thick with coconut palms and lush undergrowth!",
        biomeDiscovery: "coconut_grove",
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
        weight: 45,
        description:
          "The dense undergrowth turns you back. You return with nothing useful.",
      },
    ],
  },
  {
    id: "explore_interior",
    name: "Explore Island Interior",
    description:
      "Push deeper into the island interior, following animal trails and streams. Costs 8 food per trip.",
    skillId: "navigation",
    durationMs: 12000,
    foodCost: 8,
    xpGain: 25,
    requiredBiomes: ["coconut_grove"],
    hideWhenAllFound: true,
    outcomes: [
      {
        weight: 15,
        description: "You push through the brush and discover a bamboo grove!",
        biomeDiscovery: "bamboo_grove",
      },
      {
        weight: 3,
        description:
          "You follow a creek upstream and find a riverbank thick with clay deposits deep in the jungle interior!",
        biomeDiscovery: "jungle_interior",
      },
      {
        weight: 25,
        description:
          "You find some useful materials deeper in the brush.",
        drops: [
          { resourceId: "bamboo_cane", amount: 2 },
          { resourceId: "dry_grass", amount: 1 },
        ],
      },
      {
        weight: 20,
        description:
          "You discover a small clearing with useful stones and shells scattered about.",
        drops: [
          { resourceId: "flat_stone", amount: 2 },
          { resourceId: "large_shell", amount: 1, chance: 0.5 },
        ],
      },
      {
        weight: 37,
        description:
          "The jungle is thick and disorienting. You circle back to camp with nothing to show for it.",
      },
    ],
  },
];
