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
  maxCountGroup?: string; // if set, buildings sharing this group pool their counts toward maxCount
  maxCountBonuses?: { buildingId: BuildingId; amount: number }[]; // increases maxCount of other stackable buildings
  vesselTier?: number; // if set, this building is a vessel; higher tiers satisfy lower-tier requirements
  comfortDecayReduction?: number; // 0-1, fraction by which morale decay is slowed (e.g. 0.2 = 20% slower decay)
  expeditionSpeedBonus?: { skillId: SkillId; multiplier: number }; // e.g. { skillId: "navigation", multiplier: 0.9 } = 10% faster nav expeditions
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
  storageCapGroup?: string; // if set, resources with the same group share a combined storage cap
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

/** A loot table entry — rolled independently on each expedition completion. */
export interface LootDrop {
  resourceId: ResourceId;
  amount: number;
  chance: number; // 0-1 base probability
}

// ═══════════════════════════════════════
// Skill Milestones
// ═══════════════════════════════════════

export type MilestoneEffect =
  | { type: "drop_chance"; actionId: string; resourceId: ResourceId; bonus: number }
  | { type: "duration"; actionId: string; multiplier: number } // e.g. 0.9 = 10% faster; actionId "*" = all actions in this skill
  | { type: "double_output"; chance: number; recipeId?: string } // e.g. 0.05 = 5% chance to double craft output; recipeId scopes to one recipe
  | { type: "output_chance_bonus"; recipeId: string; bonus: number } // increase outputChance (e.g. 0.15 raises 0.85 to 1.0)
  | { type: "station_input_reduce"; stationId: string; resourceId: ResourceId; newAmount: number } // reduce setup input cost
  | { type: "station_guaranteed_drop"; stationId: string; resourceId: ResourceId; minAmount: number } // guarantee minimum drop
  | { type: "expedition_biome_bonus"; bonus: number } // flat weight bonus added to undiscovered biome outcomes
  | { type: "expedition_drop_bonus"; bonus: number } // e.g. 0.15 = +15% expedition drop amounts (rounded)
  | { type: "expedition_loot_chance"; bonus: number } // e.g. 0.10 = +10% loot table drop chance
  | { type: "combat_stat_bonus"; stat: string; bonus: number }; // flat bonus to a combat stat during encounter resolution

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

// ═══════════════════════════════════════
// Equipment System
// ═══════════════════════════════════════

export type EquipmentSlotId = string;

export interface EquipmentSlotDef {
  id: EquipmentSlotId;
  name: string;
  description: string;
  order: number; // display order in loadout UI
}

/** A stat modifier on an equipment item — either base or from an affix. */
export interface StatModifier {
  stat: string; // e.g. "offense", "defense", "endurance"
  value: number; // flat bonus (can be negative for penalties)
}

export interface AffixDef {
  id: string;
  name: string;
  family: string; // grouping for UI and roll exclusion (e.g. "terrain", "offense")
  description: string;
  modifiers: StatModifier[];
  /** Bounded roll range — actual values scale linearly between min and max tier. */
  rollRange?: { min: number; max: number }; // multiplied against modifier values
  /** If set, affix can only appear on items in these slots. */
  allowedSlots?: EquipmentSlotId[];
  /** If set, this affix only rolls on items dropped from this expedition. */
  expeditionOnly?: string;
  /** If true, this affix can roll on forged/crafted equipment (small curated pool). */
  forgeEligible?: boolean;
}

export type ItemCondition = "pristine" | "worn" | "damaged" | "broken";

/** Stat multiplier per condition. Broken items can't be equipped at all. */
export const CONDITION_STAT_MULTIPLIER: Record<ItemCondition, number> = {
  pristine: 1.0,
  worn: 0.8,
  damaged: 0.5,
  broken: 0,
};

export interface EquipmentItemDef {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlotId;
  /** Base stats before affixes. */
  baseStats: StatModifier[];
  /** Required skill levels to equip (e.g. combat 5). */
  requiredSkills?: { skillId: SkillId; level: number }[];
  /** Material tier — higher tiers are generally stronger and harder to obtain. */
  tier: number;
  /** If true, this is a unique item with fixed affixes (not randomly rolled). */
  unique?: boolean;
  /** Fixed affixes for unique items — used instead of random rolling. */
  fixedAffixes?: { affixId: string; rollValue: number }[];
  /** Max number of affix slots on this item (rolled affixes fill these). */
  maxAffixes: number;
  /** Tags for filtering/categorization (e.g. "metal", "leather", "weapon"). */
  tags?: string[];
}

/** A concrete equipment item instance in a player's inventory. */
export interface EquipmentItem {
  /** Unique instance ID (generated at drop/craft time). */
  instanceId: string;
  /** Reference to the base item definition. */
  defId: string;
  /** Rolled affixes on this specific item. */
  affixes: { affixId: string; rollValue: number }[]; // rollValue 0-1 within rollRange
  /** Current condition. Broken items cannot be equipped. */
  condition: ItemCondition;
  /** If set, this item has been permanently imbued with a single stat bonus. One per item, ever. */
  imbued?: { reagentId: string; stat: string; value: number };
}

/** Player's equipped loadout — one item per slot. */
export type Loadout = Record<EquipmentSlotId, string | null>; // maps slot → instanceId or null

/** A recipe for repairing equipment — improves condition by one step. */
export interface RepairRecipeDef {
  id: string;
  name: string;
  description: string;
  /** Equipment tags this recipe applies to (e.g. "metal", "hide"). */
  targetTags: string[];
  /** Base materials consumed. */
  inputs: RecipeInput[];
  /** Minimum smithing level required. */
  requiredSkillLevel: number;
  /** Required buildings to perform repair. */
  requiredBuildings?: BuildingId[];
  /** Smithing XP gained per repair. */
  xpGain: number;
}

/** An entry in a salvage table — a material returned when salvaging gear. */
export interface SalvageOutput {
  resourceId: ResourceId;
  /** Base amount returned (scaled by condition). */
  amount: number;
  /** Chance this output is included (0-1, defaults to 1). */
  chance?: number;
}

/** A salvage table — defines what's returned when breaking down equipment. */
export interface SalvageTableDef {
  id: string;
  name: string;
  description: string;
  /** Equipment tags this table applies to (e.g. "metal", "hide"). */
  targetTags: string[];
  /** Base material outputs. */
  outputs: SalvageOutput[];
  /** Bonus affix reagent outputs when the item has affixes. One rolled per affix on the item. */
  affixReagentOutputs?: { affixFamily: string; resourceId: ResourceId; chance: number }[];
  /** Minimum smithing level required. */
  requiredSkillLevel: number;
  /** Smithing XP gained per salvage. */
  xpGain: number;
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
  /** If true, action disappears once the player owns ≥1 of any drop resource. */
  oneTimeAction?: boolean;
  /** Hide this action when ALL conditions are met. Used for progression replacements. */
  hideWhen?: RecipeHideCondition[];
}

export interface RecipeInput {
  resourceId: ResourceId;
  amount: number;
  removedByBuilding?: BuildingId; // input is skipped when player has this building
  alternateResourceId?: ResourceId; // if set, this resource can be used instead of resourceId
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
  outputChance?: number; // 0-1, chance the output is produced (inputs always consumed). Defaults to 1.
  toolOutput?: ToolId; // if set, crafting grants this tool instead of a resource
  equipmentOutput?: string; // if set, crafting grants this equipment item (defId) in pristine condition
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
  noDoubleOutput?: boolean; // if true, skip milestone/tool double-output rolls (e.g. 1 pot → 1 water, not 2)
  /** Hide this recipe when ALL conditions are met. Used for progression replacements. */
  hideWhen?: RecipeHideCondition[];
}

export type RecipeHideCondition =
  | { type: "has_building"; buildingId: BuildingId }
  | { type: "has_tool"; toolId: ToolId }
  | { type: "has_biome"; biomeId: BiomeId }
  | { type: "output_no_use" }; // hide when the output resource has no remaining use

// ═══════════════════════════════════════
// Expedition Combat — Difficulty Profiles
// ═══════════════════════════════════════

/** Hazard categories that an expedition can present (thematic, used for hints/UI). */
export type HazardType =
  | "heat"       // volcanic, desert — mitigated by heatResist
  | "cold"       // alpine, night exposure — mitigated by coldResist
  | "wet"        // rain, river crossings — mitigated by wetResist
  | "wildlife"   // animal encounters — mitigated by offense + defense
  | "terrain"    // rough ground, cliffs — mitigated by speed + endurance
  | "endurance"; // long treks, attrition — mitigated by endurance + comfort

/**
 * Enemy combat profile for round-based combat simulation.
 * Each expedition with a difficulty defines an enemy the player fights.
 */
export interface EnemyCombatProfile {
  /** Display name of the enemy. */
  name: string;
  /** Enemy hit points — must be reduced to 0 to win. */
  hp: number;
  /** Base damage per enemy hit. */
  damage: number;
  /** Enemy attacks per round (1.0 = one hit per round). */
  attackSpeed: number;
  /** Enemy defense — reduces player's physical damage. */
  defense: number;
  /**
   * How the enemy's damage is split across types. Fractions should sum to 1.0.
   * Physical is reduced by player defense, others by matching resist stats.
   * Defaults to { physical: 1.0 } if omitted.
   */
  damageTypes?: {
    physical?: number;
    heat?: number;
    cold?: number;
    wet?: number;
  };
}

/**
 * A stage within a multi-stage combat expedition.
 * Each stage has its own enemy and reward pool. HP carries over between stages.
 */
export interface CombatStage {
  /** Display name for this stage (e.g. "Crumbling Walls", "Feral Boar"). */
  name: string;
  /** The enemy to fight in this stage. */
  enemy: EnemyCombatProfile;
  /** Resource drops awarded for clearing this stage. Each Drop can be guaranteed (no chance) or chance-based. */
  drops?: Drop[];
  /** Equipment that can drop when this stage is cleared. */
  equipmentDrops?: EquipmentDropEntry[];
  /** Loot table entries available after clearing this stage. */
  lootTable?: LootDrop[];
  /** Biome discovered on clearing this stage, rolled with pity carryover. */
  biomeDiscovery?: BiomeId;
  /** Base probability of discovering the biome on clear (0-1, defaults to 1). */
  biomeDiscoveryChance?: number;
  /** Biome discovery only fires if all listed biomes are already discovered. */
  biomeDiscoveryRequires?: BiomeId[];
}

/** Difficulty profile for a mainland combat expedition. */
export interface ExpeditionDifficultyProfile {
  /** Primary hazard types present in this expedition (thematic). */
  hazards: HazardType[];
  /** The enemy the player fights — used when stages is not defined. */
  enemy?: EnemyCombatProfile;
  /**
   * Multi-stage encounter. If set, the player fights each stage sequentially
   * with HP carrying over. Rewards are distributed per-stage cleared.
   * When present, the top-level `enemy` is ignored.
   */
  stages?: CombatStage[];
  /** Brief hint shown before departure (e.g. "Bring heat-resistant gear and a sturdy weapon"). */
  hint: string;
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
  inputs?: { resourceId: ResourceId; amount: number }[]; // consumed each cycle (e.g. voyage provisions)
  outcomes: ExpeditionOutcome[];
  xpGain: number;
  victory?: boolean; // if true, completing this expedition wins the game
  /** If true, this expedition is only available after mainland is unlocked. */
  mainland?: boolean;
  /** Combat difficulty profile — present on mainland expeditions with hazard/gear checks. */
  difficulty?: ExpeditionDifficultyProfile;
  /** Equipment drops that can be awarded on success (separate from resource drops). */
  equipmentDrops?: EquipmentDropEntry[];
  /** Loot table — rolled independently from outcomes. Each entry has its own drop chance and rarity. */
  lootTable?: LootDrop[];
}

/** An equipment item that can drop from an expedition outcome. */
export interface EquipmentDropEntry {
  /** Base item definition ID. */
  defId: string;
  /** Chance this item drops (0-1). */
  chance: number;
  /** If true, the item drops in broken condition requiring repair. */
  dropsAsBroken?: boolean;
  /** Min/max number of affixes rolled on the dropped item. */
  affixRange?: { min: number; max: number };
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
  requiredBiomes?: BiomeId[]; // must have discovered these biomes to deploy
  setupInputs?: { resourceId: ResourceId; amount: number }[]; // consumed on deploy
  yields: Drop[];
  xpGain: number;
  maxDeployed?: number; // max simultaneous deployments, default 1
  maxDeployedPerBuildings?: BuildingId[]; // if set, max deployed = total count of these buildings owned
  /** If set, collecting this station advances chart progress toward discovering this biome. */
  chartBiome?: BiomeId;
  /** Progress increment per collection (0-1, e.g. 0.05 = 5%). Required if chartBiome is set. */
  chartIncrement?: number;
}

export interface PlacedStation {
  stationId: string;
  deployedAt: number;
}

// ═══════════════════════════════════════
// Action Queue (simple next-action queue)
// ═══════════════════════════════════════

export interface QueuedAction {
  actionId: string;
  actionType: "gather" | "craft" | "expedition" | "routine";
}

// ═══════════════════════════════════════
// Routines (automation chains)
// ═══════════════════════════════════════

export interface RoutineStep {
  actionId: string;
  actionType: "gather" | "craft" | "expedition";
  count: number; // 0 = run until natural stop, >0 = stop after N completions
}

export interface Routine {
  id: string;
  name: string;
  steps: RoutineStep[];
}

export interface RoutineProgress {
  routineId: string;
  currentStep: number;
  completionsInStep: number;
}

// ═══════════════════════════════════════
// Combat Log (per-expedition detailed logs)
// ═══════════════════════════════════════

export interface CombatLogEntry {
  id: number;
  timestamp: number;
  expeditionId: string;
  expeditionName: string;
  /** Overall encounter grade. */
  grade: "success" | "partial" | "failure";
  /** Enemy name fought. */
  enemyName: string;
  /** Combat simulation summary. */
  roundsFought: number;
  playerHpStart: number;
  playerHpEnd: number;
  enemyHpStart: number;
  enemyHpEnd: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  critsLanded: number;
  dodges: number;
  /** Estimated overall success probability before rolling (0-1). */
  estimatedWinRate: number;
  /** Multipliers applied to drops and XP. */
  dropMultiplier: number;
  xpMultiplier: number;
  /** Human-readable failure hints (empty on success). */
  failureInsights: string[];
  /** Resources gained (after multipliers). */
  drops: { name: string; amount: number }[];
  /** XP earned. */
  xpGain: number;
  /** Equipment items found. */
  equipmentDropped?: { defId: string; name: string; condition: string }[];
  /** Outcome flavor text. */
  outcomeMessage?: string;
  /** Number of stages cleared in a multi-stage expedition (0 = failed at stage 1). */
  stagesCleared?: number;
  /** Total number of stages in the expedition (undefined for non-staged). */
  totalStages?: number;
}

// ═══════════════════════════════════════
// Discovery Log
// ═══════════════════════════════════════

export type DiscoveryType = "biome" | "level" | "craft" | "building" | "resource" | "tool" | "lore" | "tip" | "expedition" | "equipment";

export interface DiscoveryEntry {
  id: number;
  type: DiscoveryType;
  message: string;
  timestamp: number;
  /** For biome discoveries, the biome ID (used by the discovery modal) */
  biomeId?: BiomeId;
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
  /** @deprecated No longer used — stop-when-full is always enforced. Kept for save compat. */
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
  lastSeenDiscoveryId: number; // highest discovery ID the player has seen (for toast dedup)
  actionCompletions: number; // total action/craft/expedition completions (engagement proxy)
  actionCompletionCounts: Record<string, number>; // completion counts keyed by `${type}:${id}`
  seenLoreNotes: string[]; // IDs of ambient lore notes already shown
  activePlayTimeMs: number; // playtime accumulated only while tab is visible
  sentMilestones: string[]; // analytics milestone IDs already sent (dedup)
  victory?: boolean; // true when the player has won (completed a victory expedition)
  mainlandUnlocked?: boolean; // true when player opts into experimental mainland content post-victory
  mainlandVersion?: number; // experimental version marker — bumped when mainland format changes, triggers reset
  modId?: string; // if set, this save belongs to a specific mod
  routines: Routine[];
  activeRoutine: RoutineProgress | null;
  actionQueue: QueuedAction[];
  queueMode: boolean;

  // Equipment system (mainland)
  equipmentInventory: EquipmentItem[];
  loadout: Loadout;

  // Detailed per-expedition combat logs (mainland)
  combatLog: CombatLogEntry[];

  // Loot drop collection log — tracks rare+ drops found
  lootLog: Record<string, { count: number; firstFound: number }>;

  // Resource IDs the player has manually hidden in the resource panel stash drawer
  stashedResources: string[];

  // Cartographer's table — cumulative chart progress toward biome discoveries (0.0 to 1.0)
  chartProgress: Record<string, number>;
}
