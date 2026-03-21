export const FULL_XP_ACTIONS = 30;
export const MIN_XP_ACTIONS = 100;
export const MIN_XP_MULTIPLIER = 0.1;

export function getRepetitiveXpMultiplier(repetitiveCount: number): number {
  if (repetitiveCount < FULL_XP_ACTIONS) return 1;
  if (repetitiveCount >= MIN_XP_ACTIONS) return MIN_XP_MULTIPLIER;
  const progress = (repetitiveCount - FULL_XP_ACTIONS) / (MIN_XP_ACTIONS - FULL_XP_ACTIONS);
  return 1 - progress * (1 - MIN_XP_MULTIPLIER);
}

export function applyRepetitiveXp(baseXp: number, repetitiveCount: number): number {
  const multiplier = getRepetitiveXpMultiplier(repetitiveCount);
  return Math.max(1, Math.round(baseXp * multiplier));
}
