import { DifficultyBandDef } from "./types";

export const DIFFICULTY_BANDS: DifficultyBandDef[] = [
  {
    id: "low_risk",
    name: "Low Risk",
    description:
      "Reliable expeditions with minimal danger. Steady source of basic materials and low-tier equipment.",
    baseFailureChance: 0.05,
    rewardMultiplier: 1.0,
    brokenDropChance: 0.0,
    hazardChecks: 1,
  },
  {
    id: "mid_risk",
    name: "Mid Risk",
    description:
      "Moderate challenge with better rewards. Some hazards require decent gear or planning to overcome.",
    baseFailureChance: 0.25,
    rewardMultiplier: 1.5,
    brokenDropChance: 0.3,
    hazardChecks: 2,
  },
  {
    id: "high_risk",
    name: "High Risk",
    description:
      "Dangerous expeditions with the best drops and rare components. Expect failures without strong loadouts.",
    baseFailureChance: 0.50,
    rewardMultiplier: 2.5,
    brokenDropChance: 0.6,
    hazardChecks: 3,
  },
];
