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
  | "coconut_husk_fiber"
  | "dry_grass"
  | "bow_drill_kit"
  | "bamboo_spear"
  // Crafted
  | "shell_bead"
  // Food
  | "cooked_fish"
  | "cooked_crab";

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

export type BiomeId = "beach" | "coconut_grove" | "bamboo_grove" | "jungle_interior";

export type BuildingId =
  | "camp_fire"
  | "palm_leaf_pile"
  | "drying_rack";

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
  | { type: "duration"; actionId: string; multiplier: number }; // e.g. 0.9 = 10% faster

export interface SkillMilestone {
  level: number;
  description: string;
  hidden?: boolean; // if true, show generic hint until player reaches this level
  effects?: MilestoneEffect[];
}

export interface ActionDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
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
  inputs: { resourceId: ResourceId; amount: number }[];
  output: { resourceId: ResourceId; amount: number };
  durationMs: number;
  requiredSkillLevel?: number;
  requiredItems?: ResourceId[]; // item-trigger: must have this item in inventory
  requiredBuildings?: BuildingId[]; // must have these buildings constructed
  buildingOutput?: BuildingId; // if set, this recipe builds a building instead of producing output resource
  oneTimeCraft?: boolean; // if true, recipe disappears once player owns ≥1 of the output
  repeatable?: boolean; // if true, auto-repeats until inputs run out (like gathering actions)
  xpGain: number;
}

export interface ExpeditionDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
  durationMs: number;
  foodCost?: number; // total food items consumed per cycle (drawn from any food resource)
  requiredVessel?: ResourceId;
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
  } | null;
  lastTickAt: number;
  totalPlayTimeMs: number;
  discoveryLog: DiscoveryEntry[];
  discoveredResources: string[];
}
