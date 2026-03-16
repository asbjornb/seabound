export type ResourceId =
  // Phase 0 - Bare Hands
  | "coconut"
  | "coconut_husk"
  | "driftwood_branch"
  | "round_stone"
  | "flat_stone"
  | "vine"
  | "palm_frond"
  | "small_fish"
  | "crab"
  | "shell"
  // Phase 1 - Bamboo Tier
  | "bamboo_cane"
  | "bamboo_splinter"
  | "bamboo_strip"
  | "rough_fiber"
  | "rough_cordage"
  | "dried_fiber"
  | "cordage"
  | "bamboo_knife"
  | "shell_scraper"
  | "large_shell"
  // Phase 1b - Fire
  | "coconut_husk_fiber"
  | "dry_grass"
  | "bow_drill_kit"
  | "bamboo_spear"
  | "digging_stick"
  // Food
  | "cooked_fish"
  | "cooked_crab";

export type SkillId =
  | "foraging"
  | "fishing"
  | "woodworking"
  | "crafting"
  | "weaving"
  | "construction"
  | "farming"
  | "navigation"
  | "preservation";

export type BiomeId = "beach" | "bamboo_grove" | "jungle_interior";

export interface ResourceDef {
  id: ResourceId;
  name: string;
  description: string;
  category: "raw" | "processed" | "tool" | "food" | "structure";
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
  xpGain: number;
}

export interface ExpeditionDef {
  id: string;
  name: string;
  description: string;
  durationMs: number;
  foodCost?: { resourceId: ResourceId; amount: number }[];
  requiredVessel?: ResourceId;
  outcomes: ExpeditionOutcome[];
}

export interface ExpeditionOutcome {
  weight: number; // relative weight for RNG selection
  description: string;
  biomeDiscovery?: BiomeId;
  drops?: Drop[];
}

export interface GameState {
  resources: Record<string, number>;
  skills: Record<SkillId, { xp: number; level: number }>;
  discoveredBiomes: BiomeId[];
  currentAction: {
    actionId: string;
    startedAt: number;
    type: "gather" | "craft" | "expedition";
    recipeId?: string;
    expeditionId?: string;
  } | null;
  lastTickAt: number;
  totalPlayTimeMs: number;
}
