import { ACTIONS } from "./actions";
import { RECIPES } from "./recipes";
import type { SkillId, SkillMilestone } from "./types";

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
      level: 7,
      description: "Practiced angler — all fishing 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
    },
    {
      level: 8,
      description: "Big game — 5% chance to spear a large fish",
      effects: [
        { type: "drop_chance", actionId: "spear_fish", resourceId: "large_fish", bonus: 0.05 },
      ],
    },
    {
      level: 12,
      description: "Patient angler — drop line 15% faster",
      effects: [
        { type: "duration", actionId: "drop_line_fish", multiplier: 0.85 },
      ],
    },
    {
      level: 15,
      description: "Deep water instinct — +10% large fish from drop line",
      effects: [
        { type: "drop_chance", actionId: "drop_line_fish", resourceId: "large_fish", bonus: 0.1 },
      ],
    },
  ],
  foraging: [
    {
      level: 2,
      description: "Quick hands — gather coconuts 10% faster",
      effects: [
        { type: "duration", actionId: "gather_coconuts", multiplier: 0.9 },
      ],
    },
    {
      level: 3,
      description: "Beachcomber — +5% flat stone chance from rocky shore",
      effects: [
        { type: "drop_chance", actionId: "comb_rocky_shore", resourceId: "flat_stone", bonus: 0.05 },
      ],
    },
    {
      level: 4,
      description: "Keen eye — +20% coconut husk chance when gathering",
      effects: [
        { type: "drop_chance", actionId: "gather_coconuts", resourceId: "coconut_husk", bonus: 0.2 },
      ],
    },
    {
      level: 6,
      description: "Keen collector — 15% chance to find extra driftwood",
      effects: [
        { type: "drop_chance", actionId: "collect_driftwood", resourceId: "driftwood_branch", bonus: 0.15 },
      ],
    },
    {
      level: 8,
      description: "Seasoned forager — all foraging 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
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
    {
      level: 6,
      description: "Even heat — cook fish 15% faster",
      effects: [
        { type: "duration", actionId: "cook_fish", multiplier: 0.85 },
      ],
    },
    {
      level: 7,
      description: "Quick cook — all cooking 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
    },
    {
      level: 9,
      description: "Hearty portions — 10% chance to double cooked root vegetable",
      effects: [
        { type: "double_output", chance: 0.1, recipeId: "cook_root_vegetable" },
      ],
    },
    {
      level: 10,
      description: "Seasoned chef — all cooking 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
    },
    {
      level: 14,
      description: "Efficient preservation — pack voyage provisions 20% faster",
      effects: [
        { type: "duration", actionId: "pack_voyage_provisions", multiplier: 0.8 },
      ],
    },
  ],
  farming: [
    {
      level: 2,
      description: "Hardy seeds — +15% wild seed return chance",
      effects: [
        { type: "drop_chance", actionId: "plant_wild_seeds", resourceId: "wild_seed", bonus: 0.15 },
      ],
    },
    {
      level: 4,
      description: "Quick planter — plant wild seeds 10% faster",
      effects: [
        { type: "duration", actionId: "plant_wild_seeds", multiplier: 0.9 },
      ],
    },
    {
      level: 5,
      description: "Careful planting — +15% root vegetable chance",
      effects: [
        { type: "drop_chance", actionId: "plant_wild_seeds", resourceId: "root_vegetable", bonus: 0.15 },
      ],
    },
    {
      level: 6,
      description: "Practiced farmer — all farming 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
    },
    {
      level: 7,
      description: "Efficient sowing — plant wild seeds costs 2 seeds instead of 3",
      effects: [
        { type: "station_input_reduce", stationId: "plant_wild_seeds", resourceId: "wild_seed", newAmount: 2 },
      ],
    },
    {
      level: 8,
      description: "Seed saving — wild seed planting always returns at least 1 seed",
      effects: [
        { type: "station_guaranteed_drop", stationId: "plant_wild_seeds", resourceId: "wild_seed", minAmount: 1 },
      ],
    },
    {
      level: 9,
      description: "Green thumb — all crop stations 15% faster",
      effects: [
        { type: "duration", actionId: "plant_wild_seeds", multiplier: 0.85 },
        { type: "duration", actionId: "cultivate_taro", multiplier: 0.85 },
        { type: "duration", actionId: "grow_bananas", multiplier: 0.85 },
        { type: "duration", actionId: "grow_breadfruit", multiplier: 0.85 },
        { type: "duration", actionId: "grow_pandanus", multiplier: 0.85 },
        { type: "duration", actionId: "harvest_pandanus_grove", multiplier: 0.85 },
      ],
    },
    {
      level: 11,
      description: "Propagation — +10% chance for all crop replanting",
      effects: [
        { type: "drop_chance", actionId: "cultivate_taro", resourceId: "taro_corm", bonus: 0.10 },
        { type: "drop_chance", actionId: "grow_bananas", resourceId: "banana_shoot", bonus: 0.10 },
        { type: "drop_chance", actionId: "grow_breadfruit", resourceId: "breadfruit_cutting", bonus: 0.10 },
      ],
    },
    {
      level: 13,
      description: "Abundant harvest — 20% chance to double crop yields",
      effects: [
        { type: "double_output", chance: 0.2 },
      ],
    },
    {
      level: 18,
      description: "Master farmer — wild seed planting always yields 2 root vegetables",
      effects: [
        { type: "station_guaranteed_drop", stationId: "plant_wild_seeds", resourceId: "root_vegetable", minAmount: 2 },
      ],
    },
  ],
  crafting: [
    {
      level: 3,
      description: "Sun-dried mastery — 50% chance to double drying output",
      effects: [
        { type: "double_output", chance: 0.5, recipeId: "dry_fiber" },
      ],
    },
    {
      level: 5,
      description: "Efficient strips — 25% chance to cut extra pandanus strips",
      effects: [
        { type: "double_output", chance: 0.25, recipeId: "cut_pandanus_strips" },
      ],
    },
    {
      level: 7,
      description: "Efficient craftsman — all crafting 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
    },
    {
      level: 8,
      description: "Pottery hands — shape clay pot 15% faster",
      effects: [
        { type: "duration", actionId: "shape_clay_pot", multiplier: 0.85 },
      ],
    },
    {
      level: 10,
      description: "Seasoned crafter — all crafting recipes 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
    },
    {
      level: 12,
      description: "Batch firing — 20% chance to double fired clay pot output",
      effects: [
        { type: "double_output", chance: 0.2, recipeId: "fire_clay_pot" },
      ],
    },
  ],
  weaving: [
    {
      level: 2,
      description: "Nimble fingers — 15% chance to twist extra cordage",

      effects: [
        { type: "double_output", chance: 0.15, recipeId: "twist_cordage" },
      ],
    },
    {
      level: 3,
      description: "Rope hand — another 15% chance to twist extra cordage",
      effects: [
        { type: "double_output", chance: 0.15, recipeId: "twist_cordage" },
      ],
    },
    {
      level: 8,
      description: "Deft weaver — all weaving 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
    },
    {
      level: 10,
      description: "Rope walk — twist rope 20% faster",
      effects: [
        { type: "duration", actionId: "twist_rope", multiplier: 0.8 },
      ],
    },
    {
      level: 12,
      description: "Textile mastery — all weaving recipes 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
    },
  ],
  navigation: [
    {
      level: 3,
      description: "Star reader — better chance to discover new biomes",
      effects: [
        { type: "expedition_biome_bonus", bonus: 0.5 },
      ],
    },
    {
      level: 5,
      description: "Wayfinder's eye — expeditions 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
    },
    {
      level: 7,
      description: "Seasoned navigator — +15% expedition drop amounts",
      effects: [
        { type: "expedition_drop_bonus", bonus: 0.15 },
      ],
    },
  ],
  woodworking: [
    {
      level: 2,
      description: "Steady hands — harvest bamboo 10% faster",
      effects: [
        { type: "duration", actionId: "harvest_bamboo", multiplier: 0.9 },
      ],
    },
    {
      level: 6,
      description: "Practiced woodworker — all woodworking 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
    },
  ],
  construction: [
    {
      level: 9,
      description: "Efficient builder — all construction 10% faster",
      effects: [
        { type: "duration", actionId: "*", multiplier: 0.9 },
      ],
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
      if (e.type === "duration" && (e.actionId === actionId || e.actionId === "*")) {
        multiplier *= e.multiplier;
      }
    }
  }
  return multiplier;
}

/**
 * Get reduced station setup input amount from milestones.
 * Returns the original amount if no milestone applies.
 */
export function getStationInputAmount(
  skillId: SkillId,
  skillLevel: number,
  stationId: string,
  resourceId: string,
  originalAmount: number
): number {
  const milestones = AUTHORED_MILESTONES[skillId] ?? [];
  let amount = originalAmount;
  for (const m of milestones) {
    if (m.level > skillLevel || !m.effects) continue;
    for (const e of m.effects) {
      if (
        e.type === "station_input_reduce" &&
        e.stationId === stationId &&
        e.resourceId === resourceId
      ) {
        amount = Math.min(amount, e.newAmount);
      }
    }
  }
  return amount;
}

/**
 * Get guaranteed minimum drops for a station from milestones.
 * Returns a map of resourceId → minAmount.
 */
export function getStationGuaranteedDrops(
  skillId: SkillId,
  skillLevel: number,
  stationId: string
): Map<string, number> {
  const milestones = AUTHORED_MILESTONES[skillId] ?? [];
  const result = new Map<string, number>();
  for (const m of milestones) {
    if (m.level > skillLevel || !m.effects) continue;
    for (const e of m.effects) {
      if (
        e.type === "station_guaranteed_drop" &&
        e.stationId === stationId
      ) {
        const current = result.get(e.resourceId) ?? 0;
        result.set(e.resourceId, Math.max(current, e.minAmount));
      }
    }
  }
  return result;
}

/**
 * Get total expedition biome discovery weight bonus from milestones.
 * Added as flat weight to undiscovered biome outcomes.
 */
export function getExpeditionBiomeBonus(
  skillId: SkillId,
  skillLevel: number
): number {
  const milestones = AUTHORED_MILESTONES[skillId] ?? [];
  let bonus = 0;
  for (const m of milestones) {
    if (m.level > skillLevel || !m.effects) continue;
    for (const e of m.effects) {
      if (e.type === "expedition_biome_bonus") {
        bonus += e.bonus;
      }
    }
  }
  return bonus;
}

/**
 * Get total expedition drop amount bonus from milestones.
 * E.g. 0.15 means +15% to all expedition drop amounts.
 */
export function getExpeditionDropBonus(
  skillId: SkillId,
  skillLevel: number
): number {
  const milestones = AUTHORED_MILESTONES[skillId] ?? [];
  let bonus = 0;
  for (const m of milestones) {
    if (m.level > skillLevel || !m.effects) continue;
    for (const e of m.effects) {
      if (e.type === "expedition_drop_bonus") {
        bonus += e.bonus;
      }
    }
  }
  return bonus;
}
