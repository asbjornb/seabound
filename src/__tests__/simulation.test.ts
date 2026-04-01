import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { runSimulation, type SimBenchmarks } from "../../scripts/simulate";

/**
 * Game simulation benchmark test.
 *
 * Runs a simulated playthrough and checks that key progression milestones
 * haven't shifted drastically. This catches unintentional balance regressions
 * from data changes (durations, drop rates, recipes, etc.).
 *
 * The thresholds are deliberately wide (50%) to avoid flaky failures from
 * minor RNG variance while still catching major regressions.
 */

// Baseline from 5-run average (seed 42-46)
const BASELINE = {
  vessels: {
    raft: 1383,       // ~23 min
    dugout: 3996,     // ~1h 7min
  },
  biomes: {
    coconut_grove: 261,
    rocky_shore: 613,
    bamboo_grove: 920,
    jungle_interior: 2303,
    nearby_island: 1869,
  },
  skillMilestones: {
    firstLevel10: 3533,   // ~59 min
    firstLevel15: 10817,  // ~3h
    firstLevel20: 35744,  // ~10h
  },
};

// How much the result can deviate from baseline before failing (fraction)
const TOLERANCE = 0.50; // 50% — wide to accommodate RNG + minor balance changes

const origRandom = Math.random;
let result: SimBenchmarks;

describe("simulation benchmarks", () => {
  beforeAll(() => {
    result = runSimulation(42);
  });

  afterAll(() => {
    // Restore Math.random in case the seeded RNG wasn't cleaned up
    Math.random = origRandom;
  });

  it("discovers all biomes", () => {
    expect(result.biomes["coconut_grove"]).toBeGreaterThan(0);
    expect(result.biomes["rocky_shore"]).toBeGreaterThan(0);
    expect(result.biomes["bamboo_grove"]).toBeGreaterThan(0);
    expect(result.biomes["jungle_interior"]).toBeGreaterThan(0);
    expect(result.biomes["nearby_island"]).toBeGreaterThan(0);
  });

  it("builds the raft", () => {
    expect(result.vessels.raft).not.toBeNull();
  });

  it("builds the dugout canoe", () => {
    expect(result.vessels.dugout).not.toBeNull();
  });

  it("raft time is within tolerance of baseline", () => {
    const raft = result.vessels.raft!;
    expect(raft).toBeGreaterThan(BASELINE.vessels.raft * (1 - TOLERANCE));
    expect(raft).toBeLessThan(BASELINE.vessels.raft * (1 + TOLERANCE));
  });

  it("dugout time is within tolerance of baseline", () => {
    const dugout = result.vessels.dugout!;
    expect(dugout).toBeGreaterThan(BASELINE.vessels.dugout * (1 - TOLERANCE));
    expect(dugout).toBeLessThan(BASELINE.vessels.dugout * (1 + TOLERANCE));
  });

  it("first skill level 10 is within tolerance", () => {
    expect(result.skillMilestones.firstLevel10).not.toBeNull();
    const t = result.skillMilestones.firstLevel10!;
    expect(t).toBeGreaterThan(BASELINE.skillMilestones.firstLevel10 * (1 - TOLERANCE));
    expect(t).toBeLessThan(BASELINE.skillMilestones.firstLevel10 * (1 + TOLERANCE));
  });

  it("first skill level 15 is within tolerance", () => {
    expect(result.skillMilestones.firstLevel15).not.toBeNull();
    const t = result.skillMilestones.firstLevel15!;
    expect(t).toBeGreaterThan(BASELINE.skillMilestones.firstLevel15 * (1 - TOLERANCE));
    expect(t).toBeLessThan(BASELINE.skillMilestones.firstLevel15 * (1 + TOLERANCE));
  });

  it("reaches at least 5 skills above level 10", () => {
    const above10 = Object.values(result.skillLevels).filter((l) => l >= 10).length;
    expect(above10).toBeGreaterThanOrEqual(5);
  });
});
