import { BiomeId, BuildingId, ResourceId, SkillId } from "./types";

/** Emoji icons for visual flair — kept separate from game data to avoid state issues */

export const RESOURCE_ICONS: Record<ResourceId, string> = {
  coconut: "\u{1F965}",
  coconut_husk: "\u{1F95C}",
  driftwood_branch: "\u{1FAB5}",
  flat_stone: "\u{1FAA8}",
  palm_frond: "\u{1F334}",
  small_fish: "\u{1F41F}",
  crab: "\u{1F980}",
  shell: "\u{1F41A}",
  bamboo_cane: "\u{1F38D}",
  bamboo_splinter: "\u{1F52A}",
  rough_fiber: "\u{1F9F6}",
  dried_fiber: "\u{1F9F5}",
  cordage: "\u{1FA22}",
  bamboo_knife: "\u{1F52A}",
  large_shell: "\u{1F41A}",
  dry_grass: "\u{1F33E}",
  bow_drill_kit: "\u{1F525}",
  bamboo_spear: "\u{1F531}",
  woven_basket: "\u{1F9FA}",
  large_fish: "\u{1F3A3}",
  cooked_fish: "\u{1F35B}",
  cooked_crab: "\u{1F980}",
  cooked_large_fish: "\u{1F372}",
  wild_seed: "\u{1F331}",
  raft: "\u{26F5}",
  obsidian: "\u{1F48E}",
  obsidian_blade: "\u{2694}\uFE0F",
  chert: "\u{1FAA8}",
  stone_flake: "\u{1FAA8}",
  stone_blade: "\u{1F5E1}\uFE0F",
  hammerstone: "\u{1FAA8}",
  shell_adze: "\u{1FA93}",
  stone_axe: "\u{1FA93}",
  large_log: "\u{1FAB5}",
  charred_log: "\u{1FAB5}",
  shaped_hull: "\u{1F6F6}",
  dugout: "\u{1F6F6}",
  fresh_water: "\u{1F4A7}",
  gorge_hook: "\u{1FA9D}",
  basket_trap: "\u{1FAA4}",
  clay: "\u{1F9F1}",
  shaped_clay_pot: "\u{1FAD9}",
  fired_clay_pot: "\u{1FAD9}",
  sealed_clay_jar: "\u{1F3FA}",
  crucible: "\u{1F525}",
};

export const SKILL_ICONS: Record<SkillId, string> = {
  foraging: "\u{1F33F}",
  fishing: "\u{1F3A3}",
  woodworking: "\u{1FAB5}",
  crafting: "\u{1F528}",
  cooking: "\u{1F373}",
  weaving: "\u{1F9F6}",
  construction: "\u{1F3D7}\uFE0F",
  farming: "\u{1F331}",
  navigation: "\u{1F9ED}",
  preservation: "\u{1F372}",
};

export const BIOME_ICONS: Record<BiomeId, string> = {
  beach: "\u{1F3D6}\uFE0F",
  coconut_grove: "\u{1F334}",
  bamboo_grove: "\u{1F38D}",
  jungle_interior: "\u{1F332}",
  nearby_island: "\u{1F30B}",
};

export const BUILDING_ICONS: Record<BuildingId, string> = {
  camp_fire: "\u{1F525}",
  palm_leaf_pile: "\u{1F343}",
  drying_rack: "\u{2600}\uFE0F",
  fenced_perimeter: "\u{1F3E1}",
  firing_pit: "\u{1F525}",
  kiln: "\u{1F3ED}",
  fiber_loom: "\u{1F9F6}",
};

export const TAB_ICONS: Record<string, string> = {
  gather: "\u{1F91A}",
  explore: "\u{1F9ED}",
  craft: "\u{1F528}",
  build: "\u{26FA}",
  inventory: "\u{1F392}",
  skills: "\u{2B50}",
};
