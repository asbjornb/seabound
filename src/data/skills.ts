import { SkillDef, SkillId } from "./types";

export const SKILLS: Record<SkillId, SkillDef> = {
  woodcutting: {
    id: "woodcutting",
    name: "Woodcutting",
    description: "The art of felling trees and processing timber.",
  },
  mining: {
    id: "mining",
    name: "Mining",
    description: "Breaking rock and extracting useful stone.",
  },
  foraging: {
    id: "foraging",
    name: "Foraging",
    description: "Finding useful plants, fungi, and materials in the wild.",
  },
  crafting: {
    id: "crafting",
    name: "Crafting",
    description: "Shaping raw materials into useful items.",
  },
  firemaking: {
    id: "firemaking",
    name: "Firemaking",
    description: "Creating and managing fire for warmth and crafting.",
  },
  exploration: {
    id: "exploration",
    name: "Exploration",
    description: "Venturing into the unknown to discover new resources.",
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
