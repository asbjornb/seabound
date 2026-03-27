/**
 * DataPack: a swappable bundle of all game data.
 *
 * The engine and UI read game content through getDataPack() / getPackLookups()
 * instead of importing data files directly. This allows the entire data set
 * to be replaced at runtime (e.g. for mods).
 */

import {
  ActionDef,
  BuildingDef,
  ExpeditionDef,
  RecipeDef,
  ResourceDef,
  SkillDef,
  SkillMilestone,
  StationDef,
  ToolDef,
} from "./types";
import { ACTIONS } from "./actions";
import { BUILDINGS } from "./buildings";
import { EXPEDITIONS } from "./expeditions";
import { AUTHORED_MILESTONES } from "./milestones";
import { RECIPES } from "./recipes";
import { RESOURCES } from "./resources";
import { SKILLS, xpForLevel, levelFromXp } from "./skills";
import { STATIONS } from "./stations";
import { TOOLS } from "./tools";

// ═══════════════════════════════════════
// DataPack type
// ═══════════════════════════════════════

export interface DataPack {
  /** Unique identifier for this pack (e.g. "default", or a hash for custom packs). */
  id: string;
  /** Human-readable name. */
  name: string;

  // Core definitions
  resources: Record<string, ResourceDef>;
  skills: Record<string, SkillDef>;
  tools: Record<string, ToolDef>;
  buildings: Record<string, BuildingDef>;
  actions: ActionDef[];
  recipes: RecipeDef[];
  expeditions: ExpeditionDef[];
  stations: StationDef[];

  /** Authored skill milestones keyed by skill ID. */
  milestones: Partial<Record<string, SkillMilestone[]>>;

  // Config values (previously hardcoded in gameState.ts)
  foodValues: { id: string; value: number }[];
  waterValues: { id: string; value: number }[];
  /** Vessel building IDs in ascending tier order. Higher tier satisfies lower. */
  vesselTiers: string[];
  /** Biomes the player starts with discovered. */
  startingBiomes: string[];
  /** Phase ID the player starts having seen. */
  startingPhase: string;
  /** Default per-item storage limit before building bonuses. */
  baseStorageLimit: number;

  // XP formula
  xpForLevel: (level: number) => number;
  levelFromXp: (xp: number) => number;
}

// ═══════════════════════════════════════
// Computed lookups (rebuilt when pack changes)
// ═══════════════════════════════════════

export interface PackLookups {
  actionsByID: Record<string, ActionDef>;
  recipesByID: Record<string, RecipeDef>;
  expeditionsByID: Record<string, ExpeditionDef>;
  stationsByID: Record<string, StationDef>;
  toolSpeedMap: Map<string, { toolId: string; multiplier: number }[]>;
  toolOutputMap: Map<string, { toolId: string; chance: number }[]>;
}

function buildLookups(pack: DataPack): PackLookups {
  const actionsByID: Record<string, ActionDef> = {};
  for (const a of pack.actions) actionsByID[a.id] = a;

  const recipesByID: Record<string, RecipeDef> = {};
  for (const r of pack.recipes) recipesByID[r.id] = r;

  const expeditionsByID: Record<string, ExpeditionDef> = {};
  for (const e of pack.expeditions) expeditionsByID[e.id] = e;

  const stationsByID: Record<string, StationDef> = {};
  for (const s of pack.stations) stationsByID[s.id] = s;

  const toolSpeedMap = new Map<
    string,
    { toolId: string; multiplier: number }[]
  >();
  for (const t of Object.values(pack.tools)) {
    if (!t.speedBonus) continue;
    const ids = [
      ...(t.speedBonus.actionIds ?? []),
      ...(t.speedBonus.recipeIds ?? []),
    ];
    for (const id of ids) {
      const existing = toolSpeedMap.get(id) ?? [];
      existing.push({ toolId: t.id, multiplier: t.speedBonus.multiplier });
      toolSpeedMap.set(id, existing);
    }
  }

  const toolOutputMap = new Map<
    string,
    { toolId: string; chance: number }[]
  >();
  for (const t of Object.values(pack.tools)) {
    if (!t.outputBonus) continue;
    for (const id of t.outputBonus.recipeIds) {
      const existing = toolOutputMap.get(id) ?? [];
      existing.push({ toolId: t.id, chance: t.outputBonus.chance });
      toolOutputMap.set(id, existing);
    }
  }

  return {
    actionsByID,
    recipesByID,
    expeditionsByID,
    stationsByID,
    toolSpeedMap,
    toolOutputMap,
  };
}

// ═══════════════════════════════════════
// Default data pack
// ═══════════════════════════════════════

export function buildDefaultDataPack(): DataPack {
  return {
    id: "default",
    name: "SeaBound",
    resources: RESOURCES,
    skills: SKILLS,
    tools: TOOLS,
    buildings: BUILDINGS,
    actions: ACTIONS,
    recipes: RECIPES,
    expeditions: EXPEDITIONS,
    stations: STATIONS,
    milestones: AUTHORED_MILESTONES,
    foodValues: [
      { id: "coconut", value: 1 },
      { id: "small_fish", value: 1 },
      { id: "crab", value: 1 },
      { id: "root_vegetable", value: 1 },
      { id: "large_fish", value: 2 },
      { id: "cooked_fish", value: 2 },
      { id: "cooked_crab", value: 2 },
      { id: "cooked_root_vegetable", value: 2 },
      { id: "banana", value: 2 },
      { id: "cooked_taro", value: 3 },
      { id: "cooked_large_fish", value: 4 },
      { id: "roasted_breadfruit", value: 4 },
      { id: "voyage_provisions", value: 8 },
    ],
    waterValues: [{ id: "fresh_water", value: 1 }],
    vesselTiers: ["raft", "dugout"],
    startingBiomes: ["beach"],
    startingPhase: "bare_hands",
    baseStorageLimit: 10,
    xpForLevel,
    levelFromXp,
  };
}

// ═══════════════════════════════════════
// Module-level active pack + accessors
// ═══════════════════════════════════════

// Lazy-initialized to avoid circular dependency issues at module load time.
// Both milestones.ts and dataPack.ts import from each other, but the circular
// reference is safe because milestones.ts only calls getDataPack() inside
// functions (never at top level), and by the time any function runs, both
// modules have finished initializing.
let _pack: DataPack | null = null;
let _lookups: PackLookups | null = null;

function ensureInitialized(): void {
  if (!_pack) {
    _pack = buildDefaultDataPack();
    _lookups = buildLookups(_pack);
  }
}

/** Get the currently active data pack. */
export function getDataPack(): DataPack {
  ensureInitialized();
  return _pack!;
}

/** Get computed lookup tables for the active pack. */
export function getPackLookups(): PackLookups {
  ensureInitialized();
  return _lookups!;
}

/** Replace the active data pack (e.g. when loading a mod). Rebuilds all lookups. */
export function setDataPack(pack: DataPack): void {
  _pack = pack;
  _lookups = buildLookups(pack);
}
