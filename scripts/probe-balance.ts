/**
 * One-off balance probe: how do different gear profiles perform against
 * every mainland venture? Used to diagnose "everything too easy" complaints.
 *
 * Run: npx tsx scripts/probe-balance.ts
 */
import { estimateWinRateFromStats, PlayerCombatStats } from "../src/engine/combat";
import { VENTURES } from "../src/data/ventures";

const RUNS = 2000;

const GEAR: Record<string, PlayerCombatStats> = {
  STARTER: {
    offense: 8, defense: 10, life: 13, attackSpeed: 3, speed: 3,
    endurance: 0, heatResist: 2, coldResist: 0, wetResist: 0, critChance: 0, critMultiplier: 0,
  },
  TIER1_COPPER: {
    offense: 16, defense: 35, life: 56, attackSpeed: 4, speed: 2,
    endurance: 3, heatResist: 1, coldResist: 3, wetResist: 3, critChance: 0, critMultiplier: 0,
  },
  TIER2_BRONZE: {
    offense: 20, defense: 53, life: 78, attackSpeed: 5, speed: -1,
    endurance: 3, heatResist: 0, coldResist: 4, wetResist: 4, critChance: 0, critMultiplier: 0,
  },
  // Actual player loadout from screenshot: bronze sword/helm/cuirass + coral buckler,
  // hide leggings, bamboo sandals, ruin-walker medallion. Some drop-rolled affixes
  // (Sharpened, Lightweight, Waterproof, Crystal-Hearted, Coral-Encrusted) but no
  // imbues, no iron/steel, no affix crafting.
  SCREENSHOT: {
    offense: 25, defense: 41, life: 70, attackSpeed: 5, speed: 17,
    endurance: 7, heatResist: 0, coldResist: 4, wetResist: 14, critChance: 0, critMultiplier: 0,
  },
  IRON_IMBUED: {
    offense: 31, defense: 74, life: 110, attackSpeed: 5, speed: -1,
    endurance: 9, heatResist: 7, coldResist: 12, wetResist: 12, critChance: 0, critMultiplier: 0,
  },
  STEEL_IMBUED: {
    offense: 37, defense: 90, life: 133, attackSpeed: 6, speed: 2,
    endurance: 10, heatResist: 7, coldResist: 13, wetResist: 13, critChance: 0, critMultiplier: 0,
  },
  STEEL_ENDGAME: {
    offense: 37, defense: 90, life: 133, attackSpeed: 6, speed: 2,
    endurance: 10, heatResist: 17, coldResist: 13, wetResist: 13, critChance: 0, critMultiplier: 0,
  },
};

const EXPED_ORDER = [
  "coastal_ruins",
  "tidal_caves",
  "overgrown_trail",
  "flooded_quarry",
  "ridge_pass",
  "sunken_temple",
  "volcanic_rift",
];

function pad(s: string, w: number) {
  return s.length >= w ? s.slice(0, w) : s + " ".repeat(w - s.length);
}

function pct(x: number) {
  return (x * 100).toFixed(0) + "%";
}

const header = ["GEAR \\ EXPED", ...EXPED_ORDER.map(s => pad(s, 18))].join("| ");
console.log("== win rate (success + partial) ==");
console.log(header);
for (const [gearName, player] of Object.entries(GEAR)) {
  const row: string[] = [pad(gearName, 18)];
  for (const expId of EXPED_ORDER) {
    const venture = VENTURES.find(v => v.id === expId)!;
    const r = estimateWinRateFromStats(player, venture, RUNS);
    row.push(pad(pct(r.winRate), 18));
  }
  console.log(row.join("| "));
}

console.log("\n== full-clear rate (success: all stages cleared, ≥50% HP) ==");
console.log(header);
for (const [gearName, player] of Object.entries(GEAR)) {
  const row: string[] = [pad(gearName, 18)];
  for (const expId of EXPED_ORDER) {
    const venture = VENTURES.find(v => v.id === expId)!;
    const r = estimateWinRateFromStats(player, venture, RUNS);
    row.push(pad(pct(r.success), 18));
  }
  console.log(row.join("| "));
}

console.log("\n== clear-or-partial breakdown for SCREENSHOT ==");
for (const expId of EXPED_ORDER) {
  const venture = VENTURES.find(v => v.id === expId)!;
  const r = estimateWinRateFromStats(GEAR.SCREENSHOT, venture, RUNS);
  console.log(
    `${pad(expId, 18)}  win=${pct(r.winRate)}  full=${pct(r.success)}  partial=${pct(r.partial)}  fail=${pct(r.failure)}`,
  );
}
