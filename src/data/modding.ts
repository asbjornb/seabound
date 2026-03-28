/**
 * Mod system: export, import, validate, and manage game data packs.
 */

import type { GameDataPack } from "./registry";
import { createBaseGamePack, getDataPack, setDataPack } from "./registry";

// ═══════════════════════════════════════
// Export
// ═══════════════════════════════════════

/** Export the current data pack as a downloadable JSON file. */
export function exportModPack(): void {
  const pack = getDataPack();
  const json = JSON.stringify(pack, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `seabound-mod-${pack.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════
// Validation
// ═══════════════════════════════════════

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Validate a data pack for structural correctness and referential integrity. */
export function validateModPack(pack: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pack || typeof pack !== "object") {
    return { valid: false, errors: ["Pack is not a valid object"], warnings };
  }

  const p = pack as Partial<GameDataPack>;

  // Required top-level fields
  if (!p.id || typeof p.id !== "string") errors.push("Missing or invalid 'id'");
  if (!p.name || typeof p.name !== "string") errors.push("Missing or invalid 'name'");
  if (!p.version || typeof p.version !== "string") errors.push("Missing or invalid 'version'");

  // Required data arrays/objects
  if (!p.resources || typeof p.resources !== "object") errors.push("Missing 'resources' object");
  if (!p.tools || typeof p.tools !== "object") errors.push("Missing 'tools' object");
  if (!p.skills || typeof p.skills !== "object") errors.push("Missing 'skills' object");
  if (!p.buildings || typeof p.buildings !== "object") errors.push("Missing 'buildings' object");
  if (!p.biomes || typeof p.biomes !== "object") errors.push("Missing 'biomes' object");
  if (!Array.isArray(p.phases)) errors.push("Missing 'phases' array");
  if (!Array.isArray(p.actions)) errors.push("Missing 'actions' array");
  if (!Array.isArray(p.recipes)) errors.push("Missing 'recipes' array");
  if (!Array.isArray(p.expeditions)) errors.push("Missing 'expeditions' array");
  if (!Array.isArray(p.stations)) errors.push("Missing 'stations' array");

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Now safe to reference
  const resources = p.resources!;
  const tools = p.tools!;
  const skills = p.skills!;
  const buildings = p.buildings!;
  const biomes = p.biomes!;

  // Check that referenced IDs exist
  const checkResourceRef = (id: string, context: string) => {
    if (!resources[id]) warnings.push(`${context}: references unknown resource '${id}'`);
  };
  const checkToolRef = (id: string, context: string) => {
    if (!tools[id]) warnings.push(`${context}: references unknown tool '${id}'`);
  };
  const checkSkillRef = (id: string, context: string) => {
    if (!skills[id]) errors.push(`${context}: references unknown skill '${id}'`);
  };
  const checkBuildingRef = (id: string, context: string) => {
    if (!buildings[id]) warnings.push(`${context}: references unknown building '${id}'`);
  };
  const checkBiomeRef = (id: string, context: string) => {
    if (!biomes[id]) warnings.push(`${context}: references unknown biome '${id}'`);
  };

  // Validate actions
  for (const action of p.actions!) {
    if (!action.id) { errors.push("Action missing 'id'"); continue; }
    const ctx = `action '${action.id}'`;
    checkSkillRef(action.skillId, ctx);
    for (const drop of action.drops ?? []) checkResourceRef(drop.resourceId, ctx);
    if (action.requiredBiome) checkBiomeRef(action.requiredBiome, ctx);
    for (const tid of action.requiredTools ?? []) checkToolRef(tid, ctx);
    for (const bid of action.requiredBuildings ?? []) checkBuildingRef(bid, ctx);
  }

  // Validate recipes
  for (const recipe of p.recipes!) {
    if (!recipe.id) { errors.push("Recipe missing 'id'"); continue; }
    const ctx = `recipe '${recipe.id}'`;
    checkSkillRef(recipe.skillId, ctx);
    for (const inp of recipe.inputs ?? []) {
      checkResourceRef(inp.resourceId, ctx);
      if (inp.removedByBuilding) checkBuildingRef(inp.removedByBuilding, ctx);
    }
    if (recipe.output) checkResourceRef(recipe.output.resourceId, ctx);
    if (recipe.toolOutput) checkToolRef(recipe.toolOutput, ctx);
    if (recipe.buildingOutput) checkBuildingRef(recipe.buildingOutput, ctx);
    if (recipe.replacesBuilding) checkBuildingRef(recipe.replacesBuilding, ctx);
    for (const tid of recipe.requiredTools ?? []) checkToolRef(tid, ctx);
    for (const bid of recipe.requiredBuildings ?? []) checkBuildingRef(bid, ctx);
  }

  // Validate expeditions
  for (const exp of p.expeditions!) {
    if (!exp.id) { errors.push("Expedition missing 'id'"); continue; }
    const ctx = `expedition '${exp.id}'`;
    checkSkillRef(exp.skillId, ctx);
    if (exp.requiredVessel) checkBuildingRef(exp.requiredVessel, ctx);
    for (const outcome of exp.outcomes ?? []) {
      if (outcome.biomeDiscovery) checkBiomeRef(outcome.biomeDiscovery, ctx);
      for (const drop of outcome.drops ?? []) checkResourceRef(drop.resourceId, ctx);
    }
  }

  // Validate stations
  for (const station of p.stations!) {
    if (!station.id) { errors.push("Station missing 'id'"); continue; }
    const ctx = `station '${station.id}'`;
    checkSkillRef(station.skillId, ctx);
    if (station.requiredTool) checkToolRef(station.requiredTool, ctx);
    for (const bid of station.requiredBuildings ?? []) checkBuildingRef(bid, ctx);
    for (const inp of station.setupInputs ?? []) checkResourceRef(inp.resourceId, ctx);
    for (const drop of station.yields ?? []) checkResourceRef(drop.resourceId, ctx);
  }

  // Check that at least one starting biome exists
  const hasStartingBiome = Object.values(biomes).some((b) => b.startingBiome);
  if (!hasStartingBiome) warnings.push("No biome has 'startingBiome: true'");

  // Check that at least one default phase exists
  const hasDefaultPhase = (p.phases ?? []).some((ph) => ph.conditions.length === 0);
  if (!hasDefaultPhase) warnings.push("No phase has empty conditions (default phase)");

  return { valid: errors.length === 0, errors, warnings };
}

// ═══════════════════════════════════════
// Import
// ═══════════════════════════════════════

/** Import a mod pack from a JSON file. Returns validation result. */
export function importModPack(json: string): ValidationResult & { pack?: GameDataPack } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { valid: false, errors: ["Invalid JSON"], warnings: [] };
  }

  const result = validateModPack(parsed);
  if (!result.valid) return result;

  return { ...result, pack: parsed as GameDataPack };
}

// ═══════════════════════════════════════
// Mod storage (IndexedDB)
// ═══════════════════════════════════════

const MOD_DB_NAME = "seabound_mods";
const MOD_STORE_NAME = "packs";

function openModDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MOD_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MOD_STORE_NAME)) {
        db.createObjectStore(MOD_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Save a mod pack to IndexedDB. */
export async function saveModPack(pack: GameDataPack): Promise<void> {
  const db = await openModDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOD_STORE_NAME, "readwrite");
    tx.objectStore(MOD_STORE_NAME).put(pack);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Load a mod pack from IndexedDB by ID. */
export async function loadModPack(id: string): Promise<GameDataPack | null> {
  const db = await openModDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOD_STORE_NAME, "readonly");
    const request = tx.objectStore(MOD_STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

/** Delete a mod pack from IndexedDB. */
export async function deleteModPack(id: string): Promise<void> {
  const db = await openModDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOD_STORE_NAME, "readwrite");
    tx.objectStore(MOD_STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** List all stored mod pack IDs and names. */
export async function listModPacks(): Promise<{ id: string; name: string; version: string }[]> {
  const db = await openModDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOD_STORE_NAME, "readonly");
    const request = tx.objectStore(MOD_STORE_NAME).getAll();
    request.onsuccess = () => {
      const packs = request.result as GameDataPack[];
      resolve(packs.map((p) => ({ id: p.id, name: p.name, version: p.version })));
    };
    request.onerror = () => reject(request.error);
  });
}

// ═══════════════════════════════════════
// Mod switching
// ═══════════════════════════════════════

/** Switch to a mod by ID (loads from IndexedDB and swaps registry). */
export async function switchToMod(modId: string): Promise<void> {
  if (modId === "base") {
    setDataPack(createBaseGamePack());
    return;
  }
  const pack = await loadModPack(modId);
  if (!pack) throw new Error(`Mod '${modId}' not found`);
  setDataPack(pack);
}

/** Get the active mod ID. */
export function getActiveModId(): string {
  return getDataPack().id;
}
