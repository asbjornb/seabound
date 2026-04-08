import { ExpeditionDef } from "./types";

// ═══════════════════════════════════════
// Mainland Expeditions (post-victory)
// ═══════════════════════════════════════

export const MAINLAND_EXPEDITIONS: ExpeditionDef[] = [
  // ── Low-tier repeatable expeditions ──

  {
    id: "coastal_ruins",
    name: "Explore Coastal Ruins",
    description:
      "Investigate crumbling stone structures along the mainland shore. Wildlife nests among the rubble.",
    skillId: "combat",
    durationMs: 15000,
    foodCost: 8,
    waterCost: 2,
    xpGain: 30,
    mainland: true,
    difficulty: {
      hazards: ["wildlife", "terrain"],
      statChecks: [
        { stat: "offense", threshold: 5 },
        { stat: "defense", threshold: 3 },
      ],
      hint: "Bring a weapon and watch your footing on the loose stones.",
    },
    outcomes: [
      {
        weight: 30,
        description:
          "You navigate the ruins carefully, finding useful stone and metal scraps among the rubble.",
        drops: [
          { resourceId: "flat_stone", amount: 3 },
        ],
      },
      {
        weight: 25,
        description:
          "A wild boar charges from a collapsed doorway. You fend it off and claim the den's contents.",
        drops: [
          { resourceId: "coconut_husk", amount: 3 },
          { resourceId: "flat_stone", amount: 1 },
        ],
      },
      {
        weight: 15,
        description:
          "Deep in a half-buried chamber, you find a corroded copper deposit in the walls.",
        drops: [
          { resourceId: "native_copper", amount: 2 },
        ],
      },
      {
        weight: 30,
        description:
          "The ruins are too unstable to explore safely. You retreat before the walls collapse.",
      },
    ],
    equipmentDrops: [
      {
        defId: "fire_hardened_spear",
        chance: 0.1,
        dropsAsBroken: true,
        affixRange: { min: 0, max: 1 },
      },
    ],
  },
  {
    id: "tidal_caves",
    name: "Search the Tidal Caves",
    description:
      "Wade into sea caves exposed at low tide. The slippery rock hides copper veins and the bones of stranded creatures.",
    skillId: "combat",
    durationMs: 12000,
    foodCost: 6,
    waterCost: 2,
    xpGain: 25,
    mainland: true,
    difficulty: {
      hazards: ["wet", "terrain"],
      statChecks: [
        { stat: "wetResist", threshold: 3 },
        { stat: "speed", threshold: 3 },
      ],
      hint: "Waterproof gear and sure footing will keep you safe on the slick stone.",
    },
    outcomes: [
      {
        weight: 30,
        description:
          "The cave walls sparkle with copper deposits. You chip away what you can before the tide turns.",
        drops: [
          { resourceId: "copper_ore", amount: 2 },
        ],
      },
      {
        weight: 25,
        description:
          "You find a cache of flat stones wedged between tide pools, smoothed by centuries of waves.",
        drops: [
          { resourceId: "flat_stone", amount: 4 },
        ],
      },
      {
        weight: 15,
        description:
          "A collapsed section reveals a vein of greenish ore — malachite, rich in copper.",
        drops: [
          { resourceId: "copper_ore", amount: 3 },
          { resourceId: "native_copper", amount: 1 },
        ],
      },
      {
        weight: 30,
        description:
          "The tide comes in faster than expected. You scramble out with soaked gear and nothing to show for it.",
      },
    ],
    equipmentDrops: [
      {
        defId: "bamboo_buckler",
        chance: 0.08,
        dropsAsBroken: true,
        affixRange: { min: 0, max: 1 },
      },
    ],
  },

  // ── Mid-tier expeditions with clear difficulty profiles ──

  {
    id: "overgrown_trail",
    name: "Follow the Overgrown Trail",
    description:
      "A faint path leads inland through dense vegetation. The heat is oppressive and the undergrowth hides dangers.",
    skillId: "combat",
    durationMs: 20000,
    foodCost: 10,
    waterCost: 4,
    xpGain: 45,
    mainland: true,
    difficulty: {
      hazards: ["heat", "wildlife", "endurance"],
      statChecks: [
        { stat: "offense", threshold: 8 },
        { stat: "heatResist", threshold: 4 },
        { stat: "endurance", threshold: 3 },
      ],
      hint: "A longer trek — pack for heat and bring enough stamina to last.",
    },
    outcomes: [
      {
        weight: 25,
        description:
          "You push through the brush and reach a clearing with an ancient stone foundation. Copper ore glints in an exposed vein.",
        drops: [
          { resourceId: "native_copper", amount: 3 },
        ],
      },
      {
        weight: 20,
        description:
          "You stumble on a nest of vipers but dispatch them with your weapon. Their nest sits atop useful materials.",
        drops: [
          { resourceId: "coconut_husk", amount: 2 },
          { resourceId: "flat_stone", amount: 2 },
        ],
      },
      {
        weight: 15,
        description:
          "The trail opens to a moss-covered ruin with remarkably preserved stonework. You salvage what you can.",
        drops: [
          { resourceId: "flat_stone", amount: 4 },
          { resourceId: "native_copper", amount: 1 },
        ],
      },
      {
        weight: 40,
        description:
          "The heat saps your strength and you're forced to turn back before reaching anything of value.",
      },
    ],
    equipmentDrops: [
      {
        defId: "copper_spear",
        chance: 0.05,
        dropsAsBroken: true,
        affixRange: { min: 1, max: 2 },
      },
    ],
  },
  {
    id: "flooded_quarry",
    name: "Descend into the Flooded Quarry",
    description:
      "An ancient quarry, half-submerged by groundwater. Tin ore glints beneath the murky surface among toppled pillars.",
    skillId: "combat",
    durationMs: 22000,
    foodCost: 10,
    waterCost: 5,
    xpGain: 50,
    mainland: true,
    difficulty: {
      hazards: ["wet", "terrain", "endurance"],
      statChecks: [
        { stat: "wetResist", threshold: 5 },
        { stat: "endurance", threshold: 5 },
        { stat: "defense", threshold: 4 },
      ],
      hint: "You'll be waist-deep in water for hours. Bring waterproof gear and stamina.",
    },
    outcomes: [
      {
        weight: 25,
        description:
          "You wade to the quarry floor and pry dark cassiterite pebbles from the exposed rock face.",
        drops: [
          { resourceId: "tin_ore", amount: 2 },
          { resourceId: "flat_stone", amount: 2 },
        ],
      },
      {
        weight: 20,
        description:
          "Beneath a collapsed pillar you find a pocket of ore — both copper and tin, side by side.",
        drops: [
          { resourceId: "tin_ore", amount: 1 },
          { resourceId: "copper_ore", amount: 2 },
        ],
      },
      {
        weight: 15,
        description:
          "The deepest chamber holds a cache of corroded bronze tools, too far gone to use but rich in salvageable metal.",
        drops: [
          { resourceId: "tin_ore", amount: 3 },
        ],
      },
      {
        weight: 40,
        description:
          "The water rises suddenly — an underground spring surging. You climb out with nothing but soaked clothes.",
      },
    ],
    equipmentDrops: [
      {
        defId: "copper_shield",
        chance: 0.06,
        dropsAsBroken: true,
        affixRange: { min: 1, max: 2 },
      },
    ],
  },
  {
    id: "ridge_pass",
    name: "Cross the Windswept Ridge",
    description:
      "A narrow ridge path climbs above the treeline. Cold winds scour the exposed rock, but iron-bearing stone lies in the cliffs beyond.",
    skillId: "combat",
    durationMs: 25000,
    foodCost: 12,
    waterCost: 5,
    xpGain: 60,
    mainland: true,
    difficulty: {
      hazards: ["cold", "terrain", "endurance"],
      statChecks: [
        { stat: "coldResist", threshold: 5 },
        { stat: "speed", threshold: 4 },
        { stat: "endurance", threshold: 6 },
      ],
      hint: "Wrap up warm and travel light. The cold and the climb will test your limits.",
    },
    outcomes: [
      {
        weight: 25,
        description:
          "Beyond the ridge, you find an exposed cliff face veined with red-brown iron ore. You fill your pack.",
        drops: [
          { resourceId: "iron_ore", amount: 2 },
        ],
      },
      {
        weight: 20,
        description:
          "At the summit you discover a collapsed cairn. Among the stones: charcoal and ore, left by someone long gone.",
        drops: [
          { resourceId: "iron_ore", amount: 1 },
          { resourceId: "charcoal", amount: 4 },
        ],
      },
      {
        weight: 15,
        description:
          "A sheltered hollow on the far side holds a seam of both iron and copper ore, still untouched.",
        drops: [
          { resourceId: "iron_ore", amount: 2 },
          { resourceId: "copper_ore", amount: 2 },
        ],
      },
      {
        weight: 40,
        description:
          "The wind drives you back before you reach the far side. You retreat, half-frozen, with nothing.",
      },
    ],
    equipmentDrops: [
      {
        defId: "bronze_helm",
        chance: 0.04,
        dropsAsBroken: true,
        affixRange: { min: 1, max: 2 },
      },
    ],
  },

  // ── High-risk expeditions with unique chase rewards ──

  {
    id: "sunken_temple",
    name: "Enter the Sunken Temple",
    description:
      "A half-collapsed temple sinks into the jungle floor, its stone steps descending into darkness. The air is thick and the walls groan.",
    skillId: "combat",
    durationMs: 30000,
    foodCost: 15,
    waterCost: 6,
    xpGain: 80,
    mainland: true,
    difficulty: {
      hazards: ["wildlife", "terrain", "endurance"],
      statChecks: [
        { stat: "offense", threshold: 14 },
        { stat: "defense", threshold: 10 },
        { stat: "endurance", threshold: 8 },
      ],
      minGearScore: 30,
      hint: "This is no place for the unprepared. Bring your best weapons, strongest armor, and deep reserves of stamina.",
    },
    outcomes: [
      {
        weight: 20,
        description:
          "You fight through collapsing corridors and feral animals denning in the inner chambers. In the deepest room, bronze artifacts lie undisturbed on a stone altar.",
        drops: [
          { resourceId: "bronze_ingot", amount: 3 },
          { resourceId: "tin_ore", amount: 2 },
        ],
      },
      {
        weight: 20,
        description:
          "The lower level is flooded, but you wade through and find a collapsed storeroom. Corroded bronze vessels and tools — heavy, but worth the haul.",
        drops: [
          { resourceId: "bronze_ingot", amount: 2 },
          { resourceId: "copper_ingot", amount: 2 },
        ],
      },
      {
        weight: 15,
        description:
          "Behind a fallen column, you discover a sealed alcove with remarkably preserved metalwork. The bronze gleams as if it were forged yesterday.",
        drops: [
          { resourceId: "bronze_ingot", amount: 4 },
        ],
      },
      {
        weight: 45,
        description:
          "The ceiling groans and a section collapses behind you. You barely escape with your life — and nothing else.",
      },
    ],
    equipmentDrops: [
      {
        defId: "bronze_sword",
        chance: 0.08,
        dropsAsBroken: true,
        affixRange: { min: 2, max: 3 },
      },
      {
        defId: "bronze_cuirass",
        chance: 0.05,
        dropsAsBroken: true,
        affixRange: { min: 1, max: 3 },
      },
    ],
  },
  {
    id: "volcanic_rift",
    name: "Brave the Volcanic Rift",
    description:
      "A jagged rift vents sulfurous heat from deep underground. The extreme temperatures forge rare minerals in the rock walls — if you can survive long enough to collect them.",
    skillId: "combat",
    durationMs: 35000,
    foodCost: 18,
    waterCost: 8,
    xpGain: 100,
    mainland: true,
    difficulty: {
      hazards: ["heat", "terrain", "endurance"],
      statChecks: [
        { stat: "heatResist", threshold: 10 },
        { stat: "endurance", threshold: 10 },
        { stat: "defense", threshold: 8 },
      ],
      minGearScore: 40,
      hint: "The heat alone will kill you without serious protection. Only attempt this fully equipped and provisioned.",
    },
    outcomes: [
      {
        weight: 20,
        description:
          "You descend along a narrow ledge, shielding your face from the heat. In a cooled lava tube, you find iron ore deposits of extraordinary purity.",
        drops: [
          { resourceId: "iron_ore", amount: 4 },
          { resourceId: "charcoal", amount: 6 },
        ],
      },
      {
        weight: 15,
        description:
          "Deep in the rift, volcanic glass and metallic deposits line the walls. You chip away what you can carry.",
        drops: [
          { resourceId: "iron_ore", amount: 3 },
          { resourceId: "obsidian", amount: 3 },
        ],
      },
      {
        weight: 10,
        description:
          "At the deepest point, you find a vein of dense, dark ore fused by volcanic heat. It's heavier than anything you've seen — practically steel.",
        drops: [
          { resourceId: "iron_ore", amount: 5 },
          { resourceId: "tin_ore", amount: 3 },
        ],
      },
      {
        weight: 55,
        description:
          "A geyser of superheated steam erupts ahead of you. The path is impassable — you turn back, dehydrated and empty-handed.",
      },
    ],
    equipmentDrops: [
      {
        defId: "bronze_greaves",
        chance: 0.06,
        dropsAsBroken: true,
        affixRange: { min: 2, max: 3 },
      },
      {
        defId: "bronze_shield",
        chance: 0.04,
        dropsAsBroken: true,
        affixRange: { min: 2, max: 3 },
      },
    ],
  },
];

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
        requiredBiomes: ["coconut_grove"],
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
