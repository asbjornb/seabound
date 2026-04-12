import { useState, useMemo } from "react";
import { getResources } from "../data/registry";
import type { ExpeditionDef, GameState, LootDrop } from "../data/types";
import { computeLoadoutStats, estimateWinRate, estimateGradeDistribution } from "../engine/combat";
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

  return (
    <div className="action-drops loot-table-section">
      Bonus drops:
      {lootTable.map((d, i) => {
        const found = !!state.lootLog?.[d.resourceId];
        return (
          <div key={i} className="drop-row loot-drop">
            <GameIcon id={d.resourceId} size={16} />
            {d.amount}x {resources[d.resourceId]?.name ?? d.resourceId}{" "}
            ({(d.chance * 100).toFixed(d.chance < 0.01 ? 1 : 0)}%)
            {found && <span className="loot-found-mark" title="Found!">&#10003;</span>}
          </div>
        );
      })}
    </div>
  );
}

/** Colour a win rate percentage: red -> yellow -> green. */
function winRateColor(rate: number): string {
  if (rate < 0.2) return "#e74c3c";
  if (rate < 0.5) return "#f0c040";
  if (rate < 0.75) return "#8bc34a";
  return "#2ecc71";
}

/** Format a stat name for display. */
function formatStat(stat: string): string {
  return stat.replace(/([A-Z])/g, " $1").replace(/_/g, " ");
}

/** Show combat preview: enemy info, player stats comparison, grade distribution. */
function LoadoutPreview({ state, exp }: { state: GameState; exp: ExpeditionDef }) {
  if (!exp.difficulty) return null;

  const enemy = exp.difficulty.enemy;
  const loadoutStats = computeLoadoutStats(state);
  const winRate = useMemo(() => estimateWinRate(state, exp.difficulty!), [state, exp]);
  const grades = useMemo(() => estimateGradeDistribution(state, exp.difficulty!), [state, exp]);
  const winPct = Math.round(winRate * 100);

  // Determine primary damage types for display
  const dmgTypes = enemy.damageTypes ?? { physical: 1.0 };
  const typeLabels: string[] = [];
  if ((dmgTypes.physical ?? 0) > 0) typeLabels.push(`${Math.round((dmgTypes.physical ?? 0) * 100)}% physical`);
  if ((dmgTypes.heat ?? 0) > 0) typeLabels.push(`${Math.round((dmgTypes.heat ?? 0) * 100)}% heat`);
  if ((dmgTypes.cold ?? 0) > 0) typeLabels.push(`${Math.round((dmgTypes.cold ?? 0) * 100)}% cold`);
  if ((dmgTypes.wet ?? 0) > 0) typeLabels.push(`${Math.round((dmgTypes.wet ?? 0) * 100)}% wet`);

  // Key player stats for comparison
  const playerOffense = loadoutStats["offense"] ?? 0;
  const playerDefense = loadoutStats["defense"] ?? 0;
  const playerLife = 50 + (loadoutStats["life"] ?? 0);

  return (
    <div className="loadout-preview">
      <div className="loadout-preview-title">
        {grades.partial > 0 && grades.failure === 0
          ? <>Success Rate: <span style={{ color: winRateColor(grades.success), fontWeight: 700 }}>{Math.round(grades.success * 100)}%</span></>
          : <>Win Rate: <span style={{ color: winRateColor(winRate), fontWeight: 700 }}>{winPct}%</span></>
        }
      </div>

      {/* Grade distribution bar */}
      <div className="combat-grade-bar" style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
        {grades.success > 0 && <div style={{ width: `${grades.success * 100}%`, background: "#2ecc71" }} title={`Success: ${Math.round(grades.success * 100)}%`} />}
        {grades.partial > 0 && <div style={{ width: `${grades.partial * 100}%`, background: "#f0c040" }} title={`Partial: ${Math.round(grades.partial * 100)}%`} />}
        {grades.failure > 0 && <div style={{ width: `${grades.failure * 100}%`, background: "#e74c3c" }} title={`Failure: ${Math.round(grades.failure * 100)}%`} />}
      </div>

      {/* Grade breakdown text — show when not 100% one grade */}
      {(grades.success < 1 && grades.partial < 1 && grades.failure < 1) && (
        <div style={{ fontSize: "0.75em", color: "var(--text-secondary)", marginBottom: 8, display: "flex", gap: 8 }}>
          {grades.success > 0 && <span style={{ color: "#2ecc71" }}>{Math.round(grades.success * 100)}% full</span>}
          {grades.partial > 0 && <span style={{ color: "#f0c040" }}>{Math.round(grades.partial * 100)}% partial</span>}
          {grades.failure > 0 && <span style={{ color: "#e74c3c" }}>{Math.round(grades.failure * 100)}% fail</span>}
        </div>
      )}

      {/* Enemy info */}
      <div className="combat-enemy-info" style={{ fontSize: "0.85em", color: "var(--text-secondary)", marginBottom: 6 }}>
        <strong>{enemy.name}</strong> — {enemy.hp} HP, {enemy.damage} dmg ({typeLabels.join(", ")})
      </div>

      {/* Stat comparison */}
      <div className="loadout-checks">
        <span className={`loadout-check${playerOffense > enemy.defense ? " pass" : " fail"}`}>
          atk {playerOffense} vs def {enemy.defense}
        </span>
        <span className={`loadout-check${playerDefense > 0 ? " pass" : " fail"}`}>
          def {playerDefense}
        </span>
        <span className={`loadout-check${playerLife > enemy.damage * 5 ? " pass" : " fail"}`}>
          HP {playerLife}
        </span>
        {(dmgTypes.heat ?? 0) > 0 && (
          <span className={`loadout-check${(loadoutStats["heatResist"] ?? 0) >= 3 ? " pass" : " fail"}`}>
            {formatStat("heatResist")} {loadoutStats["heatResist"] ?? 0}
          </span>
        )}
        {(dmgTypes.cold ?? 0) > 0 && (
          <span className={`loadout-check${(loadoutStats["coldResist"] ?? 0) >= 3 ? " pass" : " fail"}`}>
            {formatStat("coldResist")} {loadoutStats["coldResist"] ?? 0}
          </span>
        )}
        {(dmgTypes.wet ?? 0) > 0 && (
          <span className={`loadout-check${(loadoutStats["wetResist"] ?? 0) >= 3 ? " pass" : " fail"}`}>
            {formatStat("wetResist")} {loadoutStats["wetResist"] ?? 0}
          </span>
        )}
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
