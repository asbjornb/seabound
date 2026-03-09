export type ResourceId =
  | "wood"
  | "stone"
  | "fiber"
  | "clay"
  | "flint"
  | "sticks"
  | "berries"
  | "mushrooms"
  | "bark"
  | "dried_fiber"
  | "stone_axe"
  | "stone_pickaxe"
  | "stone_knife"
  | "rope"
  | "campfire"
  | "clay_pot"
  | "wooden_shelter";

export type SkillId =
  | "woodcutting"
  | "mining"
  | "foraging"
  | "crafting"
  | "firemaking"
  | "exploration";

export interface ResourceDef {
  id: ResourceId;
  name: string;
  description: string;
  category: "raw" | "processed" | "tool" | "structure";
}

export interface SkillDef {
  id: SkillId;
  name: string;
  description: string;
}

export interface Drop {
  resourceId: ResourceId;
  amount: number;
  chance?: number; // 0-1, defaults to 1
}

export interface ActionDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
  durationMs: number;
  drops: Drop[];
  requiredSkillLevel?: number;
  requiredTools?: ResourceId[];
  xpGain: number;
}

export interface RecipeDef {
  id: string;
  name: string;
  description: string;
  skillId: SkillId;
  inputs: { resourceId: ResourceId; amount: number }[];
  output: { resourceId: ResourceId; amount: number };
  durationMs: number;
  requiredSkillLevel?: number;
  xpGain: number;
}

export interface GameState {
  resources: Record<string, number>;
  skills: Record<SkillId, { xp: number; level: number }>;
  currentAction: {
    actionId: string;
    startedAt: number;
    type: "gather" | "craft";
    recipeId?: string;
  } | null;
  lastTickAt: number;
  totalPlayTimeMs: number;
}
