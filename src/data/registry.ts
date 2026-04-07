/**
 * Central game data registry.
 *
 * In the base game, this holds all data from the static files.
 * When a mod is loaded, the registry is swapped wholesale with the mod's data.
 * All engine code and components read from this registry rather than importing
 * data files directly.
 */

import { ACTIONS } from "./actions";
import { BIOMES } from "./biomes";
import { BUILDINGS } from "./buildings";
import { AFFIXES, EQUIPMENT_ITEMS, EQUIPMENT_SLOTS, REPAIR_RECIPES, SALVAGE_TABLES } from "./equipment";
import { EXPEDITIONS, MAINLAND_EXPEDITIONS } from "./expeditions";
import { PHASES } from "./phases";
import { RECIPES } from "./recipes";
import { RESOURCES } from "./resources";
import { SKILLS } from "./skills";
import { STATIONS } from "./stations";
import { TOOLS } from "./tools";
import type {
  ActionDef,
  AffixDef,
  BiomeDef,
  BuildingDef,
  EquipmentItemDef,
  EquipmentSlotDef,
  ExpeditionDef,
  PhaseDef,
  RecipeDef,
  RepairRecipeDef,
  ResourceDef,
  SalvageTableDef,
  SkillDef,
  SkillMilestone,
  StationDef,
  ToolDef,
} from "./types";

// ═══════════════════════════════════════
// Registry shape
// ═══════════════════════════════════════

export interface GameDataPack {
  id: string; // unique mod id ("base" for vanilla)
  name: string;
  version: string;

  resources: Record<string, ResourceDef>;
  tools: Record<string, ToolDef>;
  skills: Record<string, SkillDef>;
  buildings: Record<string, BuildingDef>;
  biomes: Record<string, BiomeDef>;
  phases: PhaseDef[];
  actions: ActionDef[];
  recipes: RecipeDef[];
  expeditions: ExpeditionDef[];
  stations: StationDef[];
  milestones: Partial<Record<string, SkillMilestone[]>>;
  equipmentSlots: Record<string, EquipmentSlotDef>;
  equipmentItems: Record<string, EquipmentItemDef>;
  affixes: Record<string, AffixDef>;
  repairRecipes: RepairRecipeDef[];
  salvageTables: SalvageTableDef[];
}

// ═══════════════════════════════════════
// Build base game pack
// ═══════════════════════════════════════

// We import milestones separately since they have authored + generated parts
import { getMilestones } from "./milestones";

function buildBaseMilestones(): Partial<Record<string, SkillMilestone[]>> {
  const result: Partial<Record<string, SkillMilestone[]>> = {};
  for (const skillId of Object.keys(SKILLS)) {
    const ms = getMilestones(skillId);
    if (ms.length > 0) result[skillId] = ms;
  }
  return result;
}

export function createBaseGamePack(): GameDataPack {
  return {
    id: "base",
    name: "SeaBound",
    version: "1.0.0",
    resources: { ...RESOURCES },
    tools: { ...TOOLS },
    skills: { ...SKILLS },
    buildings: { ...BUILDINGS },
    biomes: { ...BIOMES },
    phases: [...PHASES],
    actions: [...ACTIONS],
    recipes: [...RECIPES],
    expeditions: [...EXPEDITIONS, ...MAINLAND_EXPEDITIONS],
    stations: [...STATIONS],
    milestones: buildBaseMilestones(),
    equipmentSlots: { ...EQUIPMENT_SLOTS },
    equipmentItems: { ...EQUIPMENT_ITEMS },
    affixes: { ...AFFIXES },
    repairRecipes: [...REPAIR_RECIPES],
    salvageTables: [...SALVAGE_TABLES],
  };
}

// ═══════════════════════════════════════
// Singleton registry
// ═══════════════════════════════════════

let _pack: GameDataPack = createBaseGamePack();

// Derived lookup tables (rebuilt on pack swap)
let _actionsByIdCache: Record<string, ActionDef> = {};
let _recipesByIdCache: Record<string, RecipeDef> = {};
let _expeditionsByIdCache: Record<string, ExpeditionDef> = {};
let _stationsByIdCache: Record<string, StationDef> = {};
let _biomeOrderCache: string[] = [];
let _foodValuesCache: { id: string; value: number }[] = [];
let _waterValuesCache: { id: string; value: number }[] = [];

function rebuildCaches(): void {
  _actionsByIdCache = {};
  for (const a of _pack.actions) _actionsByIdCache[a.id] = a;

  _recipesByIdCache = {};
  for (const r of _pack.recipes) _recipesByIdCache[r.id] = r;

  _expeditionsByIdCache = {};
  for (const e of _pack.expeditions) _expeditionsByIdCache[e.id] = e;

  _stationsByIdCache = {};
  for (const s of _pack.stations) _stationsByIdCache[s.id] = s;

  _biomeOrderCache = Object.values(_pack.biomes)
    .sort((a, b) => a.order - b.order)
    .map((b) => b.id);

  // Build food/water value lists from resource definitions, sorted low-value first
  _foodValuesCache = Object.values(_pack.resources)
    .filter((r) => r.foodValue != null && r.foodValue > 0)
    .map((r) => ({ id: r.id, value: r.foodValue! }))
    .sort((a, b) => a.value - b.value);

  _waterValuesCache = Object.values(_pack.resources)
    .filter((r) => r.waterValue != null && r.waterValue > 0)
    .map((r) => ({ id: r.id, value: r.waterValue! }))
    .sort((a, b) => a.value - b.value);
}

// Initial cache build
rebuildCaches();

// ═══════════════════════════════════════
// Public API
// ═══════════════════════════════════════

/** Get the currently active data pack. */
export function getDataPack(): GameDataPack { return _pack; }

/** Swap the entire data pack (e.g. when loading a mod). */
export function setDataPack(pack: GameDataPack): void {
  _pack = pack;
  rebuildCaches();
}

/** Reset to the base game data. */
export function resetToBaseGame(): void {
  setDataPack(createBaseGamePack());
}

// ── Convenience accessors (used by engine code) ──

export function getResources(): Record<string, ResourceDef> { return _pack.resources; }
export function getTools(): Record<string, ToolDef> { return _pack.tools; }
export function getSkills(): Record<string, SkillDef> { return _pack.skills; }
export function getBuildings(): Record<string, BuildingDef> { return _pack.buildings; }
export function getBiomes(): Record<string, BiomeDef> { return _pack.biomes; }
export function getPhases(): PhaseDef[] { return _pack.phases; }
export function getActions(): ActionDef[] { return _pack.actions; }
export function getRecipes(): RecipeDef[] { return _pack.recipes; }
export function getExpeditions(): ExpeditionDef[] { return _pack.expeditions; }
export function getStations(): StationDef[] { return _pack.stations; }
export function getMilestonesForSkill(skillId: string): SkillMilestone[] {
  return _pack.milestones[skillId] ?? [];
}

export function getActionById(id: string): ActionDef | undefined { return _actionsByIdCache[id]; }
export function getRecipeById(id: string): RecipeDef | undefined { return _recipesByIdCache[id]; }
export function getExpeditionById(id: string): ExpeditionDef | undefined { return _expeditionsByIdCache[id]; }
export function getStationById(id: string): StationDef | undefined { return _stationsByIdCache[id]; }

export function getBiomeOrder(): string[] { return _biomeOrderCache; }
export function getFoodValues(): { id: string; value: number }[] { return _foodValuesCache; }
export function getWaterValues(): { id: string; value: number }[] { return _waterValuesCache; }

export function getEquipmentSlots(): Record<string, EquipmentSlotDef> { return _pack.equipmentSlots; }
export function getEquipmentItems(): Record<string, EquipmentItemDef> { return _pack.equipmentItems; }
export function getAffixes(): Record<string, AffixDef> { return _pack.affixes; }
export function getEquipmentItemById(id: string): EquipmentItemDef | undefined { return _pack.equipmentItems[id]; }
export function getAffixById(id: string): AffixDef | undefined { return _pack.affixes[id]; }
export function getRepairRecipes(): RepairRecipeDef[] { return _pack.repairRecipes; }
export function getSalvageTables(): SalvageTableDef[] { return _pack.salvageTables; }
