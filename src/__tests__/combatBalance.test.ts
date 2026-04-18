import { describe, it, expect } from "vitest";
import { estimateWinRateFromStats, PlayerCombatStats } from "../engine/combat";
import { VENTURES } from "../data/ventures";

/**
 * Combat balance regression tests for staged combat.
 *
 * Each mainland venture now has 3 stages (gauntlet). Key metrics:
 * - winRate (success + partial): player cleared at least 1 stage
 * - success: player cleared ALL 3 stages with ≥50% HP (full clear)
 *
 * Uses high Monte Carlo runs (2000) for stable results, with wide
 * enough bands to absorb variance.
 */

const RUNS = 2000;

function getVenture(id: string) {
  const venture = VENTURES.find((v) => v.id === id);
  if (!venture) throw new Error(`Venture ${id} not found`);
  return venture;
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

/** Iron gear with all 6 imbues applied. */
const IRON_IMBUED: PlayerCombatStats = {
  offense: 31,      // iron_sword 26 + jungle_sap 5
  defense: 74,      // (shield 18 + cuirass 18 + helm 11 + greaves 13 + boots 9) + ruin_dust 5
  life: 110,        // (shield 22 + cuirass 30 + helm 15 + greaves 18 + boots 10) + quarry_crystal 15
  attackSpeed: 5,   // iron_sword
  speed: -1,        // sword 2 + shield -3 + greaves -1 + boots 1
  endurance: 9,     // cuirass 4 + temple_incense 5
  heatResist: 7,    // volcanic_shard
  coldResist: 12,   // helm 5 + ridge_frost 7
  wetResist: 12,    // boots 5 + tidal_salt 7
  critChance: 0,
  critMultiplier: 0,
};

/** Full steel gear, no affixes. */
const STEEL_GEAR: PlayerCombatStats = {
  offense: 32,      // steel_sword
  defense: 85,      // shield 22 + cuirass 22 + helm 14 + greaves 16 + boots 11
  life: 118,        // shield 28 + cuirass 38 + helm 18 + greaves 22 + boots 12
  attackSpeed: 6,   // steel_sword
  speed: 2,         // sword 3 + shield -2 + greaves -1 + boots 2
  endurance: 5,     // cuirass
  heatResist: 0,
  coldResist: 6,    // helm
  wetResist: 6,     // boots
  critChance: 0,
  critMultiplier: 0,
};

/** Steel gear with all 6 imbues applied. */
const STEEL_IMBUED: PlayerCombatStats = {
  offense: 37,      // 32 + jungle_sap 5
  defense: 90,      // 85 + ruin_dust 5
  life: 133,        // 118 + quarry_crystal 15
  attackSpeed: 6,
  speed: 2,
  endurance: 10,    // 5 + temple_incense 5
  heatResist: 7,    // volcanic_shard
  coldResist: 13,   // 6 + ridge_frost 7
  wetResist: 13,    // 6 + tidal_salt 7
  critChance: 0,
  critMultiplier: 0,
};

/** Steel gear + imbues + heat resist affix (realistic endgame for volcanic rift). */
const STEEL_ENDGAME: PlayerCombatStats = {
  ...STEEL_IMBUED,
  heatResist: 17,   // volcanic_shard 7 + affix_heat_resist 10
};

// ═══════════════════════════════════════
// Balance Tests — Stage Access (winRate = cleared at least 1 stage)
// ═══════════════════════════════════════

describe("combat balance: starter gear stage access", () => {
  it("coastal_ruins stage 1 should be clearable with starter gear", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getVenture("coastal_ruins"), RUNS);
    expect(result.winRate).toBeGreaterThanOrEqual(0.95);
  });

  it("tidal_caves stage 1 should be clearable with starter gear", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getVenture("tidal_caves"), RUNS);
    expect(result.winRate).toBeGreaterThanOrEqual(0.95);
  });

  it("overgrown_trail should be nearly impossible for starter gear", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getVenture("overgrown_trail"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.05);
  });

  it("ridge_pass should be impossible for starter gear", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getVenture("ridge_pass"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.01);
  });

  it("sunken_temple should be impossible for starter gear", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getVenture("sunken_temple"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.01);
  });

  it("volcanic_rift should be impossible for starter gear", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getVenture("volcanic_rift"), RUNS);
    expect(result.winRate).toBeLessThanOrEqual(0.01);
  });
});

// ═══════════════════════════════════════
// Balance Tests — Full Clear Progression (success = all 3 stages cleared)
// ═══════════════════════════════════════

describe("combat balance: entry tier full clears", () => {
  it("starter gear should NOT full-clear coastal_ruins (<5%)", () => {
    const result = estimateWinRateFromStats(STARTER_GEAR, getVenture("coastal_ruins"), RUNS);
    expect(result.success).toBeLessThanOrEqual(0.05);
  });

  it("tier 1 gear should full-clear coastal_ruins reliably (>90%)", () => {
    const result = estimateWinRateFromStats(TIER1_GEAR, getVenture("coastal_ruins"), RUNS);
    expect(result.success).toBeGreaterThanOrEqual(0.90);
  });

  it("tier 1 gear should full-clear tidal_caves sometimes (5-25%)", () => {
    const result = estimateWinRateFromStats(TIER1_GEAR, getVenture("tidal_caves"), RUNS);
    expect(result.success).toBeGreaterThanOrEqual(0.05);
    expect(result.success).toBeLessThanOrEqual(0.25);
  });
});

describe("combat balance: mid tier full clears", () => {
  it("tier 2 bronze should NOT full-clear overgrown_trail (<5%)", () => {
    const result = estimateWinRateFromStats(TIER2_GEAR, getVenture("overgrown_trail"), RUNS);
    expect(result.success).toBeLessThanOrEqual(0.05);
  });

  it("iron imbued should full-clear overgrown_trail reliably (>90%)", () => {
    const result = estimateWinRateFromStats(IRON_IMBUED, getVenture("overgrown_trail"), RUNS);
    expect(result.success).toBeGreaterThanOrEqual(0.90);
  });

  it("iron imbued should full-clear ridge_pass reliably (>90%)", () => {
    const result = estimateWinRateFromStats(IRON_IMBUED, getVenture("ridge_pass"), RUNS);
    expect(result.success).toBeGreaterThanOrEqual(0.90);
  });
});

describe("combat balance: high tier full clears", () => {
  it("iron imbued should struggle with sunken_temple (<10%)", () => {
    const result = estimateWinRateFromStats(IRON_IMBUED, getVenture("sunken_temple"), RUNS);
    expect(result.success).toBeLessThanOrEqual(0.10);
  });

  it("steel imbued should full-clear sunken_temple (>75%)", () => {
    const result = estimateWinRateFromStats(STEEL_IMBUED, getVenture("sunken_temple"), RUNS);
    expect(result.success).toBeGreaterThanOrEqual(0.75);
  });
});

describe("combat balance: endgame volcanic rift", () => {
  it("steel without heat resist should NOT full-clear volcanic_rift (<3%)", () => {
    const result = estimateWinRateFromStats(STEEL_GEAR, getVenture("volcanic_rift"), RUNS);
    expect(result.success).toBeLessThanOrEqual(0.03);
  });

  it("steel imbued (7 heatResist) should still struggle with volcanic_rift (<5%)", () => {
    // Even a single imbue isn't enough — need affix stacking too
    const result = estimateWinRateFromStats(STEEL_IMBUED, getVenture("volcanic_rift"), RUNS);
    expect(result.success).toBeLessThanOrEqual(0.05);
  });

  it("steel endgame (17 heatResist) should make volcanic_rift possible (10-30%)", () => {
    // Full endgame build: steel + imbues + heat resist affix. Aspirational content.
    const result = estimateWinRateFromStats(STEEL_ENDGAME, getVenture("volcanic_rift"), RUNS);
    expect(result.success).toBeGreaterThanOrEqual(0.10);
    expect(result.success).toBeLessThanOrEqual(0.30);
  });

  it("earlier expeditions should be trivial for endgame gear (>95%)", () => {
    const result = estimateWinRateFromStats(STEEL_IMBUED, getVenture("coastal_ruins"), RUNS);
    expect(result.success).toBeGreaterThanOrEqual(0.95);
  });
});
