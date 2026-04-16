import type { ExpeditionDef } from "./types";

// ═══════════════════════════════════════
// Mainland Expeditions (post-victory)
// ═══════════════════════════════════════

export const MAINLAND_EXPEDITIONS: ExpeditionDef[] = [
  // ── Low-tier repeatable expeditions ──

  {
    id: "coastal_ruins",
    name: "Explore Coastal Ruins",
    description:
      "Investigate crumbling stone structures along the mainland shore. Wildlife nests among the rubble. Three stages of danger lie within.",
    skillId: "combat",
    durationMs: 50000,
    foodCost: 8,
    waterCost: 2,
    xpGain: 30,
    mainland: true,
    difficulty: {
      hazards: ["wildlife", "terrain"],
      stages: [
        {
          name: "Crumbling Walls",
          enemy: { name: "Crumbling Walls", hp: 25, damage: 5, attackSpeed: 0.8, defense: 1, damageTypes: { physical: 1.0 } },
          drops: [
            { resourceId: "flat_stone", amount: 2 },
            { resourceId: "raw_hide", amount: 1 },
          ],
          equipmentDrops: [
            { defId: "corroded_medallion", chance: 0.18, dropsAsBroken: true, affixRange: { min: 0, max: 2 } },
            { defId: "vine_wrapped_helm", chance: 0.08, dropsAsBroken: true, affixRange: { min: 0, max: 1 } },
            { defId: "tattered_leggings", chance: 0.06, dropsAsBroken: true, affixRange: { min: 0, max: 1 } },
          ],
        },
        {
          name: "Feral Boar",
          enemy: { name: "Feral Boar", hp: 45, damage: 9, attackSpeed: 1.0, defense: 3, damageTypes: { physical: 1.0 } },
          equipmentDrops: [
            { defId: "fire_hardened_spear", chance: 0.1, dropsAsBroken: true, affixRange: { min: 0, max: 1 } },
            { defId: "rusted_harpoon", chance: 0.04, dropsAsBroken: true, affixRange: { min: 1, max: 2 } },
          ],
        },
        {
          name: "Ruin Warden",
          enemy: { name: "Ruin Warden", hp: 50, damage: 13, attackSpeed: 1.1, defense: 6, damageTypes: { physical: 1.0 } },
          lootTable: [
            { resourceId: "ruin_dust", amount: 1, chance: 0.06 },
          ],
          equipmentDrops: [
            { defId: "boar_tusk_necklace", chance: 0.015 },
          ],
        },
      ],
      hint: "Bring a weapon and watch your footing on the loose stones. The warden at the end hits hard.",
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
          "A wild boar charges from a collapsed doorway. You fend it off and skin the carcass before claiming the den's contents.",
        drops: [
          { resourceId: "raw_hide", amount: 2 },
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
  },
  {
    id: "tidal_caves",
    name: "Search the Tidal Caves",
    description:
      "Wade into sea caves exposed at low tide. The slippery rock hides copper veins and the bones of stranded creatures. Something lurks in the deepest chambers.",
    skillId: "combat",
    durationMs: 40000,
    foodCost: 6,
    waterCost: 2,
    xpGain: 25,
    mainland: true,
    difficulty: {
      hazards: ["wet", "terrain"],
      stages: [
        {
          name: "Tidal Surge",
          enemy: { name: "Tidal Surge", hp: 25, damage: 7, attackSpeed: 0.8, defense: 0, damageTypes: { wet: 1.0 } },
          drops: [
            { resourceId: "flat_stone", amount: 2 },
          ],
          equipmentDrops: [
            { defId: "bamboo_buckler", chance: 0.08, dropsAsBroken: true, affixRange: { min: 0, max: 1 } },
          ],
        },
        {
          name: "Cave Crawler",
          enemy: { name: "Cave Crawler", hp: 40, damage: 11, attackSpeed: 1.0, defense: 2, damageTypes: { physical: 0.3, wet: 0.7 } },
          equipmentDrops: [
            { defId: "coral_encrusted_buckler", chance: 0.04, dropsAsBroken: true, affixRange: { min: 1, max: 2 } },
          ],
        },
        {
          name: "Drowned Sentinel",
          enemy: { name: "Drowned Sentinel", hp: 55, damage: 16, attackSpeed: 1.1, defense: 5, damageTypes: { physical: 0.2, wet: 0.8 } },
          lootTable: [
            { resourceId: "tidal_salt", amount: 1, chance: 0.06 },
          ],
          equipmentDrops: [
            { defId: "tidecallers_shell", chance: 0.015 },
          ],
        },
      ],
      hint: "Waterproof gear and sure footing will keep you safe. The sentinel in the deepest cave demands serious preparation.",
    },
    outcomes: [
      {
        weight: 30,
        description:
          "The cave opens onto towering sea cliffs with exposed mineral veins — green-streaked copper glints in the rock face! You chip away what you can before the tide turns.",
        biomeDiscovery: "coastal_cliffs",
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
  },

  // ── Mid-tier expeditions with clear difficulty profiles ──

  {
    id: "overgrown_trail",
    name: "Follow the Overgrown Trail",
    description:
      "A faint path leads inland through dense vegetation. The heat is oppressive and the undergrowth hides dangers. Only the strongest reach the predator's den.",
    skillId: "combat",
    durationMs: 70000,
    foodCost: 10,
    waterCost: 4,
    xpGain: 45,
    mainland: true,
    difficulty: {
      hazards: ["heat", "wildlife", "endurance"],
      stages: [
        {
          name: "Jungle Thicket",
          enemy: { name: "Jungle Thicket", hp: 55, damage: 12, attackSpeed: 1.0, defense: 5, damageTypes: { physical: 0.3, heat: 0.7 } },
          drops: [
            { resourceId: "coconut_husk", amount: 2 },
            { resourceId: "flat_stone", amount: 1 },
          ],
          equipmentDrops: [
            { defId: "copper_spear", chance: 0.05, dropsAsBroken: true, affixRange: { min: 1, max: 2 } },
          ],
        },
        {
          name: "Jungle Predator",
          enemy: { name: "Jungle Predator", hp: 80, damage: 15, attackSpeed: 1.1, defense: 7, damageTypes: { physical: 0.5, heat: 0.5 } },
          equipmentDrops: [
            { defId: "vine_lash", chance: 0.03, dropsAsBroken: true, affixRange: { min: 1, max: 2 } },
          ],
        },
        {
          name: "Alpha Stalker",
          enemy: { name: "Alpha Stalker", hp: 80, damage: 19, attackSpeed: 1.3, defense: 10, damageTypes: { physical: 0.4, heat: 0.6 } },
          lootTable: [
            { resourceId: "jungle_sap", amount: 1, chance: 0.05 },
          ],
          equipmentDrops: [
            { defId: "predators_fang", chance: 0.012 },
          ],
        },
      ],
      hint: "A longer trek — pack for heat and bring enough stamina to last. The alpha at the end is fast and deadly.",
    },
    outcomes: [
      {
        weight: 25,
        description:
          "You push through the brush and crest a ridge — rolling hills of red earth stretch ahead, iron-rich deposits visible just beneath the surface! You also spot copper ore glinting in an exposed vein.",
        biomeDiscovery: "inland_hills",
        requiredBiomes: ["coastal_cliffs"],
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
  },
  {
    id: "flooded_quarry",
    name: "Descend into the Flooded Quarry",
    description:
      "An ancient quarry, half-submerged by groundwater. Tin ore glints beneath the murky surface among toppled pillars. Something massive stirs in the deepest pool.",
    skillId: "combat",
    durationMs: 75000,
    foodCost: 10,
    waterCost: 5,
    xpGain: 50,
    mainland: true,
    difficulty: {
      hazards: ["wet", "terrain", "endurance"],
      stages: [
        {
          name: "Murky Descent",
          enemy: { name: "Murky Descent", hp: 55, damage: 12, attackSpeed: 1.0, defense: 5, damageTypes: { physical: 0.2, wet: 0.8 } },
          drops: [
            { resourceId: "tin_ore", amount: 1 },
            { resourceId: "flat_stone", amount: 1 },
          ],
          equipmentDrops: [
            { defId: "copper_shield", chance: 0.06, dropsAsBroken: true, affixRange: { min: 1, max: 2 } },
          ],
        },
        {
          name: "Quarry Depths",
          enemy: { name: "Quarry Depths", hp: 80, damage: 15, attackSpeed: 1.0, defense: 6, damageTypes: { physical: 0.3, wet: 0.7 } },
          equipmentDrops: [
            { defId: "quarry_crown", chance: 0.03, dropsAsBroken: true, affixRange: { min: 1, max: 2 } },
          ],
        },
        {
          name: "Quarry Leviathan",
          enemy: { name: "Quarry Leviathan", hp: 75, damage: 20, attackSpeed: 1.2, defense: 9, damageTypes: { physical: 0.2, wet: 0.8 } },
          lootTable: [
            { resourceId: "quarry_crystal", amount: 1, chance: 0.05 },
          ],
          equipmentDrops: [
            { defId: "drowned_kings_crown", chance: 0.012 },
          ],
        },
      ],
      hint: "You'll be waist-deep in water for hours. Bring waterproof gear and enough toughness to survive what lurks below.",
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
  },
  {
    id: "ridge_pass",
    name: "Cross the Windswept Ridge",
    description:
      "A narrow ridge path climbs above the treeline. Cold winds scour the exposed rock, but iron-bearing stone lies in the cliffs beyond. The summit holds the worst of it.",
    skillId: "combat",
    durationMs: 90000,
    foodCost: 12,
    waterCost: 5,
    xpGain: 60,
    mainland: true,
    difficulty: {
      hazards: ["cold", "terrain", "endurance"],
      stages: [
        {
          name: "Exposed Climb",
          enemy: { name: "Exposed Climb", hp: 70, damage: 14, attackSpeed: 1.0, defense: 7, damageTypes: { physical: 0.2, cold: 0.8 } },
          drops: [
            { resourceId: "charcoal", amount: 2 },
            { resourceId: "iron_ore", amount: 1 },
          ],
          equipmentDrops: [
            { defId: "windrunner_boots", chance: 0.03, dropsAsBroken: true, affixRange: { min: 1, max: 2 } },
          ],
        },
        {
          name: "Ridge Wolves",
          enemy: { name: "Ridge Wolves", hp: 85, damage: 16, attackSpeed: 1.0, defense: 7, damageTypes: { physical: 0.5, cold: 0.5 } },
          equipmentDrops: [
            { defId: "bronze_helm", chance: 0.04, dropsAsBroken: true, affixRange: { min: 1, max: 2 } },
          ],
        },
        {
          name: "Summit Gale",
          enemy: { name: "Summit Gale", hp: 80, damage: 21, attackSpeed: 1.2, defense: 10, damageTypes: { physical: 0.2, cold: 0.8 } },
          lootTable: [
            { resourceId: "ridge_frost", amount: 1, chance: 0.05 },
          ],
          equipmentDrops: [
            { defId: "stormstrider_boots", chance: 0.012 },
          ],
        },
      ],
      hint: "Wrap up warm and travel light. The cold and the climb will test your limits. The summit storm is relentless.",
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
  },

  // ── High-risk expeditions with unique chase rewards ──

  {
    id: "sunken_temple",
    name: "Enter the Sunken Temple",
    description:
      "A half-collapsed temple sinks into the jungle floor, its stone steps descending into darkness. Three trials await within — each deeper and more deadly than the last.",
    skillId: "combat",
    durationMs: 105000,
    foodCost: 15,
    waterCost: 6,
    xpGain: 80,
    mainland: true,
    difficulty: {
      hazards: ["wildlife", "terrain", "endurance"],
      stages: [
        {
          name: "Collapsed Corridors",
          enemy: { name: "Collapsed Corridors", hp: 80, damage: 16, attackSpeed: 1.0, defense: 8, damageTypes: { physical: 0.6, wet: 0.4 } },
          drops: [
            { resourceId: "flat_stone", amount: 2 },
            { resourceId: "bronze_ingot", amount: 1 },
          ],
          equipmentDrops: [
            { defId: "bronze_cuirass", chance: 0.05, dropsAsBroken: true, affixRange: { min: 1, max: 3 } },
          ],
        },
        {
          name: "Temple Guardian",
          enemy: { name: "Temple Guardian", hp: 110, damage: 19, attackSpeed: 1.2, defense: 9, damageTypes: { physical: 0.8, wet: 0.2 } },
          equipmentDrops: [
            { defId: "bronze_sword", chance: 0.08, dropsAsBroken: true, affixRange: { min: 2, max: 3 } },
          ],
        },
        {
          name: "Temple Hierophant",
          enemy: { name: "Temple Hierophant", hp: 110, damage: 24, attackSpeed: 1.4, defense: 12, damageTypes: { physical: 0.7, wet: 0.3 } },
          lootTable: [
            { resourceId: "temple_incense", amount: 1, chance: 0.04 },
          ],
          equipmentDrops: [
            { defId: "idol_of_the_deep", chance: 0.015 },
          ],
        },
      ],
      hint: "This is no place for the unprepared. Bring your best weapons, strongest armor, and deep reserves of stamina. The hierophant at the end is a true test.",
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
  },
  {
    id: "volcanic_rift",
    name: "Brave the Volcanic Rift",
    description:
      "A jagged rift vents sulfurous heat from deep underground. The extreme temperatures forge rare minerals in the rock walls — if you can survive the gauntlet of fire within.",
    skillId: "combat",
    durationMs: 120000,
    foodCost: 18,
    waterCost: 8,
    xpGain: 100,
    mainland: true,
    difficulty: {
      hazards: ["heat", "terrain", "endurance"],
      stages: [
        {
          name: "Steam Vents",
          enemy: { name: "Steam Vents", hp: 75, damage: 18, attackSpeed: 1.0, defense: 7, damageTypes: { physical: 0.1, heat: 0.9 } },
          drops: [
            { resourceId: "obsidian", amount: 1 },
            { resourceId: "iron_ore", amount: 1 },
          ],
          equipmentDrops: [
            { defId: "bronze_shield", chance: 0.04, dropsAsBroken: true, affixRange: { min: 2, max: 3 } },
          ],
        },
        {
          name: "Volcanic Horror",
          enemy: { name: "Volcanic Horror", hp: 105, damage: 20, attackSpeed: 1.1, defense: 9, damageTypes: { physical: 0.3, heat: 0.7 } },
          equipmentDrops: [
            { defId: "bronze_cuirass", chance: 0.05, dropsAsBroken: true, affixRange: { min: 2, max: 3 } },
          ],
        },
        {
          name: "Magma Wyrm",
          enemy: { name: "Magma Wyrm", hp: 110, damage: 26, attackSpeed: 1.3, defense: 12, damageTypes: { physical: 0.2, heat: 0.8 } },
          lootTable: [
            { resourceId: "volcanic_shard", amount: 1, chance: 0.04 },
          ],
          equipmentDrops: [
            { defId: "molten_edge", chance: 0.012 },
          ],
        },
      ],
      hint: "The heat alone will kill you without serious protection. Only attempt this fully equipped. The Magma Wyrm at the end demands everything you have.",
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
      },
      {
        weight: 20,
        description:
          "You land on a lush islet and find banana plants growing wild. You carefully dig up a shoot.",
        drops: [
          { resourceId: "banana_shoot", amount: 1 },
        ],
      },
      {
        weight: 12,
        description:
          "You discover a breadfruit grove on a distant island and take root cuttings.",
        drops: [
          { resourceId: "breadfruit_cutting", amount: 1 },
        ],
      },
      {
        weight: 10,
        description:
          "You find pandanus plants growing wild along the shore of a far island. You take a cutting.",
        drops: [
          { resourceId: "pandanus_cutting", amount: 1 },
        ],
      },
      {
        weight: 15,
        description:
          "You find obsidian outcrops on a distant volcanic shore.",
        drops: [
          { resourceId: "obsidian", amount: 3 },
        ],
      },
      {
        weight: 20,
        description:
          "You beach on a wooded island and gather materials.",
      },
      {
        weight: 15,
        description:
          "You watch the sunset from a pristine beach. The world feels vast and full of possibility.",
      },
      {
        weight: 18,
        description:
          "Strong currents push you off course. You return tired but safe.",
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
