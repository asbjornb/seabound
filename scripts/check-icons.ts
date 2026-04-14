#!/usr/bin/env npx tsx
/**
 * Icon Spec Checker
 *
 * Ensures every icon ID referenced by game data has an entry in docs/icon-spec.json.
 * This prevents adding new resources/tools/skills/buildings/biomes without updating
 * the icon specification.
 *
 * Usage:
 *   npx tsx scripts/check-icons.ts          # check and report
 *   npx tsx scripts/check-icons.ts --check  # exit 1 if missing (for CI)
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { RESOURCES } from "../src/data/resources";
import { TOOLS } from "../src/data/tools";
import { SKILLS } from "../src/data/skills";
import { BUILDINGS } from "../src/data/buildings";
import { BIOMES } from "../src/data/biomes";
import { EXPEDITIONS, MAINLAND_EXPEDITIONS } from "../src/data/expeditions";

const isCheck = process.argv.includes("--check");

// Load the icon spec
const specPath = resolve(import.meta.dirname ?? __dirname, "../docs/icon-spec.json");
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const specIds = new Set<string>(spec.icons.map((i: { id: string }) => i.id));

// Tab icon IDs — each GameTab needs a tab_{name} icon, plus mainland-renamed variants
const TAB_ICON_IDS = [
  "tab_gather",
  "tab_inventory",
  "tab_equipment",
  "tab_craft",
  "tab_tend",
  "tab_build",
  "tab_explore",
  "tab_skills",
  "tab_routines",
  // Mainland-renamed tab icons
  "tab_harvest",
  "tab_forge",
  "tab_venture",
];

// Collect all icon IDs referenced by game data (same convention as modding.ts collectIconIds)
const referencedIds = new Set<string>();

for (const id of Object.keys(RESOURCES)) referencedIds.add(id);
for (const id of Object.keys(TOOLS)) referencedIds.add(id);
for (const id of Object.keys(SKILLS)) referencedIds.add(`skill_${id}`);
for (const id of Object.keys(BUILDINGS)) referencedIds.add(id);
for (const id of Object.keys(BIOMES)) referencedIds.add(`biome_${id}`);
for (const exp of [...EXPEDITIONS, ...MAINLAND_EXPEDITIONS]) referencedIds.add(exp.id);
for (const id of TAB_ICON_IDS) referencedIds.add(id);

// Find missing
const missing = [...referencedIds].filter((id) => !specIds.has(id)).sort();

if (missing.length === 0) {
  console.log(`✓ All ${referencedIds.size} icon references have entries in icon-spec.json`);
  process.exit(0);
} else {
  console.error(
    `✗ ${missing.length} icon reference(s) missing from docs/icon-spec.json:\n`
  );
  for (const id of missing) {
    console.error(`  - ${id}`);
  }
  console.error(
    `\nAdd entries for these icons to docs/icon-spec.json before committing.`
  );
  process.exit(isCheck ? 1 : 0);
}
