import { useState, useMemo } from "react";
import { getResources, getEquipmentItemById, getEquipmentSlots } from "../data/registry";
import type { CombatStage, EquipmentDropEntry, ExpeditionDef, GameState, LootDrop } from "../data/types";
import { computeLoadoutStats, estimateWinRate, estimateGradeDistribution, estimateStageClearRates, combatEstimationKey } from "../engine/combat";
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

function EquipmentDropList({ drops }: { drops: EquipmentDropEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  if (drops.length === 0) return null;

  const SLOTS = getEquipmentSlots();

  return (
    <div className="action-drops equipment-drops-section">
      <button
        className="drop-list-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
      >
        {expanded ? "Hide equipment drops" : `${drops.length} equipment drops...`}
      </button>
      {expanded && drops.map((d, i) => {
        const def = getEquipmentItemById(d.defId);
        const slotName = def ? (SLOTS[def.slot]?.name ?? def.slot) : "";
        return (
          <div key={i} className="drop-row equip-drop">
            <span className="equip-drop-slot">{slotName}</span>
            {def?.name ?? d.defId}{" "}
            ({(d.chance * 100).toFixed(d.chance < 0.01 ? 1 : 0)}%)
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

/** Format damage types for display. */
function formatDamageTypes(dmgTypes: { physical?: number; heat?: number; cold?: number; wet?: number }): string {
  const labels: string[] = [];
  if ((dmgTypes.physical ?? 0) > 0) labels.push(`${Math.round((dmgTypes.physical ?? 0) * 100)}% phys`);
  if ((dmgTypes.heat ?? 0) > 0) labels.push(`${Math.round((dmgTypes.heat ?? 0) * 100)}% heat`);
  if ((dmgTypes.cold ?? 0) > 0) labels.push(`${Math.round((dmgTypes.cold ?? 0) * 100)}% cold`);
  if ((dmgTypes.wet ?? 0) > 0) labels.push(`${Math.round((dmgTypes.wet ?? 0) * 100)}% wet`);
  return labels.join(", ");
}

/** Display per-stage rewards for a staged expedition. */
function StagedDropsDisplay({ stages, resources, state }: { stages: CombatStage[]; resources: Record<string, { name?: string }>; state: GameState }) {
  const [expanded, setExpanded] = useState(false);
  const SLOTS = getEquipmentSlots();

  const totalEquip = stages.reduce((sum, s) => sum + (s.equipmentDrops?.length ?? 0), 0);
  const totalLoot = stages.reduce((sum, s) => sum + (s.lootTable?.length ?? 0), 0);

  return (
    <div className="action-drops staged-drops-section">
      <button
        className="drop-list-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
      >
        {expanded ? "Hide stage rewards" : `${totalEquip} equipment, ${totalLoot} rare across ${stages.length} stages...`}
      </button>
      {expanded && stages.map((stage, si) => (
        <div key={si} className="staged-drop-group">
          <div className="staged-drop-label">Stage {si + 1}: {stage.name}</div>
          {stage.drops && stage.drops.map((d, i) => (
            <div key={`d${i}`} className="drop-row">
              <GameIcon id={d.resourceId} size={16} />
              {d.amount}x {resources[d.resourceId]?.name ?? d.resourceId}
            </div>
          ))}
          {stage.equipmentDrops && stage.equipmentDrops.map((d, i) => {
            const def = getEquipmentItemById(d.defId);
            const slotName = def ? (SLOTS[def.slot]?.name ?? def.slot) : "";
            return (
              <div key={`e${i}`} className="drop-row equip-drop">
                <span className="equip-drop-slot">{slotName}</span>
                {def?.name ?? d.defId}{" "}
                ({(d.chance * 100).toFixed(d.chance < 0.01 ? 1 : 0)}%)
              </div>
            );
          })}
          {stage.lootTable && stage.lootTable.map((d, i) => {
            const found = !!state.lootLog?.[d.resourceId];
            return (
              <div key={`l${i}`} className="drop-row loot-drop">
                <GameIcon id={d.resourceId} size={16} />
                {d.amount}x {resources[d.resourceId]?.name ?? d.resourceId}{" "}
                ({(d.chance * 100).toFixed(d.chance < 0.01 ? 1 : 0)}%)
                {found && <span className="loot-found-mark" title="Found!">&#10003;</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Show combat preview for staged expeditions. */
function StagedLoadoutPreview({ state, exp }: { state: GameState; exp: ExpeditionDef }) {
  const difficulty = exp.difficulty!;
  const stages = difficulty.stages!;
  const loadoutStats = computeLoadoutStats(state);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableKey = combatEstimationKey(state, difficulty);
  const clearRates = useMemo(() => estimateStageClearRates(state, stages, difficulty), [stableKey]);
  const winRate = useMemo(() => estimateWinRate(state, difficulty), [stableKey]);

  // Compute cumulative clear rates (chance of clearing at least stage N)
  const atLeast: number[] = [];
  for (let i = 0; i < stages.length; i++) {
    let rate = 0;
    for (let j = i + 1; j <= stages.length; j++) {
      rate += clearRates[j];
    }
    atLeast.push(rate);
  }

  // Collect dominant damage types across all stages for stat checks
  const allDmgTypes = new Set<string>();
  for (const stage of stages) {
    const dt = stage.enemy.damageTypes ?? { physical: 1.0 };
    if ((dt.heat ?? 0) > 0) allDmgTypes.add("heat");
    if ((dt.cold ?? 0) > 0) allDmgTypes.add("cold");
    if ((dt.wet ?? 0) > 0) allDmgTypes.add("wet");
  }
  const bossEnemy = stages[stages.length - 1].enemy;
  const playerOffense = loadoutStats["offense"] ?? 0;
  const playerDefense = loadoutStats["defense"] ?? 0;
  const playerLife = 50 + (loadoutStats["life"] ?? 0);

  return (
    <div className="loadout-preview">
      <div className="loadout-preview-title">
        Full Clear: <span style={{ color: winRateColor(winRate), fontWeight: 700 }}>{Math.round(winRate * 100)}%</span>
      </div>

      {/* Per-stage clear rates */}
      <div className="combat-stage-rates">
        {stages.map((stage, i) => {
          const rate = atLeast[i];
          return (
            <div key={i} className="combat-stage-row">
              <span className="combat-stage-name">{stage.name}</span>
              <span className="combat-stage-stats">
                {stage.enemy.hp} HP, {stage.enemy.damage} dmg
              </span>
              <span style={{ color: winRateColor(rate), fontWeight: 600 }}>
                {Math.round(rate * 100)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Stat comparison vs boss */}
      <div className="loadout-checks">
        <span className={`loadout-check${playerOffense > bossEnemy.defense ? " pass" : " fail"}`}>
          atk {playerOffense} vs def {bossEnemy.defense}
        </span>
        <span className={`loadout-check${playerDefense > 0 ? " pass" : " fail"}`}>
          def {playerDefense}
        </span>
        <span className={`loadout-check${playerLife > bossEnemy.damage * 5 ? " pass" : " fail"}`}>
          HP {playerLife}
        </span>
        {allDmgTypes.has("heat") && (
          <span className={`loadout-check${(loadoutStats["heatResist"] ?? 0) >= 3 ? " pass" : " fail"}`}>
            {formatStat("heatResist")} {loadoutStats["heatResist"] ?? 0}
          </span>
        )}
        {allDmgTypes.has("cold") && (
          <span className={`loadout-check${(loadoutStats["coldResist"] ?? 0) >= 3 ? " pass" : " fail"}`}>
            {formatStat("coldResist")} {loadoutStats["coldResist"] ?? 0}
          </span>
        )}
        {allDmgTypes.has("wet") && (
          <span className={`loadout-check${(loadoutStats["wetResist"] ?? 0) >= 3 ? " pass" : " fail"}`}>
            {formatStat("wetResist")} {loadoutStats["wetResist"] ?? 0}
          </span>
        )}
      </div>
      {exp.difficulty!.hint && winRate < 0.5 && (
        <div className="loadout-hint">{exp.difficulty!.hint}</div>
      )}
    </div>
  );
}

/** Show combat preview for single-enemy expeditions (legacy). */
function SingleLoadoutPreview({ state, exp }: { state: GameState; exp: ExpeditionDef }) {
  const enemy = exp.difficulty!.enemy!;
  const loadoutStats = computeLoadoutStats(state);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableKey = combatEstimationKey(state, exp.difficulty!);
  const winRate = useMemo(() => estimateWinRate(state, exp.difficulty!), [stableKey]);
  const grades = useMemo(() => estimateGradeDistribution(state, exp.difficulty!), [stableKey]);
  const winPct = Math.round(winRate * 100);

  const dmgTypes = enemy.damageTypes ?? { physical: 1.0 };
  const typeLabels = formatDamageTypes(dmgTypes);
  const playerOffense = loadoutStats["offense"] ?? 0;
  const playerDefense = loadoutStats["defense"] ?? 0;
  const playerLife = 50 + (loadoutStats["life"] ?? 0);

  return (
    <div className="loadout-preview">
      <div className="loadout-preview-title">
        Win Rate: <span style={{ color: winRateColor(winRate), fontWeight: 700 }}>{winPct}%</span>
      </div>

      <div className="combat-grade-bar" style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
        {grades.success > 0 && <div style={{ width: `${grades.success * 100}%`, background: "#2ecc71" }} />}
        {grades.partial > 0 && <div style={{ width: `${grades.partial * 100}%`, background: "#f0c040" }} />}
        {grades.failure > 0 && <div style={{ width: `${grades.failure * 100}%`, background: "#e74c3c" }} />}
      </div>
      <div className="combat-grade-legend">
        {grades.success > 0 && <span><span className="grade-dot" style={{ background: "#2ecc71" }} />{Math.round(grades.success * 100)}% full loot</span>}
        {grades.partial > 0 && <span><span className="grade-dot" style={{ background: "#f0c040" }} />{Math.round(grades.partial * 100)}% half loot</span>}
        {grades.failure > 0 && <span><span className="grade-dot" style={{ background: "#e74c3c" }} />{Math.round(grades.failure * 100)}% no rare loot</span>}
      </div>

      <div className="combat-enemy-info" style={{ fontSize: "0.85em", color: "var(--text-secondary)", marginBottom: 6 }}>
        <strong>{enemy.name}</strong> — {enemy.hp} HP, {enemy.damage} dmg ({typeLabels})
      </div>

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
      {exp.difficulty!.hint && winRate < 0.5 && (
        <div className="loadout-hint">{exp.difficulty!.hint}</div>
      )}
    </div>
  );
}

/** Dispatch to staged or single-enemy combat preview. */
function LoadoutPreview({ state, exp }: { state: GameState; exp: ExpeditionDef }) {
  if (!exp.difficulty) return null;
  if (exp.difficulty.stages && exp.difficulty.stages.length > 0) {
    return <StagedLoadoutPreview state={state} exp={exp} />;
  }
  if (exp.difficulty.enemy) {
    return <SingleLoadoutPreview state={state} exp={exp} />;
  }
  return null;
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
        const stages = exp.difficulty?.stages;
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
            {/* Stage-specific rewards (staged expeditions) */}
            {stages && stages.length > 0 && (
              <StagedDropsDisplay stages={stages} resources={RESOURCES} state={state} />
            )}
            {/* Legacy expedition-level loot/equipment */}
            {!stages && exp.lootTable && exp.lootTable.length > 0 && (
              <LootTableDisplay lootTable={exp.lootTable} resources={RESOURCES} state={state} />
            )}
            {!stages && exp.equipmentDrops && exp.equipmentDrops.length > 0 && (
              <EquipmentDropList drops={exp.equipmentDrops} />
            )}
          </div>
        );
      })}
    </div>
  );
}
