// ═══════════════════════════════════════
// ID types — string aliases for moddability
// ═══════════════════════════════════════
// These were previously string literal unions. Now plain strings so mods
// can introduce arbitrary new IDs. The base-game data files still use the
// same IDs, and runtime validation catches bad references.

export type ResourceId = string;
export type ToolId = string;
export type SkillId = string;
export type BiomeId = string;
export type BuildingId = string;

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
  maxCountBonuses?: { buildingId: BuildingId; amount: number }[]; // increases maxCount of other stackable buildings
  vesselTier?: number; // if set, this building is a vessel; higher tiers satisfy lower-tier requirements
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
  foodValue?: number; // if set, this resource counts as food with this value
  waterValue?: number; // if set, this resource counts as water with this value
}

export interface SkillDef {
  id: SkillId;
  name: string;
  description: string;
}

export interface BiomeDef {
  id: BiomeId;
  name: string;
  description?: string;
  order: number; // display order in gather panel
  startingBiome?: boolean; // if true, player starts with this biome discovered
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
  | { type: "duration"; actionId: string; multiplier: number } // e.g. 0.9 = 10% faster; actionId "*" = all actions in this skill
  | { type: "double_output"; chance: number; recipeId?: string } // e.g. 0.05 = 5% chance to double craft output; recipeId scopes to one recipe
  | { type: "station_input_reduce"; stationId: string; resourceId: ResourceId; newAmount: number } // reduce setup input cost
  | { type: "station_guaranteed_drop"; stationId: string; resourceId: ResourceId; minAmount: number } // guarantee minimum drop
  | { type: "expedition_biome_bonus"; bonus: number } // flat weight bonus added to undiscovered biome outcomes
  | { type: "expedition_drop_bonus"; bonus: number }; // e.g. 0.15 = +15% expedition drop amounts (rounded)

export interface SkillMilestone {
  level: number;
  description: string;
  hidden?: boolean; // if true, show generic hint until player reaches this level
  effects?: MilestoneEffect[];
}

// ═══════════════════════════════════════
// Game Phases (data-driven)
// ═══════════════════════════════════════

export type PhaseConditionType = "has_resource" | "has_building" | "has_biome" | "has_tool";

export interface PhaseCondition {
  type: PhaseConditionType;
  id: string; // resourceId, buildingId, biomeId, or toolId
}

export interface PhaseDef {
  id: string;
  name: string;
  tagline: string;
  order: number; // higher = later phase; getCurrentPhase returns highest matching
  conditions: PhaseCondition[]; // ANY of these triggers the phase (OR logic)
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

/** A tag-based input: consume `count` distinct resources with the given tag, 1 each. */
export interface TagInput {
  tag: string;       // resource tag, e.g. "food"
  count: number;     // how many distinct tagged resources are needed
}

export interface RecipeDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
  panel: ContentPanel;
  inputs: RecipeInput[];
  tagInputs?: TagInput[]; // tag-based inputs (e.g. "5 different foods")
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
  /** Hide this recipe when ALL conditions are met. Used for progression replacements. */
  hideWhen?: RecipeHideCondition[];
}

export type RecipeHideCondition =
  | { type: "has_building"; buildingId: BuildingId }
  | { type: "has_tool"; toolId: ToolId }
  | { type: "output_no_use" }; // hide when the output resource has no remaining use

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
    fullAtStart?: string[]; // resource IDs already at cap when action began
  } | null;
  stopWhenFull?: boolean;
  lastTickAt: number;
  totalPlayTimeMs: number;
  morale: number; // 0-100, affects action speed
  moraleDecayProgressMs: number; // accumulator for gradual morale decay
  discoveryLog: DiscoveryEntry[];
  discoveredResources: string[];
  stations: PlacedStation[];
  seenPhases: string[];
  repetitiveActionCount: number; // consecutive completions since last manual action change
  savedActionProgress: Record<string, number>; // saved elapsed ms per action key, preserved across switches
  completedActions: string[]; // action IDs the player has completed at least once
  completedRecipes: string[]; // recipe IDs the player has completed at least once
  expeditionPity: Record<string, number>; // consecutive no-biome-discovery attempts per expedition
  modId?: string; // if set, this save belongs to a specific mod
}
