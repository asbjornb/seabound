import { ExpeditionDef } from "./types";

export const EXPEDITIONS: ExpeditionDef[] = [
  {
    id: "explore_beach",
    name: "Explore Along the Beach",
    description:
      "Follow the shoreline and nearby treeline looking for useful areas. Costs 4 food per trip.",
    skillId: "navigation",
    durationMs: 8000,
    foodCost: 4,
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
        weight: 20,
        description:
          "You round the headland and discover a rocky stretch of shoreline — flat stones and tough grass everywhere!",
        biomeDiscovery: "rocky_shore",
      },
      {
        weight: 25,
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
    id: "explore_interior",
    name: "Explore Island Interior",
    description:
      "Push deeper into the island interior, following animal trails and streams. Costs 6 food per trip.",
    skillId: "navigation",
    durationMs: 12000,
    foodCost: 6,
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
  {
    id: "sail_nearby_island",
    name: "Sail to Nearby Island",
    description:
      "Paddle your raft across the channel to a volcanic island visible on the horizon. Costs 7 food per trip.",
    skillId: "navigation",
    durationMs: 16000,
    foodCost: 7,
    xpGain: 35,
    requiredVessel: "raft",
    outcomes: [
      {
        weight: 10,
        description:
          "You beach the raft on black volcanic sand and discover a cove rich with obsidian outcrops!",
        biomeDiscovery: "nearby_island",
      },
      {
        weight: 25,
        description:
          "You scour the volcanic slopes and find chunks of glassy obsidian among the rocks.",
        requiredBiomes: ["nearby_island"],
        drops: [{ resourceId: "obsidian", amount: 2 }],
      },
      {
        weight: 15,
        description:
          "You find a smaller obsidian deposit near the tide line.",
        requiredBiomes: ["nearby_island"],
        drops: [{ resourceId: "obsidian", amount: 1 }],
      },
      {
        weight: 15,
        description:
          "You discover wild seed pods growing in the volcanic soil.",
        requiredBiomes: ["nearby_island"],
        drops: [{ resourceId: "wild_seed", amount: 2 }],
      },
      {
        weight: 12,
        description:
          "You find taro growing wild along a stream bank and dig up cuttings.",
        requiredBiomes: ["nearby_island"],
        drops: [{ resourceId: "taro_corm", amount: 2 }],
      },
      {
        weight: 10,
        description:
          "You find useful flat stones of a different composition on the island shore.",
        drops: [{ resourceId: "flat_stone", amount: 3 }],
      },
      {
        weight: 25,
        description:
          "Rough seas slow the crossing. You arrive exhausted and return with nothing useful.",
      },
    ],
  },
  {
    id: "dugout_voyage",
    name: "Sail to Far Island",
    description:
      "Paddle your dugout canoe beyond the near-shore waters. Who knows what you'll find? Costs 10 food and 3 water per trip.",
    skillId: "navigation",
    durationMs: 20000,
    foodCost: 10,
    waterCost: 3,
    xpGain: 50,
    requiredVessel: "dugout",
    outcomes: [
      {
        weight: 10,
        description:
          "You paddle past a volcanic island and discover a cove rich with obsidian outcrops!",
        biomeDiscovery: "nearby_island",
        drops: [
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
        ],
      },
      {
        weight: 20,
        description:
          "You land on a lush islet and find banana plants growing wild. You carefully dig up a shoot.",
        drops: [
          { resourceId: "banana_shoot", amount: 1 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
        ],
      },
      {
        weight: 12,
        description:
          "You discover a breadfruit grove on a distant island and take root cuttings.",
        drops: [
          { resourceId: "breadfruit_cutting", amount: 1 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
        ],
      },
      {
        weight: 10,
        description:
          "You find pandanus plants growing wild along the shore of a far island. You take a cutting.",
        drops: [
          { resourceId: "pandanus_cutting", amount: 1 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
        ],
      },
      {
        weight: 15,
        description:
          "You find obsidian outcrops on a distant volcanic shore.",
        drops: [
          { resourceId: "obsidian", amount: 3 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
        ],
      },
      {
        weight: 20,
        description:
          "You beach on a wooded island and gather materials.",
        drops: [
          { resourceId: "bamboo_cane", amount: 3 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
        ],
      },
      {
        weight: 15,
        description:
          "You watch the sunset from a pristine beach. The world feels vast and full of possibility.",
        drops: [
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
        ],
      },
      {
        weight: 18,
        description:
          "Strong currents push you off course. You return tired but safe.",
        drops: [
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
        ],
      },
    ],
  },
  {
    id: "oceanic_voyage",
    name: "Oceanic Voyage",
    description:
      "Set sail across the open ocean. There is no turning back.",
    skillId: "navigation",
    durationMs: 30000,
    waterCost: 10,
    xpGain: 100,
    inputs: [{ resourceId: "voyage_provisions", amount: 10 }],
    requiredVessel: "outrigger_canoe",
    victory: true,
    outcomes: [
      {
        weight: 100,
        description:
          "The sail catches the trade winds and the outrigger cuts through the swells. Days blur into nights. On the third morning, a dark line of land rises from the horizon — not your island, but a new shore. Smoke drifts from a village above the beach. You've made it. You're no longer a castaway.",
        drops: [
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "fired_clay_pot", amount: 1, chance: 0.85 },
          { resourceId: "sealed_clay_jar", amount: 1, chance: 0.85 },
          { resourceId: "sealed_clay_jar", amount: 1, chance: 0.85 },
          { resourceId: "sealed_clay_jar", amount: 1, chance: 0.85 },
          { resourceId: "sealed_clay_jar", amount: 1, chance: 0.85 },
          { resourceId: "sealed_clay_jar", amount: 1, chance: 0.85 },
          { resourceId: "sealed_clay_jar", amount: 1, chance: 0.85 },
          { resourceId: "sealed_clay_jar", amount: 1, chance: 0.85 },
          { resourceId: "sealed_clay_jar", amount: 1, chance: 0.85 },
          { resourceId: "sealed_clay_jar", amount: 1, chance: 0.85 },
          { resourceId: "sealed_clay_jar", amount: 1, chance: 0.85 },
        ],
      },
    ],
  },
];
