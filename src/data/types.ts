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
  | "large_shell"
  // Phase 1b - Fire
  | "dry_grass"
  // Food
  | "large_fish"
  | "cooked_fish"
  | "cooked_crab"
  | "cooked_large_fish"
  // Seeds & Farming
  | "wild_seed"
  | "root_vegetable"
  | "cooked_root_vegetable"
  | "taro_corm"
  | "taro_root"
  | "cooked_taro"
  | "banana_shoot"
  | "banana"
  | "breadfruit_cutting"
  | "breadfruit"
  | "roasted_breadfruit"
  | "voyage_provisions"
  // Obsidian
  | "obsidian"
  // Stone Tools
  | "chert"
  | "stone_flake"
  | "stone_blade"
  // Timber
  | "large_log"
  | "charred_log"
  | "shaped_hull"
  // Water
  | "fresh_water"
  // Phase 2 - Clay Tier
  | "clay"
  | "shaped_clay_pot"
  | "fired_clay_pot"
  | "sealed_clay_jar";

export type ToolId =
  | "bamboo_knife"
  | "bow_drill_kit"
  | "bamboo_spear"
  | "hammerstone"
  | "shell_adze"
  | "stone_axe"
  | "obsidian_blade"
  | "gorge_hook"
  | "basket_trap"
  | "crucible"
  | "digging_stick";

export type SkillId =
  | "foraging"
  | "fishing"
  | "woodworking"
  | "crafting"
  | "cooking"
  | "weaving"
  | "construction"
  | "farming"
  | "navigation";

export type BiomeId = "beach" | "coconut_grove" | "rocky_shore" | "bamboo_grove" | "jungle_interior" | "nearby_island";

export type BuildingId =
  | "camp_fire"
  | "stone_hearth"
  | "palm_leaf_pile"
  | "drying_rack"
  | "fenced_perimeter"
  | "firing_pit"
  | "kiln"
  | "fiber_loom"
  | "raft"
  | "dugout"
  | "woven_basket"
  | "cleared_plot"
  | "tended_garden"
  | "farm_plot"
  | "well";

export interface StorageBonus {
  tag?: string; // if set, item must have this tag
  excludeTags?: string[]; // if set, item must NOT have any of these tags
  amount: number; // extra storage slots per item matching this filter
}

export interface BuildingDef {
  id: BuildingId;
  name: string;
  description: string;
  unlocks: string; // human-readable description of what this building enables
  storageBonus?: StorageBonus[];
  maxCount?: number; // if set, this building can be built multiple times (default 1)
}

export interface ToolSpeedBonus {
  actionIds?: string[];  // gathering actions sped up
  recipeIds?: string[];  // recipes sped up
  multiplier: number;    // e.g. 0.85 = 15% faster
}

export interface ToolOutputBonus {
  recipeIds: string[];  // recipes that get bonus output
  chance: number;       // e.g. 0.30 = 30% chance for +1 output per craft
}

export interface ToolDef {
  id: ToolId;
  name: string;
  description: string;
  speedBonus?: ToolSpeedBonus;
  outputBonus?: ToolOutputBonus;
}

export interface ResourceDef {
  id: ResourceId;
  name: string;
  description: string;
  tags?: string[]; // e.g. ["food"], ["large"], ["food", "large"], ["dried"]
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

export type ContentPanel = "gather" | "craft" | "build";

export interface ActionDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
  panel: ContentPanel;
  durationMs: number;
  drops: Drop[];
  requiredSkillLevel?: number;
  requiredTools?: ToolId[];
  requiredResources?: ResourceId[]; // must own (not consumed) — for non-tool resource gates
  requiredBiome?: BiomeId;
  requiredBuildings?: BuildingId[];
  xpGain: number;
}

export interface RecipeInput {
  resourceId: ResourceId;
  amount: number;
  removedByBuilding?: BuildingId; // input is skipped when player has this building
}

export interface RecipeDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
  panel: ContentPanel;
  inputs: RecipeInput[];
  output?: { resourceId: ResourceId; amount: number };
  toolOutput?: ToolId; // if set, crafting grants this tool instead of a resource
  durationMs: number;
  requiredSkillLevel?: number;
  requiredSkills?: { skillId: SkillId; level: number }[]; // dual-skill gates
  requiredTools?: ToolId[]; // must own tool (not consumed)
  requiredItems?: ResourceId[]; // item-trigger: must have this item in inventory
  requiredBuildings?: BuildingId[]; // must have these buildings constructed
  buildingOutput?: BuildingId; // if set, this recipe builds a building instead of producing output resource
  replacesBuilding?: BuildingId; // if set, one instance of this building is consumed when buildingOutput is added (upgrade)
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
  requiredVessel?: BuildingId;
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
  requiredTool?: ToolId; // must own (not consumed)
  requiredSkillLevel?: number;
  requiredBuildings?: BuildingId[];
  setupInputs?: { resourceId: ResourceId; amount: number }[]; // consumed on deploy
  yields: Drop[];
  xpGain: number;
  maxDeployed?: number; // max simultaneous deployments, default 1
  maxDeployedPerBuildings?: BuildingId[]; // if set, max deployed = total count of these buildings owned
}

export interface PlacedStation {
  stationId: string;
  deployedAt: number;
}

export type DiscoveryType = "biome" | "level" | "craft" | "building" | "resource" | "tool";

export interface DiscoveryEntry {
  id: number;
  type: DiscoveryType;
  message: string;
  timestamp: number;
}

export interface GameState {
  resources: Record<string, number>;
  tools: ToolId[];
  skills: Record<SkillId, { xp: number; level: number }>;
  discoveredBiomes: BiomeId[];
  buildings: BuildingId[];
  currentAction: {
    actionId: string;
    startedAt: number;
    type: "gather" | "craft" | "expedition";
    recipeId?: string;
    expeditionId?: string;
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
