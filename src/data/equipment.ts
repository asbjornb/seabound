import { AffixDef, EquipmentItemDef, EquipmentSlotDef, RepairRecipeDef, SalvageTableDef } from "./types";

// ═══════════════════════════════════════
// Equipment Slots
// ═══════════════════════════════════════

export const EQUIPMENT_SLOTS: Record<string, EquipmentSlotDef> = {
  weapon: {
    id: "weapon",
    name: "Weapon",
    description: "Primary weapon — axes, spears, blades.",
    order: 0,
  },
  offhand: {
    id: "offhand",
    name: "Off-Hand",
    description: "Shield, torch, or secondary tool.",
    order: 1,
  },
  head: {
    id: "head",
    name: "Head",
    description: "Headgear — helmets, hoods, wraps.",
    order: 2,
  },
  body: {
    id: "body",
    name: "Body",
    description: "Torso armor — hide vests, woven shirts, plate.",
    order: 3,
  },
  legs: {
    id: "legs",
    name: "Legs",
    description: "Leg protection — wraps, greaves, trousers.",
    order: 4,
  },
  feet: {
    id: "feet",
    name: "Feet",
    description: "Footwear — sandals, boots, wrappings.",
    order: 5,
  },
};

// ═══════════════════════════════════════
// Affix Definitions
// ═══════════════════════════════════════

export const AFFIXES: Record<string, AffixDef> = {
  // Terrain / hazard mitigation family
  affix_heat_resist: {
    id: "affix_heat_resist",
    name: "Heat Resistant",
    family: "terrain",
    description: "Reduces penalties from extreme heat hazards.",
    modifiers: [{ stat: "heatResist", value: 10 }],
    rollRange: { min: 0.5, max: 1.0 },
  },
  affix_cold_resist: {
    id: "affix_cold_resist",
    name: "Cold Resistant",
    family: "terrain",
    description: "Reduces penalties from cold and exposure hazards.",
    modifiers: [{ stat: "coldResist", value: 10 }],
    rollRange: { min: 0.5, max: 1.0 },
  },
  affix_waterproof: {
    id: "affix_waterproof",
    name: "Waterproof",
    family: "terrain",
    description: "Reduces penalties from rain, rivers, and wet terrain.",
    modifiers: [{ stat: "wetResist", value: 10 }],
    rollRange: { min: 0.5, max: 1.0 },
  },

  // Offense family
  affix_sharp: {
    id: "affix_sharp",
    name: "Sharpened",
    family: "offense",
    description: "Increased damage in encounter checks.",
    modifiers: [{ stat: "offense", value: 8 }],
    rollRange: { min: 0.6, max: 1.0 },
    allowedSlots: ["weapon"],
  },
  affix_heavy_strike: {
    id: "affix_heavy_strike",
    name: "Heavy",
    family: "offense",
    description: "Hits harder but slightly slower. Strong against armored threats.",
    modifiers: [
      { stat: "offense", value: 12 },
      { stat: "speed", value: -3 },
    ],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["weapon"],
  },

  // Defense family
  affix_reinforced: {
    id: "affix_reinforced",
    name: "Reinforced",
    family: "defense",
    description: "Extra protection against physical encounters.",
    modifiers: [{ stat: "defense", value: 8 }],
    rollRange: { min: 0.6, max: 1.0 },
    allowedSlots: ["body", "head", "legs"],
  },
  affix_padded: {
    id: "affix_padded",
    name: "Padded",
    family: "defense",
    description: "Cushioned layer absorbs impact.",
    modifiers: [{ stat: "defense", value: 5 }, { stat: "comfort", value: 3 }],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["body", "legs"],
  },

  // Utility family
  affix_light: {
    id: "affix_light",
    name: "Lightweight",
    family: "utility",
    description: "Reduced encumbrance, faster movement through terrain.",
    modifiers: [{ stat: "speed", value: 5 }],
    rollRange: { min: 0.5, max: 1.0 },
  },
  affix_pocketed: {
    id: "affix_pocketed",
    name: "Pocketed",
    family: "utility",
    description: "Extra carrying capacity for expedition supplies.",
    modifiers: [{ stat: "carryCapacity", value: 4 }],
    rollRange: { min: 0.6, max: 1.0 },
    allowedSlots: ["body", "legs"],
  },
  affix_sturdy: {
    id: "affix_sturdy",
    name: "Sturdy",
    family: "utility",
    description: "More durable — degrades slower during expeditions.",
    modifiers: [{ stat: "durability", value: 10 }],
    rollRange: { min: 0.5, max: 1.0 },
  },

  // Endurance family
  affix_enduring: {
    id: "affix_enduring",
    name: "Enduring",
    family: "endurance",
    description: "Improves stamina during long expeditions.",
    modifiers: [{ stat: "endurance", value: 6 }],
    rollRange: { min: 0.5, max: 1.0 },
  },

  // ── Life family ──

  affix_vital: {
    id: "affix_vital",
    name: "Vital",
    family: "life",
    description: "Reinforced construction improves survivability.",
    modifiers: [{ stat: "life", value: 20 }],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["body", "head", "legs"],
  },
  affix_vigorous: {
    id: "affix_vigorous",
    name: "Vigorous",
    family: "life",
    description: "Invigorating fit that multiplies your vitality.",
    modifiers: [{ stat: "lifePercent", value: 18 }],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["body", "legs"],
  },

  // ── Attack speed family ──

  affix_swift: {
    id: "affix_swift",
    name: "Swift",
    family: "attackSpeed",
    description: "Lightweight and balanced for faster strikes.",
    modifiers: [{ stat: "attackSpeed", value: 8 }],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["weapon"],
  },
  affix_haste: {
    id: "affix_haste",
    name: "Hastened",
    family: "attackSpeed",
    description: "Enchanced grip and balance for quicker attacks.",
    modifiers: [{ stat: "attackSpeedPercent", value: 18 }],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["weapon", "offhand"],
  },

  // ── Crit family ──

  affix_precise: {
    id: "affix_precise",
    name: "Precise",
    family: "crit",
    description: "Honed edge finds weak points more often.",
    modifiers: [{ stat: "critChance", value: 10 }],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["weapon"],
  },
  affix_brutal: {
    id: "affix_brutal",
    name: "Brutal",
    family: "crit",
    description: "Devastating impact when striking true.",
    modifiers: [{ stat: "critMultiplier", value: 35 }],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["weapon"],
  },

  // ── Percentage offense/defense family ──

  affix_keen: {
    id: "affix_keen",
    name: "Keen",
    family: "offense",
    description: "Razor-sharp edge amplifies all offensive power.",
    modifiers: [{ stat: "offensePercent", value: 18 }],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["weapon"],
  },
  affix_fortified: {
    id: "affix_fortified",
    name: "Fortified",
    family: "defense",
    description: "Layered construction amplifies protective qualities.",
    modifiers: [{ stat: "defensePercent", value: 15 }],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["body", "head", "legs", "offhand"],
  },

  // ── Hybrid / tradeoff affixes ──

  affix_berserker: {
    id: "affix_berserker",
    name: "Berserker",
    family: "offense",
    description: "Reckless aggression at the cost of protection.",
    modifiers: [
      { stat: "offensePercent", value: 22 },
      { stat: "defensePercent", value: -12 },
    ],
    rollRange: { min: 0.6, max: 1.0 },
    allowedSlots: ["weapon"],
  },
  affix_juggernaut: {
    id: "affix_juggernaut",
    name: "Juggernaut",
    family: "life",
    description: "Massive and imposing — tough but cumbersome.",
    modifiers: [
      { stat: "life", value: 25 },
      { stat: "defensePercent", value: 10 },
      { stat: "speed", value: -4 },
    ],
    rollRange: { min: 0.5, max: 1.0 },
    allowedSlots: ["body", "legs"],
  },
};

// ═══════════════════════════════════════
// Base Equipment Item Definitions
// ═══════════════════════════════════════
// Tier 0: Improvised gear from existing island resources
// Tier 1: Crafted gear from early mainland materials (copper era)

export const EQUIPMENT_ITEMS: Record<string, EquipmentItemDef> = {
  // ── Tier 0: Improvised (island resources) ──

  fire_hardened_spear: {
    id: "fire_hardened_spear",
    name: "Fire-Hardened Spear",
    description: "A bamboo spear with a fire-hardened tip. Reach and reliability.",
    slot: "weapon",
    baseStats: [{ stat: "offense", value: 8 }, { stat: "speed", value: 1 }, { stat: "attackSpeed", value: 3 }],
    tier: 0,
    maxAffixes: 1,
    tags: ["wood", "weapon"],
  },
  stone_club: {
    id: "stone_club",
    name: "Stone Club",
    description: "A heavy stone lashed to a wooden handle. Blunt but punishing.",
    slot: "weapon",
    baseStats: [{ stat: "offense", value: 10 }, { stat: "speed", value: -2 }, { stat: "attackSpeed", value: 1 }],
    tier: 0,
    maxAffixes: 1,
    tags: ["stone", "weapon"],
  },
  obsidian_dagger: {
    id: "obsidian_dagger",
    name: "Obsidian Dagger",
    description: "A razor-sharp obsidian blade. Fast and nimble — for when agility matters more than reach.",
    slot: "weapon",
    baseStats: [{ stat: "offense", value: 6 }, { stat: "speed", value: 3 }, { stat: "attackSpeed", value: 6 }],
    tier: 0,
    maxAffixes: 2,
    tags: ["stone", "weapon"],
  },
  woven_fiber_vest: {
    id: "woven_fiber_vest",
    name: "Woven Fiber Vest",
    description: "Rough fiber woven into a basic chest covering. Better than nothing.",
    slot: "body",
    baseStats: [{ stat: "defense", value: 4 }, { stat: "heatResist", value: 2 }, { stat: "life", value: 8 }],
    tier: 0,
    maxAffixes: 1,
    tags: ["fiber", "armor"],
  },
  hide_wraps: {
    id: "hide_wraps",
    name: "Hide Wraps",
    description: "Strips of dried hide bound around the legs. Protects against scrapes and thorns.",
    slot: "legs",
    baseStats: [{ stat: "defense", value: 3 }, { stat: "speed", value: 1 }, { stat: "life", value: 5 }],
    tier: 0,
    maxAffixes: 1,
    tags: ["hide", "armor"],
  },
  bamboo_sandals: {
    id: "bamboo_sandals",
    name: "Bamboo Sandals",
    description: "Simple bamboo-sole sandals lashed with fiber. Protects feet from rough terrain.",
    slot: "feet",
    baseStats: [{ stat: "speed", value: 3 }, { stat: "defense", value: 1 }],
    tier: 0,
    maxAffixes: 1,
    tags: ["wood", "armor"],
  },
  bamboo_buckler: {
    id: "bamboo_buckler",
    name: "Bamboo Buckler",
    description: "A small round shield of woven bamboo. Light and fast to deploy.",
    slot: "offhand",
    baseStats: [{ stat: "defense", value: 5 }, { stat: "speed", value: -1 }, { stat: "life", value: 5 }],
    tier: 0,
    maxAffixes: 1,
    tags: ["wood", "shield"],
  },

  // ── Tier 1: Copper-era gear (early mainland) ──

  copper_spear: {
    id: "copper_spear",
    name: "Copper Spear",
    description: "A spear tipped with hammered native copper. A real step up.",
    slot: "weapon",
    baseStats: [{ stat: "offense", value: 14 }, { stat: "speed", value: 1 }, { stat: "attackSpeed", value: 4 }],
    requiredSkills: [{ skillId: "combat", level: 3 }],
    tier: 1,
    maxAffixes: 2,
    tags: ["metal", "weapon"],
  },
  copper_axe: {
    id: "copper_axe",
    name: "Copper Axe",
    description: "A heavy copper-headed axe. Cleaves through obstacles and enemies alike.",
    slot: "weapon",
    baseStats: [{ stat: "offense", value: 16 }, { stat: "speed", value: -3 }, { stat: "attackSpeed", value: 2 }],
    requiredSkills: [{ skillId: "combat", level: 3 }],
    tier: 1,
    maxAffixes: 2,
    tags: ["metal", "weapon"],
  },
  copper_shield: {
    id: "copper_shield",
    name: "Copper Shield",
    description: "A round shield with a hammered copper face. Deflects blows reliably.",
    slot: "offhand",
    baseStats: [{ stat: "defense", value: 10 }, { stat: "speed", value: -2 }, { stat: "life", value: 12 }],
    requiredSkills: [{ skillId: "combat", level: 2 }],
    tier: 1,
    maxAffixes: 2,
    tags: ["metal", "shield"],
  },
  hide_armor: {
    id: "hide_armor",
    name: "Hide Armor",
    description: "Layered cured hides stitched into a proper chest piece.",
    slot: "body",
    baseStats: [{ stat: "defense", value: 8 }, { stat: "endurance", value: 2 }, { stat: "life", value: 15 }],
    tier: 1,
    maxAffixes: 2,
    tags: ["hide", "armor"],
  },
  hide_cap: {
    id: "hide_cap",
    name: "Hide Cap",
    description: "A fitted cap of layered hide. Protects the head without blocking vision.",
    slot: "head",
    baseStats: [{ stat: "defense", value: 5 }, { stat: "coldResist", value: 3 }, { stat: "life", value: 8 }],
    tier: 1,
    maxAffixes: 2,
    tags: ["hide", "armor"],
  },
  hide_leggings: {
    id: "hide_leggings",
    name: "Hide Leggings",
    description: "Fitted hide trousers. Good mobility with decent protection.",
    slot: "legs",
    baseStats: [{ stat: "defense", value: 6 }, { stat: "speed", value: 1 }, { stat: "life", value: 10 }],
    tier: 1,
    maxAffixes: 2,
    tags: ["hide", "armor"],
  },
  hide_boots: {
    id: "hide_boots",
    name: "Hide Boots",
    description: "Sturdy boots of stitched hide. Good ankle support for rough terrain.",
    slot: "feet",
    baseStats: [{ stat: "speed", value: 2 }, { stat: "defense", value: 4 }, { stat: "wetResist", value: 3 }, { stat: "life", value: 6 }],
    tier: 1,
    maxAffixes: 2,
    tags: ["hide", "armor"],
  },
  // ── Tier 2: Bronze-era gear (mid mainland) ──

  bronze_sword: {
    id: "bronze_sword",
    name: "Bronze Sword",
    description: "A leaf-shaped bronze blade. Balanced and sharp — the standard of a lost age.",
    slot: "weapon",
    baseStats: [{ stat: "offense", value: 20 }, { stat: "speed", value: 2 }, { stat: "attackSpeed", value: 5 }],
    requiredSkills: [{ skillId: "combat", level: 5 }],
    tier: 2,
    maxAffixes: 3,
    tags: ["metal", "weapon"],
  },
  bronze_shield: {
    id: "bronze_shield",
    name: "Bronze Shield",
    description: "A heavy round shield cast in bronze. Turns aside even determined blows.",
    slot: "offhand",
    baseStats: [{ stat: "defense", value: 14 }, { stat: "speed", value: -3 }, { stat: "life", value: 18 }],
    requiredSkills: [{ skillId: "combat", level: 4 }],
    tier: 2,
    maxAffixes: 3,
    tags: ["metal", "shield"],
  },
  bronze_helm: {
    id: "bronze_helm",
    name: "Bronze Helm",
    description: "A close-fitting bronze helmet with cheek guards. Corroded but functional.",
    slot: "head",
    baseStats: [{ stat: "defense", value: 8 }, { stat: "coldResist", value: 4 }, { stat: "life", value: 12 }],
    requiredSkills: [{ skillId: "combat", level: 4 }],
    tier: 2,
    maxAffixes: 3,
    tags: ["metal", "armor"],
  },
  bronze_cuirass: {
    id: "bronze_cuirass",
    name: "Bronze Cuirass",
    description: "Hammered bronze plates shaped to the torso. Heavy but formidable protection.",
    slot: "body",
    baseStats: [{ stat: "defense", value: 14 }, { stat: "endurance", value: 3 }, { stat: "life", value: 25 }],
    requiredSkills: [{ skillId: "combat", level: 5 }],
    tier: 2,
    maxAffixes: 3,
    tags: ["metal", "armor"],
  },
  bronze_greaves: {
    id: "bronze_greaves",
    name: "Bronze Greaves",
    description: "Shin guards of beaten bronze. Protects the legs on rough marches.",
    slot: "legs",
    baseStats: [{ stat: "defense", value: 10 }, { stat: "speed", value: -1 }, { stat: "life", value: 15 }],
    requiredSkills: [{ skillId: "combat", level: 4 }],
    tier: 2,
    maxAffixes: 3,
    tags: ["metal", "armor"],
  },
  bronze_boots: {
    id: "bronze_boots",
    name: "Bronze-Shod Boots",
    description: "Heavy leather boots reinforced with bronze plates at the toe and heel.",
    slot: "feet",
    baseStats: [{ stat: "defense", value: 7 }, { stat: "speed", value: 1 }, { stat: "wetResist", value: 4 }, { stat: "life", value: 8 }],
    requiredSkills: [{ skillId: "combat", level: 4 }],
    tier: 2,
    maxAffixes: 3,
    tags: ["metal", "armor"],
  },
};

// ═══════════════════════════════════════
// Repair Recipes
// ═══════════════════════════════════════
// Each repair improves condition by one step: broken → damaged → worn → pristine.
// Recipes match equipment by tag. Higher-tier items need more materials.

export const REPAIR_RECIPES: RepairRecipeDef[] = [
  {
    id: "repair_wood",
    name: "Repair Wood Gear",
    description: "Patch and reinforce wooden equipment with bamboo and fiber.",
    targetTags: ["wood"],
    inputs: [
      { resourceId: "bamboo_cane", amount: 2 },
      { resourceId: "rough_fiber", amount: 2 },
    ],
    requiredSkillLevel: 0,
    xpGain: 10,
  },
  {
    id: "repair_stone",
    name: "Repair Stone Gear",
    description: "Re-knap and re-bind stone equipment with fresh materials.",
    targetTags: ["stone"],
    inputs: [
      { resourceId: "flat_stone", amount: 2 },
      { resourceId: "rough_fiber", amount: 1 },
    ],
    requiredSkillLevel: 0,
    xpGain: 10,
  },
  {
    id: "repair_fiber",
    name: "Repair Fiber Gear",
    description: "Re-weave damaged fiber armor with fresh fibers.",
    targetTags: ["fiber"],
    inputs: [
      { resourceId: "rough_fiber", amount: 3 },
    ],
    requiredSkillLevel: 0,
    xpGain: 8,
  },
  {
    id: "repair_hide",
    name: "Repair Hide Gear",
    description: "Patch and re-stitch hide armor using cured leather strips.",
    targetTags: ["hide"],
    inputs: [
      { resourceId: "hide", amount: 2 },
      { resourceId: "rough_fiber", amount: 1 },
    ],
    requiredSkillLevel: 3,
    xpGain: 15,
  },
  {
    id: "repair_metal",
    name: "Repair Metal Gear",
    description: "Hammer out dents and re-forge damaged metal equipment at the kiln.",
    targetTags: ["metal"],
    inputs: [
      { resourceId: "native_copper", amount: 2 },
      { resourceId: "charcoal", amount: 1 },
    ],
    requiredSkillLevel: 5,
    requiredBuildings: ["kiln"],
    xpGain: 25,
  },
];

// ═══════════════════════════════════════
// Salvage Tables
// ═══════════════════════════════════════
// Salvaging destroys an equipment item and returns partial base materials.
// Condition affects yield: pristine 100%, worn 75%, damaged 50%, broken 25%.
// Items with affixes have a chance to also yield affix reagents (one roll per affix).

const AFFIX_REAGENT_OUTPUTS: SalvageTableDef["affixReagentOutputs"] = [
  { affixFamily: "terrain", resourceId: "terrain_essence", chance: 0.5 },
  { affixFamily: "offense", resourceId: "combat_essence", chance: 0.5 },
  { affixFamily: "defense", resourceId: "combat_essence", chance: 0.5 },
  { affixFamily: "utility", resourceId: "utility_essence", chance: 0.5 },
  { affixFamily: "endurance", resourceId: "combat_essence", chance: 0.4 },
];

export const SALVAGE_TABLES: SalvageTableDef[] = [
  {
    id: "salvage_wood",
    name: "Salvage Wood Gear",
    description: "Break down wooden equipment for bamboo and fiber scraps.",
    targetTags: ["wood"],
    outputs: [
      { resourceId: "bamboo_cane", amount: 2 },
      { resourceId: "rough_fiber", amount: 1 },
    ],
    affixReagentOutputs: AFFIX_REAGENT_OUTPUTS,
    requiredSkillLevel: 0,
    xpGain: 5,
  },
  {
    id: "salvage_stone",
    name: "Salvage Stone Gear",
    description: "Chip apart stone equipment for usable stone fragments.",
    targetTags: ["stone"],
    outputs: [
      { resourceId: "flat_stone", amount: 2 },
      { resourceId: "rough_fiber", amount: 1, chance: 0.5 },
    ],
    affixReagentOutputs: AFFIX_REAGENT_OUTPUTS,
    requiredSkillLevel: 0,
    xpGain: 5,
  },
  {
    id: "salvage_fiber",
    name: "Salvage Fiber Gear",
    description: "Unravel woven fiber equipment for raw fiber.",
    targetTags: ["fiber"],
    outputs: [
      { resourceId: "rough_fiber", amount: 2 },
    ],
    affixReagentOutputs: AFFIX_REAGENT_OUTPUTS,
    requiredSkillLevel: 0,
    xpGain: 4,
  },
  {
    id: "salvage_hide",
    name: "Salvage Hide Gear",
    description: "Strip down hide armor for usable leather scraps.",
    targetTags: ["hide"],
    outputs: [
      { resourceId: "hide", amount: 2 },
      { resourceId: "rough_fiber", amount: 1, chance: 0.5 },
    ],
    affixReagentOutputs: AFFIX_REAGENT_OUTPUTS,
    requiredSkillLevel: 2,
    xpGain: 8,
  },
  {
    id: "salvage_metal",
    name: "Salvage Metal Gear",
    description: "Melt down metal equipment to recover copper fragments.",
    targetTags: ["metal"],
    outputs: [
      { resourceId: "native_copper", amount: 3 },
      { resourceId: "charcoal", amount: 1, chance: 0.75 },
    ],
    affixReagentOutputs: AFFIX_REAGENT_OUTPUTS,
    requiredSkillLevel: 3,
    xpGain: 12,
  },
];
