import { ExpeditionDef } from "./types";

export const EXPEDITIONS: ExpeditionDef[] = [
  {
    id: "scout_island",
    name: "Scout the Island",
    description:
      "A short scouting trip along the shore and into the treeline. No supplies needed.",
    durationMs: 8000,
    outcomes: [
      {
        weight: 35,
        description: "You push through the brush and discover a bamboo grove!",
        biomeDiscovery: "bamboo_grove",
      },
      {
        weight: 25,
        description:
          "You find some useful stones along a creek bed, but nothing remarkable.",
        drops: [
          { resourceId: "round_stone", amount: 2 },
          { resourceId: "flat_stone", amount: 1 },
        ],
      },
      {
        weight: 20,
        description: "You spot some vines tangled in the canopy and gather a few.",
        drops: [
          { resourceId: "vine", amount: 3 },
          { resourceId: "palm_frond", amount: 2 },
        ],
      },
      {
        weight: 20,
        description:
          "The dense undergrowth turns you back. You return with nothing useful.",
      },
    ],
  },
];
