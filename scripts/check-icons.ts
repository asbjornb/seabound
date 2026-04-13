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

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { RESOURCES } from "../src/data/resources";
import { TOOLS } from "../src/data/tools";
import { SKILLS } from "../src/data/skills";
import { BUILDINGS } from "../src/data/buildings";
import { BIOMES } from "../src/data/biomes";

const isCheck = process.argv.includes("--check");

// Load the icon spec
const specPath = resolve(import.meta.dirname ?? __dirname, "../docs/icon-spec.json");
const iconsDir = resolve(import.meta.dirname ?? __dirname, "../public/icons");
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
for (const id of TAB_ICON_IDS) referencedIds.add(id);

// Find missing from spec
const missingSpec = [...referencedIds].filter((id) => !specIds.has(id)).sort();

// Find missing PNG files
const missingPng = [...referencedIds].filter((id) => !existsSync(resolve(iconsDir, `${id}.png`))).sort();

let failed = false;

if (missingSpec.length === 0) {
  console.log(`✓ All ${referencedIds.size} icon references have entries in icon-spec.json`);
} else {
  failed = true;
  console.error(
    `✗ ${missingSpec.length} icon reference(s) missing from docs/icon-spec.json:\n`
  );
  for (const id of missingSpec) {
    console.error(`  - ${id}`);
  }
  console.error(
    `\nAdd entries for these icons to docs/icon-spec.json before committing.`
  );
}

if (missingPng.length === 0) {
  console.log(`✓ All ${referencedIds.size} icon references have PNG files in public/icons/`);
} else {
  failed = true;
  console.error(
    `\n✗ ${missingPng.length} icon reference(s) missing PNG files in public/icons/:\n`
  );
  for (const id of missingPng) {
    console.error(`  - ${id}.png`);
  }
  console.error(
    `\nAdd PNG files (256×256 RGBA) to public/icons/ for these icons.`
  );
}

process.exit(failed && isCheck ? 1 : 0);
