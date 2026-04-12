import { describe, it, expect } from "vitest";
import { estimateWinRateFromStats, PlayerCombatStats } from "../engine/combat";
import { MAINLAND_EXPEDITIONS } from "../data/expeditions";

/**
 * Combat balance regression tests.
 *
 * These verify that specific gear loadouts hit target win-rate bands
 * against each mainland expedition. Uses high Monte Carlo runs (2000)
 * for stable results, with wide enough bands to absorb variance.
 *
 * If a test fails, it means a data or formula change shifted balance
 * outside the intended range — investigate before adjusting the band.
 */

const RUNS = 2000;

function getExpedition(id: string) {
  const exp = MAINLAND_EXPEDITIONS.find((e) => e.id === id);
  if (!exp?.difficulty) throw new Error(`Expedition ${id} not found or has no difficulty`);
  return exp.difficulty;
}

// ═══════════════════════════════════════
// Gear Loadouts
// ═══════════════════════════════════════

/** Fire-hardened spear + bamboo sandals + bamboo buckler + woven fiber vest. No affixes, combat level 1. */
const STARTER_GEAR: PlayerCombatStats = {
  offense: 8,       // fire_hardened_spear
  defense: 10,      // buckler 5 + vest 4 + sandals 1
  life: 13,         // buckler 5 + vest 8
  attackSpeed: 3,   // fire_hardened_spear
  speed: 3,         // spear 1 + sandals 3 + buckler -1
  endurance: 0,
  heatResist: 2,    // vest
  coldResist: 0,
  wetResist: 0,
  critChance: 0,
  critMultiplier: 0,
};

/** Full tier 1 copper-era gear, no affixes, combat level ~5. Includes milestone bonuses. */
const TIER1_GEAR: PlayerCombatStats = {
  offense: 16,      // copper_spear 14 + milestone offense +2 (lvl 2, 10)
  defense: 35,      // shield 10 + hide_armor 8 + cap 5 + leggings 6 + boots 4 + milestone +2
  life: 56,         // shield 12 + armor 15 + cap 8 + leggings 10 + boots 6 + milestone +5
  attackSpeed: 4,   // copper_spear
  speed: 2,         // spear 1 + shield -2 + leggings 1 + boots 2
  endurance: 3,     // armor 2 + milestone +1
  heatResist: 1,    // milestone heat acclimation
  coldResist: 3,    // cap
  wetResist: 3,     // boots
  critChance: 0,
  critMultiplier: 0,
};

/** Tier 1 gear with good affixes (sharp weapon, reinforced armor, vital helm). */
const TIER1_GEARED: PlayerCombatStats = {
  offense: 22,      // copper_spear 14 + affix_sharp ~6 + milestones 2
  defense: 42,      // tier1 base 33 + affix_reinforced ~7 + milestones 2
  life: 70,         // tier1 base 51 + affix_vital ~14 + milestones 5
  attackSpeed: 4,
  speed: 5,         // tier1 base 2 + affix_light ~3
  endurance: 5,     // armor 2 + affix_enduring ~2 + milestone 1
  heatResist: 1,
  coldResist: 3,
  wetResist: 3,
  critChance: 0,
  critMultiplier: 0,
};

/** Full tier 2 bronze gear, no affixes. */
const TIER2_GEAR: PlayerCombatStats = {
  offense: 20,      // bronze_sword
  defense: 53,      // shield 14 + cuirass 14 + helm 8 + greaves 10 + boots 7
  life: 78,         // shield 18 + cuirass 25 + helm 12 + greaves 15 + boots 8
  attackSpeed: 5,   // bronze_sword
  speed: -1,        // sword 2 + shield -3 + greaves -1 + boots 1
  endurance: 3,     // cuirass
  heatResist: 0,
  coldResist: 4,    // helm
  wetResist: 4,     // boots
  critChance: 0,
  critMultiplier: 0,
};

// ═══════════════════════════════════════
// Balance Tests
// ═══════════════════════════════════════

describe("combat balance: starter gear", () => {
  it("coastal_ruins should be doable but hard (~30-55% win rate)", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getExpedition("coastal_ruins"), RUNS);
    expect(result.winRate).toBeGreaterThanOrEqual(0.25);
    expect(result.winRate).toBeLessThanOrEqual(0.55);
  });

  it("tidal_caves should be very hard (<15% win rate)", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getExpedition("tidal_caves"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.15);
  });

  it("overgrown_trail should be near-impossible (<5% win rate)", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getExpedition("overgrown_trail"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.05);
  });

  it("flooded_quarry should be near-impossible (<5% win rate)", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getExpedition("flooded_quarry"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.05);
  });

  it("ridge_pass should be near-impossible (<5% win rate)", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getExpedition("ridge_pass"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.05);
  });

  it("sunken_temple should be impossible (<1% win rate)", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getExpedition("sunken_temple"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.01);
  });

  it("volcanic_rift should be impossible (<1% win rate)", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getExpedition("volcanic_rift"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.01);
  });
});

describe("combat balance: tier 1 gear progression", () => {
  it("coastal_ruins should be comfortable with tier 1 gear (>80%)", () => {
    const result = estimateWinRateFromStats(TIER1_GEAR, getExpedition("coastal_ruins"), RUNS);
    expect(result.winRate).toBeGreaterThanOrEqual(0.80);
  });

  it("tidal_caves should be comfortable with tier 1 gear (>70%)", () => {
    const result = estimateWinRateFromStats(TIER1_GEAR, getExpedition("tidal_caves"), RUNS);
    expect(result.winRate).toBeGreaterThanOrEqual(0.70);
  });

  it("overgrown_trail should be a coin flip with tier 1 gear (30-70%)", () => {
    const result = estimateWinRateFromStats(TIER1_GEAR, getExpedition("overgrown_trail"), RUNS);
    expect(result.winRate).toBeGreaterThanOrEqual(0.30);
    expect(result.winRate).toBeLessThanOrEqual(0.70);
  });

  it("overgrown_trail should be comfortable with geared tier 1 (>65%)", () => {
    const result = estimateWinRateFromStats(TIER1_GEARED, getExpedition("overgrown_trail"), RUNS);
    expect(result.winRate).toBeGreaterThanOrEqual(0.65);
  });

  it("sunken_temple should still be very hard for tier 1 (<15%)", () => {
    const result = estimateWinRateFromStats(TIER1_GEAR, getExpedition("sunken_temple"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.15);
  });
});

describe("combat balance: tier 2 gear progression", () => {
  it("sunken_temple should be doable with tier 2 gear (>50%)", () => {
    const result = estimateWinRateFromStats(TIER2_GEAR, getExpedition("sunken_temple"), RUNS);
    expect(result.winRate).toBeGreaterThanOrEqual(0.50);
  });

  it("volcanic_rift should still be hard without heat resist (<30%)", () => {
    // Tier 2 bronze gear has no heat resist — volcanic rift punishes this
    const result = estimateWinRateFromStats(TIER2_GEAR, getExpedition("volcanic_rift"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.30);
  });
});
