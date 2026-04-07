import { useState } from "react";
import { getResources } from "../data/registry";
import { ExpeditionDef, GameState } from "../data/types";
import { computeLoadoutStats, computeGearScore } from "../engine/combat";
import { getTotalFood, getTotalWater } from "../engine/gameState";
import { GameIcon } from "./GameIcon";

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

/** Show current loadout stats vs expedition stat checks. */
function LoadoutPreview({ state, exp }: { state: GameState; exp: ExpeditionDef }) {
  if (!exp.difficulty) return null;

  const loadoutStats = computeLoadoutStats(state);
  const gearScore = computeGearScore(loadoutStats);
  const checks = exp.difficulty.statChecks;
  const allPassing = checks.every((c) => (loadoutStats[c.stat] ?? 0) >= c.threshold) &&
    (exp.difficulty.minGearScore == null || gearScore >= exp.difficulty.minGearScore);

  return (
    <div className="loadout-preview">
      <div className="loadout-preview-title">
        Your Loadout {allPassing ? <span className="check-pass">Ready</span> : <span className="check-fail">Underprepared</span>}
      </div>
      <div className="loadout-checks">
        {checks.map((c) => {
          const val = loadoutStats[c.stat] ?? 0;
          const passing = val >= c.threshold;
          return (
            <span key={c.stat} className={`loadout-check${passing ? " pass" : " fail"}`}>
              {c.stat} {val}/{c.threshold}
            </span>
          );
        })}
        {exp.difficulty.minGearScore != null && (
          <span className={`loadout-check${gearScore >= exp.difficulty.minGearScore ? " pass" : " fail"}`}>
            gear score {gearScore}/{exp.difficulty.minGearScore}
          </span>
        )}
      </div>
      {exp.difficulty.hint && !allPassing && (
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
                    style={{
                      color:
                        getTotalWater(state) < exp.waterCost
                          ? "#e74c3c"
                          : undefined,
                    }}
                  >
                    {exp.waterCost} water ({getTotalWater(state)} available)
                  </span>
                )}
              </div>
            )}
            {exp.waterCost != null && exp.waterCost > 0 && getTotalWater(state) < exp.waterCost && (
              <div className="action-desc" style={{ fontStyle: "italic", color: "#a0a0a0", fontSize: "0.85em" }}>
                {!state.buildings.includes("well")
                  ? "Tip: Build a Well (Construction tab) to access fresh water"
                  : "Tip: Use \"Fill Water Pot\" in the Crafting tab to collect water"}
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
                      <span style={{ color: have < inp.amount ? "#e74c3c" : undefined }}>
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
          </div>
        );
      })}
    </div>
  );
}
