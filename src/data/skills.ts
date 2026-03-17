import { SkillDef, SkillId } from "./types";

export const SKILLS: Record<SkillId, SkillDef> = {
  foraging: {
    id: "foraging",
    name: "Foraging",
    description: "Gathering plants, fruits, fiber, roots, seeds, shells.",
  },
  fishing: {
    id: "fishing",
    name: "Fishing",
    description: "All fishing methods — wading, spearing, lines, traps, nets.",
  },
  woodworking: {
    id: "woodworking",
    name: "Woodworking",
    description:
      "Working with bamboo and wood — harvesting, shaping, splitting, felling.",
  },
  crafting: {
    id: "crafting",
    name: "Crafting",
    description:
      "General tool-making, lashing, assembly, knapping, pottery shaping.",
  },
  cooking: {
    id: "cooking",
    name: "Cooking",
    description: "Preparing food over fire — grilling, roasting, boiling.",
  },
  weaving: {
    id: "weaving",
    name: "Weaving",
    description: "Mats, baskets, traps, nets, cloth, sail.",
  },
  construction: {
    id: "construction",
    name: "Construction",
    description: "Structures, buildings, platforms, stone-work.",
  },
  farming: {
    id: "farming",
    name: "Farming",
    description: "Plot clearing, planting, tending, harvesting, seed saving.",
  },
  navigation: {
    id: "navigation",
    name: "Navigation",
    description:
      "Improves expedition outcomes — discovery chance, loot quality, risk reduction.",
  },
  preservation: {
    id: "preservation",
    name: "Preservation",
    description: "Drying, smoking, pottery firing, sealing, fermenting.",
  },
};

// XP required for each level (cumulative). Level 1 = 0 xp, level 2 = 100 xp, etc.
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Quadratic scaling: each level requires more XP
  return Math.floor(100 * (level - 1) * Math.pow(1.15, level - 2));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level++;
    if (level >= 99) break;
  }
  return level;
}
