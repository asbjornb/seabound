import { ACTIONS } from "./actions";
import { RECIPES } from "./recipes";
import { SkillId, SkillMilestone } from "./types";

/**
 * Hand-authored milestones per skill.
 * These define effects (drop bonuses, duration reductions) and descriptions
 * the player can preview in the Skills panel.
 */
const AUTHORED_MILESTONES: Partial<Record<SkillId, SkillMilestone[]>> = {
  fishing: [
    {
      level: 2,
      description: "+2% fish and crab chance from tidal pools",
      effects: [
        { type: "drop_chance", actionId: "wade_tidal_pool", resourceId: "small_fish", bonus: 0.02 },
        { type: "drop_chance", actionId: "wade_tidal_pool", resourceId: "crab", bonus: 0.02 },
      ],
    },
    {
      level: 3,
      description: "+2% fish and crab chance from tidal pools",
      effects: [
        { type: "drop_chance", actionId: "wade_tidal_pool", resourceId: "small_fish", bonus: 0.02 },
        { type: "drop_chance", actionId: "wade_tidal_pool", resourceId: "crab", bonus: 0.02 },
      ],
    },
    {
      level: 4,
      description: "Practiced wading — tidal pools 10% faster",
      effects: [
        { type: "duration", actionId: "wade_tidal_pool", multiplier: 0.9 },
      ],
    },
    {
      level: 5,
      description: "Sharp eyes — +5% fish chance from tidal pools",
      effects: [
        { type: "drop_chance", actionId: "wade_tidal_pool", resourceId: "small_fish", bonus: 0.05 },
      ],
    },
    {
      level: 8,
      description: "Big game — 5% chance to spear a large fish",
      effects: [
        { type: "drop_chance", actionId: "spear_fish", resourceId: "large_fish", bonus: 0.05 },
      ],
    },
  ],
  foraging: [
    {
      level: 4,
      description: "Keen eye — +20% coconut husk chance when gathering",
      effects: [
        { type: "drop_chance", actionId: "gather_coconuts", resourceId: "coconut_husk", bonus: 0.2 },
      ],
    },
    {
      level: 9,
      description: "Forager's luck — 5% chance to find a wild seed in dry grass",
      effects: [
        { type: "drop_chance", actionId: "collect_dry_grass", resourceId: "wild_seed", bonus: 0.05 },
      ],
    },
  ],
  cooking: [
    {
      level: 3,
      description: "Seasoned cook — 5% chance to double cooking output",
      effects: [
        { type: "double_output", chance: 0.05 },
      ],
    },
  ],
  preservation: [
    {
      level: 3,
      description: "Sun-dried mastery — 50% chance to double drying output",
      effects: [
        { type: "double_output", chance: 0.5, recipeId: "dry_fiber" },
      ],
    },
  ],
  crafting: [
    {
      level: 5,
      description: "Rope hand — 15% chance to twist extra cordage",
      effects: [
        { type: "double_output", chance: 0.15, recipeId: "twist_cordage" },
      ],
    },
  ],
  weaving: [
    {
      level: 2,
      description: "Nimble fingers — ready to weave palm fronds into useful items",
    },
  ],
};

/**
 * Auto-generate "Unlock …" milestones from actions and recipes
 * that have a requiredSkillLevel, so the player can see what's coming.
 */
function generateUnlockMilestones(): Partial<Record<SkillId, SkillMilestone[]>> {
  const result: Partial<Record<SkillId, SkillMilestone[]>> = {};

  for (const action of ACTIONS) {
    if (action.requiredSkillLevel && action.requiredSkillLevel > 1) {
      const list = result[action.skillId] ?? [];
      list.push({
        level: action.requiredSkillLevel,
        description: `Unlock action: ${action.name}`,
      });
      result[action.skillId] = list;
    }
  }

  for (const recipe of RECIPES) {
    if (recipe.requiredSkillLevel && recipe.requiredSkillLevel > 1) {
      const list = result[recipe.skillId] ?? [];
      list.push({
        level: recipe.requiredSkillLevel,
        description: `Unlock recipe: ${recipe.name}`,
        hidden: true,
      });
      result[recipe.skillId] = list;
    }
  }

  return result;
}

/** Merged milestones: authored effects + auto-detected unlocks, sorted by level. */
export function getMilestones(skillId: SkillId): SkillMilestone[] {
  const authored = AUTHORED_MILESTONES[skillId] ?? [];
  const unlocks = generateUnlockMilestones()[skillId] ?? [];
  return [...authored, ...unlocks].sort((a, b) => a.level - b.level);
}

/**
 * Compute total drop chance bonus for a specific action + resource
 * from all milestones the player has reached.
 */
export function getDropChanceBonus(
  skillId: SkillId,
  skillLevel: number,
  actionId: string,
  resourceId: string
): number {
  const milestones = AUTHORED_MILESTONES[skillId] ?? [];
  let bonus = 0;
  for (const m of milestones) {
    if (m.level > skillLevel || !m.effects) continue;
    for (const e of m.effects) {
      if (
        e.type === "drop_chance" &&
        e.actionId === actionId &&
        e.resourceId === resourceId
      ) {
        bonus += e.bonus;
      }
    }
  }
  return bonus;
}

/**
 * Compute total double-output chance for a skill at a given level.
 */
export function getDoubleOutputChance(
  skillId: SkillId,
  skillLevel: number,
  recipeId?: string
): number {
  const milestones = AUTHORED_MILESTONES[skillId] ?? [];
  let chance = 0;
  for (const m of milestones) {
    if (m.level > skillLevel || !m.effects) continue;
    for (const e of m.effects) {
      if (e.type === "double_output") {
        // If the effect specifies a recipeId, only apply to that recipe
        if (e.recipeId && e.recipeId !== recipeId) continue;
        chance += e.chance;
      }
    }
  }
  return chance;
}

/**
 * Compute duration multiplier for a specific action
 * from all milestones the player has reached.
 */
export function getDurationMultiplier(
  skillId: SkillId,
  skillLevel: number,
  actionId: string
): number {
  const milestones = AUTHORED_MILESTONES[skillId] ?? [];
  let multiplier = 1;
  for (const m of milestones) {
    if (m.level > skillLevel || !m.effects) continue;
    for (const e of m.effects) {
      if (e.type === "duration" && e.actionId === actionId) {
        multiplier *= e.multiplier;
      }
    }
  }
  return multiplier;
}
