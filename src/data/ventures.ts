import type { VentureDef } from "./types";

// ═══════════════════════════════════════
// Mainland Ventures — staged combat encounters
// ═══════════════════════════════════════

export const VENTURES: VentureDef[] = [
  // ── Low-tier repeatable ventures ──

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
    hazards: ["wildlife", "terrain"],
    stages: [
      {
        name: "Crumbling Walls",
        enemy: { name: "Crumbling Walls", hp: 40, damage: 8, attackSpeed: 1.0, defense: 2, damageTypes: { physical: 1.0 } },
        drops: [
          { resourceId: "flat_stone", amount: 2 },
          { resourceId: "raw_hide", amount: 2, chance: 0.25 },
          { resourceId: "coconut_husk", amount: 3, chance: 0.25 },
          { resourceId: "native_copper", amount: 2, chance: 0.15 },
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
    hazards: ["wet", "terrain"],
    stages: [
      {
        name: "Tidal Surge",
        enemy: { name: "Tidal Surge", hp: 35, damage: 9, attackSpeed: 1.0, defense: 2, damageTypes: { physical: 0.3, wet: 0.7 } },
        drops: [
          { resourceId: "flat_stone", amount: 2 },
          { resourceId: "copper_ore", amount: 3, chance: 0.45 },
          { resourceId: "native_copper", amount: 1, chance: 0.15 },
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
        biomeDiscovery: "coastal_cliffs",
        biomeDiscoveryChance: 0.3,
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

  // ── Mid-tier ventures with clear difficulty profiles ──

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
    hazards: ["heat", "wildlife", "endurance"],
    stages: [
      {
        name: "Jungle Thicket",
        enemy: { name: "Jungle Thicket", hp: 55, damage: 12, attackSpeed: 1.0, defense: 5, damageTypes: { physical: 0.3, heat: 0.7 } },
        drops: [
          { resourceId: "coconut_husk", amount: 2 },
          { resourceId: "flat_stone", amount: 2 },
          { resourceId: "native_copper", amount: 3, chance: 0.4 },
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
        biomeDiscovery: "inland_hills",
        biomeDiscoveryChance: 0.25,
        biomeDiscoveryRequires: ["coastal_cliffs"],
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
    hazards: ["wet", "terrain", "endurance"],
    stages: [
      {
        name: "Murky Descent",
        enemy: { name: "Murky Descent", hp: 55, damage: 12, attackSpeed: 1.0, defense: 5, damageTypes: { physical: 0.2, wet: 0.8 } },
        drops: [
          { resourceId: "tin_ore", amount: 2 },
          { resourceId: "flat_stone", amount: 2 },
          { resourceId: "copper_ore", amount: 2, chance: 0.2 },
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
    hazards: ["cold", "terrain", "endurance"],
    stages: [
      {
        name: "Exposed Climb",
        enemy: { name: "Exposed Climb", hp: 70, damage: 14, attackSpeed: 1.0, defense: 7, damageTypes: { physical: 0.2, cold: 0.8 } },
        drops: [
          { resourceId: "charcoal", amount: 3 },
          { resourceId: "iron_ore", amount: 2 },
          { resourceId: "copper_ore", amount: 2, chance: 0.15 },
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

  // ── High-risk ventures with unique chase rewards ──

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
    hazards: ["wildlife", "terrain", "endurance"],
    stages: [
      {
        name: "Collapsed Corridors",
        enemy: { name: "Collapsed Corridors", hp: 80, damage: 16, attackSpeed: 1.0, defense: 8, damageTypes: { physical: 0.6, wet: 0.4 } },
        drops: [
          { resourceId: "flat_stone", amount: 2 },
          { resourceId: "bronze_ingot", amount: 3 },
          { resourceId: "tin_ore", amount: 2, chance: 0.2 },
          { resourceId: "copper_ingot", amount: 2, chance: 0.2 },
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
        enemy: { name: "Temple Hierophant", hp: 140, damage: 26, attackSpeed: 1.4, defense: 14, damageTypes: { physical: 0.7, wet: 0.3 } },
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
    hazards: ["heat", "terrain", "endurance"],
    stages: [
      {
        name: "Steam Vents",
        enemy: { name: "Steam Vents", hp: 75, damage: 18, attackSpeed: 1.0, defense: 7, damageTypes: { physical: 0.1, heat: 0.9 } },
        drops: [
          { resourceId: "obsidian", amount: 2 },
          { resourceId: "iron_ore", amount: 3 },
          { resourceId: "charcoal", amount: 6, chance: 0.2 },
          { resourceId: "tin_ore", amount: 3, chance: 0.1 },
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
        enemy: { name: "Magma Wyrm", hp: 150, damage: 30, attackSpeed: 1.3, defense: 18, damageTypes: { physical: 0.2, heat: 0.8 } },
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
];
