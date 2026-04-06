/**
 * Mod system: export, import, validate, and manage game data packs.
 * Supports icon bundling — mod packs are exported as .zip files containing
 * data.json + icons/*.png. Icons are stored in IndexedDB and served to
 * GameIcon via object URLs.
 */

import JSZip from "jszip";
import type { GameDataPack } from "./registry";
import { createBaseGamePack, getDataPack, setDataPack } from "./registry";

// ═══════════════════════════════════════
// Icon URL cache (active mod)
// ═══════════════════════════════════════

/** Map of iconId → object URL for the currently active mod's icons. */
let _modIconUrls: Map<string, string> = new Map();

/** Get an object URL for a mod-provided icon, or null if none. */
export function getModIconUrl(iconId: string): string | null {
  return _modIconUrls.get(iconId) ?? null;
}

/** Revoke all current mod icon object URLs and clear the cache. */
function clearModIconUrls(): void {
  for (const url of _modIconUrls.values()) {
    URL.revokeObjectURL(url);
  }
  _modIconUrls = new Map();
}

/** Load all icons for a mod from IndexedDB into the URL cache. */
async function loadModIconUrls(modId: string): Promise<void> {
  clearModIconUrls();
  if (modId === "base") return;
  const icons = await loadAllModIcons(modId);
  for (const { iconId, blob } of icons) {
    _modIconUrls.set(iconId, URL.createObjectURL(blob));
  }
}

// ═══════════════════════════════════════
// Export
// ═══════════════════════════════════════

/** Collect all icon IDs referenced by a data pack. */
function collectIconIds(pack: GameDataPack): string[] {
  const ids = new Set<string>();

  // Resources
  for (const id of Object.keys(pack.resources)) ids.add(id);
  // Tools
  for (const id of Object.keys(pack.tools)) ids.add(id);
  // Skills (icon convention: skill_{id})
  for (const id of Object.keys(pack.skills)) ids.add(`skill_${id}`);
  // Buildings
  for (const id of Object.keys(pack.buildings)) ids.add(id);
  // Biomes (icon convention: biome_{id})
  for (const id of Object.keys(pack.biomes)) ids.add(`biome_${id}`);

  return Array.from(ids);
}

/** Export the current data pack as a downloadable .zip with icons. */
export async function exportModPack(): Promise<void> {
  const pack = getDataPack();
  const zip = new JSZip();

  // Add data.json
  zip.file("data.json", JSON.stringify(pack, null, 2));

  // Collect all icon IDs and bundle any we can find
  const iconIds = collectIconIds(pack);
  const iconsFolder = zip.folder("icons")!;

  // For each icon, check mod icon store first, then try static /icons/
  const modIcons = pack.id !== "base" ? await loadAllModIcons(pack.id) : [];
  const modIconMap = new Map(modIcons.map((i) => [i.iconId, i.blob]));

  const fetchPromises = iconIds.map(async (iconId) => {
    // Check mod-stored icon first
    const modBlob = modIconMap.get(iconId);
    if (modBlob) {
      iconsFolder.file(`${iconId}.png`, modBlob);
      return;
    }
    // Try fetching from static /icons/
    try {
      const resp = await fetch(`/icons/${iconId}.png`);
      if (resp.ok) {
        const blob = await resp.blob();
        iconsFolder.file(`${iconId}.png`, blob);
      }
    } catch {
      // Icon not available — skip silently
    }
  });
  await Promise.all(fetchPromises);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `seabound-mod-${pack.id}.zip`;
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
      if (inp.alternateResourceId) checkResourceRef(inp.alternateResourceId, ctx);
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

export interface ImportResult extends ValidationResult {
  pack?: GameDataPack;
  iconCount: number;
}

/** Import a mod pack from a JSON string (legacy). Returns validation result. */
export function importModPackFromJson(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { valid: false, errors: ["Invalid JSON"], warnings: [], iconCount: 0 };
  }

  const result = validateModPack(parsed);
  if (!result.valid) return { ...result, iconCount: 0 };

  const pack = parsed as GameDataPack;
  // Default new optional fields for backward compat with older mods
  if (!pack.difficultyBands) pack.difficultyBands = [];
  return { ...result, pack, iconCount: 0 };
}

/** Import a mod pack from a .zip file. Extracts data.json and icons/. */
export async function importModPackFromZip(file: File): Promise<ImportResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    return { valid: false, errors: ["Invalid zip file"], warnings: [], iconCount: 0 };
  }

  // Find data.json
  const dataFile = zip.file("data.json");
  if (!dataFile) {
    return { valid: false, errors: ["Zip missing data.json"], warnings: [], iconCount: 0 };
  }

  const json = await dataFile.async("string");
  const result = importModPackFromJson(json);
  if (!result.valid || !result.pack) return result;

  // Extract icons
  const icons: { iconId: string; blob: Blob }[] = [];
  const iconFiles = zip.folder("icons");
  if (iconFiles) {
    const promises: Promise<void>[] = [];
    iconFiles.forEach((relativePath, entry) => {
      if (entry.dir) return;
      if (!relativePath.endsWith(".png")) return;
      const iconId = relativePath.replace(/\.png$/, "");
      promises.push(
        entry.async("blob").then((blob) => {
          icons.push({ iconId, blob });
        })
      );
    });
    await Promise.all(promises);
  }

  // Save icons to IndexedDB
  if (icons.length > 0) {
    await saveModIcons(result.pack.id, icons);
  }

  return { ...result, iconCount: icons.length };
}

/** Import a mod pack from a File (auto-detects .json vs .zip). */
export async function importModPack(file: File): Promise<ImportResult> {
  if (file.name.endsWith(".zip") || file.type === "application/zip") {
    return importModPackFromZip(file);
  }
  // Legacy JSON import
  const text = await file.text();
  return importModPackFromJson(text);
}

// ═══════════════════════════════════════
// Mod storage (IndexedDB)
// ═══════════════════════════════════════

const MOD_DB_NAME = "seabound_mods";
const MOD_STORE_NAME = "packs";
const ICON_STORE_NAME = "icons";

function openModDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MOD_DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MOD_STORE_NAME)) {
        db.createObjectStore(MOD_STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(ICON_STORE_NAME)) {
        db.createObjectStore(ICON_STORE_NAME, { keyPath: "key" });
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

/** Delete a mod pack and its icons from IndexedDB. */
export async function deleteModPack(id: string): Promise<void> {
  await deleteModIcons(id);
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
// Icon storage (IndexedDB)
// ═══════════════════════════════════════

interface StoredIcon {
  key: string;    // "modId/iconId"
  modId: string;
  iconId: string;
  blob: Blob;
}

/** Save icons for a mod. */
async function saveModIcons(modId: string, icons: { iconId: string; blob: Blob }[]): Promise<void> {
  const db = await openModDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ICON_STORE_NAME, "readwrite");
    const store = tx.objectStore(ICON_STORE_NAME);
    for (const { iconId, blob } of icons) {
      const entry: StoredIcon = {
        key: `${modId}/${iconId}`,
        modId,
        iconId,
        blob,
      };
      store.put(entry);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Load all icons for a mod from IndexedDB. */
async function loadAllModIcons(modId: string): Promise<{ iconId: string; blob: Blob }[]> {
  const db = await openModDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ICON_STORE_NAME, "readonly");
    const store = tx.objectStore(ICON_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as StoredIcon[];
      const filtered = all
        .filter((entry) => entry.modId === modId)
        .map((entry) => ({ iconId: entry.iconId, blob: entry.blob }));
      resolve(filtered);
    };
    request.onerror = () => reject(request.error);
  });
}

/** Delete all icons for a mod. */
async function deleteModIcons(modId: string): Promise<void> {
  const db = await openModDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ICON_STORE_NAME, "readwrite");
    const store = tx.objectStore(ICON_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as StoredIcon[];
      for (const entry of all) {
        if (entry.modId === modId) {
          store.delete(entry.key);
        }
      }
      tx.oncomplete = () => resolve();
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
    await loadModIconUrls("base");
    return;
  }
  const pack = await loadModPack(modId);
  if (!pack) throw new Error(`Mod '${modId}' not found`);
  setDataPack(pack);
  await loadModIconUrls(modId);
}

/** Get the active mod ID. */
export function getActiveModId(): string {
  return getDataPack().id;
}
