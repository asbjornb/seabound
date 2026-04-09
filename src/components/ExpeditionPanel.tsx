import { useState } from "react";
import { getResources } from "../data/registry";
import type { DropRarity, ExpeditionDef, GameState, LootDrop } from "../data/types";
import { computeLoadoutStats, computeGearScore, estimateWinRate, computeCheckPassChance } from "../engine/combat";
import { getTotalFood, getTotalWater } from "../engine/gameState";
import { GameIcon } from "./GameIcon";
import { useItemLookup } from "./ItemLookup";

interface Props {
  expeditions: ExpeditionDef[];
  state: GameState;
  onStart: (expedition: ExpeditionDef) => void;
}

function canAfford(exp: ExpeditionDef, state: GameState): boolean {
  if (exp.foodCost && getTotalFood(state) < exp.foodCost) return false;
  if (exp.waterCost && getTotalWater(state) < exp.waterCost) return false;
  if (exp.inputs?.some((inp) => (state.resources[inp.resourceId] ?? 0) < inp.amount)) return false;
  return true;
}

function undiscoveredBiomeCount(exp: ExpeditionDef, state: GameState): number {
  const biomes = exp.outcomes
    .filter((o) => o.biomeDiscovery)
    .map((o) => o.biomeDiscovery!);
  return biomes.filter((b) => !state.discoveredBiomes.includes(b)).length;
}

/** Compute aggregated drop table from active outcomes, weighted by probability. */
function getEffectiveDrops(
  exp: ExpeditionDef,
  state: GameState,
): { resourceId: string; amount: number; chance: number }[] {
  // Filter outcomes the same way pickWeightedOutcome does
  const adjusted = exp.outcomes.map((o) => {
    if (o.biomeDiscovery && state.discoveredBiomes.includes(o.biomeDiscovery))
      return { ...o, weight: 0 };
    if (o.requiredBiomes) {
      for (const req of o.requiredBiomes) {
        if (!state.discoveredBiomes.includes(req)) return { ...o, weight: 0 };
      }
    }
    return o;
  });

  const totalWeight = adjusted.reduce((sum, o) => sum + o.weight, 0);
  if (totalWeight === 0) return [];

  // Aggregate: for each resource, sum probability * amount across outcomes
  const agg = new Map<string, { totalChance: number; amounts: number[] }>();
  for (const o of adjusted) {
    if (o.weight === 0 || !o.drops) continue;
    const outcomeProb = o.weight / totalWeight;
    for (const d of o.drops) {
      const dropChance = outcomeProb * (d.chance ?? 1);
      const entry = agg.get(d.resourceId) ?? { totalChance: 0, amounts: [] };
      entry.totalChance += dropChance;
      entry.amounts.push(d.amount);
      agg.set(d.resourceId, entry);
    }
  }

  return Array.from(agg.entries())
    .map(([resourceId, { totalChance, amounts }]) => ({
      resourceId,
      amount: Math.max(...amounts),
      chance: totalChance,
    }))
    .sort((a, b) => b.chance - a.chance);
}

/** Rarity color map for loot drop display. */
function rarityColor(rarity: DropRarity): string {
  switch (rarity) {
    case "uncommon": return "#2ecc71";
    case "rare": return "#3498db";
    case "epic": return "#9b59b6";
    case "legendary": return "#f39c12";
    default: return "var(--success)";
  }
}

function rarityLabel(rarity: DropRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

/** Collapse threshold — drop lists longer than this get a "show more" toggle. */
const DROP_LIST_COLLAPSE_THRESHOLD = 5;

function DropList({ drops, resources }: { drops: { resourceId: string; amount: number; chance: number }[]; resources: Record<string, { name?: string }> }) {
  const [expanded, setExpanded] = useState(false);
  if (drops.length === 0) return null;

  const shouldCollapse = drops.length > DROP_LIST_COLLAPSE_THRESHOLD;
  const visible = shouldCollapse && !expanded ? drops.slice(0, DROP_LIST_COLLAPSE_THRESHOLD) : drops;
  const hiddenCount = drops.length - DROP_LIST_COLLAPSE_THRESHOLD;

  return (
    <div className="action-drops">
      Loot table:
      {visible.map((d, i) => (
        <div key={i} className="drop-row">
          <GameIcon id={d.resourceId} size={16} />
          {d.amount}x {resources[d.resourceId]?.name ?? d.resourceId}{" "}
          ({Math.round(d.chance * 100)}%)
        </div>
      ))}
      {shouldCollapse && (
        <button
          className="drop-list-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? "Show less" : `+${hiddenCount} more...`}
        </button>
      )}
    </div>
  );
}

function LootTableDisplay({ lootTable, resources, state }: { lootTable: LootDrop[]; resources: Record<string, { name?: string }>; state: GameState }) {
  if (lootTable.length === 0) return null;

  // Sort by rarity: legendary > epic > rare > uncommon > common
  const rarityOrder: Record<DropRarity, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
  const sorted = [...lootTable].sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  return (
    <div className="action-drops loot-table-section">
      Rare drops:
      {sorted.map((d, i) => {
        const found = !!state.lootLog?.[d.resourceId];
        return (
          <div key={i} className={`drop-row loot-drop rarity-${d.rarity}`} style={{ color: rarityColor(d.rarity) }}>
            <GameIcon id={d.resourceId} size={16} />
            {d.amount}x {resources[d.resourceId]?.name ?? d.resourceId}{" "}
            <span className="loot-chance">({(d.chance * 100).toFixed(d.chance < 0.01 ? 1 : 0)}%)</span>
            <span className="loot-rarity-tag">{rarityLabel(d.rarity)}</span>
            {found && <span className="loot-found-mark" title="Found!">&#10003;</span>}
          </div>
        );
      })}
    </div>
  );
}

/** Colour a win rate percentage: red → yellow → green. */
function winRateColor(rate: number): string {
  if (rate < 0.2) return "#e74c3c";
  if (rate < 0.5) return "#f0c040";
  if (rate < 0.75) return "#8bc34a";
  return "#2ecc71";
}

/** Show current loadout stats vs expedition stat checks with win rate. */
function LoadoutPreview({ state, exp }: { state: GameState; exp: ExpeditionDef }) {
  if (!exp.difficulty) return null;

  const loadoutStats = computeLoadoutStats(state);
  const gearScore = computeGearScore(loadoutStats);
  const checks = exp.difficulty.statChecks;
  const winRate = estimateWinRate(state, exp.difficulty);
  const winPct = Math.round(winRate * 100);

  return (
    <div className="loadout-preview">
      <div className="loadout-preview-title">
        Win Rate: <span style={{ color: winRateColor(winRate), fontWeight: 700 }}>{winPct}%</span>
      </div>
      <div className="loadout-checks">
        {checks.map((c) => {
          const val = loadoutStats[c.stat] ?? 0;
          const chance = computeCheckPassChance(val, c.threshold);
          const chancePct = Math.round(chance * 100);
          return (
            <span
              key={c.stat}
              className={`loadout-check${chance >= 0.5 ? " pass" : " fail"}`}
              title={`${chancePct}% chance to pass this check`}
            >
              {c.stat.replace(/([A-Z])/g, " $1")} {val}/{c.threshold} ({chancePct}%)
            </span>
          );
        })}
        {exp.difficulty.minGearScore != null && (() => {
          const gsChance = computeCheckPassChance(gearScore, exp.difficulty.minGearScore!);
          const gsPct = Math.round(gsChance * 100);
          return (
            <span className={`loadout-check${gsChance >= 0.5 ? " pass" : " fail"}`}>
              gear score {gearScore}/{exp.difficulty.minGearScore} ({gsPct}%)
            </span>
          );
        })()}
      </div>
      {exp.difficulty.hint && winRate < 0.5 && (
        <div className="loadout-hint">{exp.difficulty.hint}</div>
      )}
    </div>
  );
}

export function ExpeditionPanel({
  expeditions,
  state,
  onStart,
}: Props) {
  const RESOURCES = getResources();
  const openLookup = useItemLookup();
  return (
    <div>
      <div className="section-title">Discovered Areas</div>
      <div className="biome-list">
        {state.discoveredBiomes.map((b) => (
          <span key={b} className="resource-chip">
            <GameIcon id={`biome_${b}`} size={16} /> {b.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 16 }}>
        Expeditions
      </div>
      {expeditions.map((exp) => {
        const affordable = canAfford(exp, state);
        const unfound = undiscoveredBiomeCount(exp, state);
        return (
          <div
            key={exp.id}
            className={`action-card ${!affordable ? "disabled" : ""}`}
            onClick={() => affordable && onStart(exp)}
          >
            <div className="action-card-header">
              <span className="action-name">{exp.name}</span>
              <span className="action-time">
                {(exp.durationMs / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="action-desc">{exp.description}</div>
            {unfound > 0 && (
              <div className="action-desc" style={{ fontStyle: "italic", color: "#f0c040" }}>
                {unfound} undiscovered {unfound === 1 ? "area" : "areas"} remaining
              </div>
            )}
            {exp.requiredVessel && (
              <div className="action-requires">
                Vessel: {RESOURCES[exp.requiredVessel]?.name ?? exp.requiredVessel}
              </div>
            )}
            {(exp.foodCost || exp.waterCost) && (
              <div className="action-requires">
                Cost:{" "}
                {exp.foodCost != null && exp.foodCost > 0 && (
                  <span
                    style={{
                      color:
                        getTotalFood(state) < exp.foodCost
                          ? "#e74c3c"
                          : undefined,
                    }}
                  >
                    {exp.foodCost} food ({getTotalFood(state)} available)
                  </span>
                )}
                {exp.foodCost && exp.waterCost && ", "}
                {exp.waterCost != null && exp.waterCost > 0 && (
                  <span
                    className="tappable-item"
                    style={{
                      color:
                        getTotalWater(state) < exp.waterCost
                          ? "#e74c3c"
                          : undefined,
                    }}
                    onClick={(e) => { e.stopPropagation(); openLookup("fresh_water"); }}
                  >
                    {exp.waterCost} water ({getTotalWater(state)} available)
                  </span>
                )}
              </div>
            )}
            {exp.waterCost != null && exp.waterCost > 0 && getTotalWater(state) < exp.waterCost && (
              <div className="action-desc" style={{ fontStyle: "italic", color: "#a0a0a0", fontSize: "0.85em" }}>
                Tap &ldquo;water&rdquo; above to see how to get it
              </div>
            )}
            {exp.inputs && exp.inputs.length > 0 && (
              <div className="action-requires">
                Requires:{" "}
                {exp.inputs.map((inp, i) => {
                  const have = state.resources[inp.resourceId] ?? 0;
                  const name = RESOURCES[inp.resourceId]?.name ?? inp.resourceId;
                  return (
                    <span key={inp.resourceId}>
                      {i > 0 && ", "}
                      <span className="tappable-item" style={{ color: have < inp.amount ? "#e74c3c" : undefined }} onClick={(e) => { e.stopPropagation(); openLookup(inp.resourceId); }}>
                        {inp.amount}x {name} ({have} available)
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="action-xp">+{exp.xpGain} {exp.skillId} XP</div>
            {exp.mainland && <LoadoutPreview state={state} exp={exp} />}
            <DropList drops={getEffectiveDrops(exp, state)} resources={RESOURCES} />
            {exp.lootTable && exp.lootTable.length > 0 && (
              <LootTableDisplay lootTable={exp.lootTable} resources={RESOURCES} state={state} />
            )}
          </div>
        );
      })}
    </div>
  );
}
