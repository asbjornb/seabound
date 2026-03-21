export type ResourceId =
  // Phase 0 - Bare Hands
  | "coconut"
  | "coconut_husk"
  | "driftwood_branch"
  | "flat_stone"
  | "palm_frond"
  | "small_fish"
  | "crab"
  | "shell"
  // Phase 1 - Bamboo Tier
  | "bamboo_cane"
  | "bamboo_splinter"
  | "rough_fiber"
  | "dried_fiber"
  | "cordage"
  | "bamboo_knife"
  | "large_shell"
  // Phase 1b - Fire
  | "dry_grass"
  | "bow_drill_kit"
  | "bamboo_spear"
  // Weaving
  | "woven_basket"
  // Food
  | "large_fish"
  | "cooked_fish"
  | "cooked_crab"
  | "cooked_large_fish"
  // Seeds
  | "wild_seed"
  // Maritime
  | "raft"
  // Obsidian
  | "obsidian"
  | "obsidian_blade"
  // Stone Tools
  | "chert"
  | "stone_flake"
  | "stone_blade"
  | "hammerstone"
  | "shell_adze"
  | "stone_axe"
  // Timber
  | "large_log"
  | "charred_log"
  | "shaped_hull"
  // Maritime - Dugout
  | "dugout"
  // Water
  | "fresh_water"
  // Fishing Tools
  | "gorge_hook"
  | "basket_trap"
  // Phase 2 - Clay Tier
  | "clay"
  | "shaped_clay_pot"
  | "fired_clay_pot"
  | "sealed_clay_jar"
  | "crucible";

export type SkillId =
  | "foraging"
  | "fishing"
  | "woodworking"
  | "crafting"
  | "cooking"
  | "weaving"
  | "construction"
  | "farming"
  | "navigation"
  | "preservation";

export type BiomeId = "beach" | "coconut_grove" | "bamboo_grove" | "jungle_interior" | "nearby_island";

export type BuildingId =
  | "camp_fire"
  | "palm_leaf_pile"
  | "drying_rack"
  | "fenced_perimeter"
  | "firing_pit"
  | "kiln"
  | "fiber_loom";

export type ResourceCategory = "raw" | "processed" | "tool" | "food" | "structure";

export interface StorageBonus {
  category: ResourceCategory;
  amount: number; // extra storage slots per item in this category
}

export interface BuildingDef {
  id: BuildingId;
  name: string;
  description: string;
  unlocks: string; // human-readable description of what this building enables
  storageBonus?: StorageBonus[];
}

export interface ResourceDef {
  id: ResourceId;
  name: string;
  description: string;
  category: ResourceCategory;
  size?: "small" | "large"; // defaults to "small" if omitted
}

export interface SkillDef {
  id: SkillId;
  name: string;
  description: string;
}

export interface Drop {
  resourceId: ResourceId;
  amount: number;
  chance?: number; // 0-1, defaults to 1
}

// ═══════════════════════════════════════
// Skill Milestones
// ═══════════════════════════════════════

export type MilestoneEffect =
  | { type: "drop_chance"; actionId: string; resourceId: ResourceId; bonus: number }
  | { type: "duration"; actionId: string; multiplier: number } // e.g. 0.9 = 10% faster
  | { type: "double_output"; chance: number; recipeId?: string }; // e.g. 0.05 = 5% chance to double craft output; recipeId scopes to one recipe

export interface SkillMilestone {
  level: number;
  description: string;
  hidden?: boolean; // if true, show generic hint until player reaches this level
  effects?: MilestoneEffect[];
}

export type ContentPanel = "gather" | "craft" | "camp";

export interface ActionDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
  panel: ContentPanel;
  durationMs: number;
  drops: Drop[];
  requiredSkillLevel?: number;
  requiredTools?: ResourceId[];
  requiredBiome?: BiomeId;
  requiredBuildings?: BuildingId[];
  xpGain: number;
}

export interface RecipeDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
  panel: ContentPanel;
  inputs: { resourceId: ResourceId; amount: number }[];
  output?: { resourceId: ResourceId; amount: number };
  durationMs: number;
  requiredSkillLevel?: number;
  requiredSkills?: { skillId: SkillId; level: number }[]; // dual-skill gates
  requiredItems?: ResourceId[]; // item-trigger: must have this item in inventory
  requiredBuildings?: BuildingId[]; // must have these buildings constructed
  buildingOutput?: BuildingId; // if set, this recipe builds a building instead of producing output resource
  oneTimeCraft?: boolean; // if true, recipe disappears once player owns ≥1 of the output
  repeatable?: boolean; // if true, auto-repeats until inputs run out (like gathering actions)
  xpGain: number;
  moraleGain?: number; // if set, completing this recipe boosts morale
}

export interface ExpeditionDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
  durationMs: number;
  foodCost?: number; // total food items consumed per cycle (drawn from any food resource)
  waterCost?: number; // total water items consumed per cycle
  requiredVessel?: ResourceId;
  requiredBiomes?: BiomeId[]; // must have discovered these biomes to see this expedition
  hideWhenAllFound?: boolean; // hide expedition once all its discoverable biomes have been found
  outcomes: ExpeditionOutcome[];
  xpGain: number;
}

export interface ExpeditionOutcome {
  weight: number; // relative weight for RNG selection
  description: string;
  biomeDiscovery?: BiomeId;
  requiredBiomes?: BiomeId[]; // must have discovered these biomes for this outcome to be possible
  drops?: Drop[];
}

// ═══════════════════════════════════════
// Stations (set-wait-collect passive system)
// ═══════════════════════════════════════

export interface StationDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
  durationMs: number; // time until ready to collect
  requiredTool?: ResourceId; // must own (not consumed)
  requiredSkillLevel?: number;
  requiredBuildings?: BuildingId[];
  setupInputs?: { resourceId: ResourceId; amount: number }[]; // consumed on deploy
  yields: Drop[];
  xpGain: number;
  maxDeployed?: number; // max simultaneous deployments, default 1
}

export interface PlacedStation {
  stationId: string;
  deployedAt: number;
}

export type DiscoveryType = "biome" | "level" | "craft" | "building" | "resource";

export interface DiscoveryEntry {
  id: number;
  type: DiscoveryType;
  message: string;
  timestamp: number;
}

export interface GameState {
  resources: Record<string, number>;
  skills: Record<SkillId, { xp: number; level: number }>;
  discoveredBiomes: BiomeId[];
  buildings: BuildingId[];
  currentAction: {
    actionId: string;
    startedAt: number;
    type: "gather" | "craft" | "expedition";
    recipeId?: string;
    expeditionId?: string;
    foodPaid?: Record<string, number>; // tracks food deducted for refund
    waterPaid?: Record<string, number>; // tracks water deducted for refund
  } | null;
  lastTickAt: number;
  totalPlayTimeMs: number;
  morale: number; // 0-100, affects action speed
  moraleDecayProgressMs: number; // accumulator for gradual morale decay
  discoveryLog: DiscoveryEntry[];
  discoveredResources: string[];
  stations: PlacedStation[];
  seenPhases: string[];
  repetitiveActionCount: number; // consecutive completions since last manual action change
}
