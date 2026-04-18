import { useMemo, useState } from "react";
import { getResources, getEquipmentItemById, getEquipmentSlots } from "../data/registry";
import type { GameState, VentureDef, VentureStage } from "../data/types";
import { computeLoadoutStats, estimateWinRate, estimateStageClearRates, combatEstimationKey } from "../engine/combat";
import { getTotalFood, getTotalWater } from "../engine/gameState";
import { GameIcon } from "./GameIcon";
import { useItemLookup } from "./ItemLookup";

interface Props {
  ventures: VentureDef[];
  state: GameState;
  onStart: (venture: VentureDef) => void;
}

function canAfford(v: VentureDef, state: GameState): boolean {
  if (v.foodCost && getTotalFood(state) < v.foodCost) return false;
  if (v.waterCost && getTotalWater(state) < v.waterCost) return false;
  if (v.inputs?.some((inp) => (state.resources[inp.resourceId] ?? 0) < inp.amount)) return false;
  return true;
}

function undiscoveredBiomeCount(v: VentureDef, state: GameState): number {
  const biomes = v.stages.filter((s) => s.biomeDiscovery).map((s) => s.biomeDiscovery!);
  return biomes.filter((b) => !state.discoveredBiomes.includes(b)).length;
}

function winRateColor(rate: number): string {
  if (rate < 0.2) return "#e74c3c";
  if (rate < 0.5) return "#f0c040";
  if (rate < 0.75) return "#8bc34a";
  return "#2ecc71";
}

function formatStat(stat: string): string {
  return stat.replace(/([A-Z])/g, " $1").replace(/_/g, " ");
}

function formatDropChance(chance: number | undefined): string {
  if (chance == null || chance >= 1) return "guaranteed";
  return `${(chance * 100).toFixed(chance < 0.01 ? 1 : 0)}%`;
}

function StagedDropsDisplay({ stages, resources, state }: { stages: VentureStage[]; resources: Record<string, { name?: string }>; state: GameState }) {
  const [expanded, setExpanded] = useState(false);
  const SLOTS = getEquipmentSlots();

  return (
    <div className="action-drops staged-drops-section">
      <button
        className="drop-list-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
      >
        {expanded ? "Hide stage rewards" : "Show stage rewards"}
      </button>
      {expanded && stages.map((stage, si) => (
        <div key={si} className="staged-drop-group">
          <div className="staged-drop-label">Stage {si + 1}: {stage.name}</div>
          {stage.drops && stage.drops.map((d, i) => (
            <div key={`d${i}`} className="drop-row">
              <GameIcon id={d.resourceId} size={16} />
              {d.amount}x {resources[d.resourceId]?.name ?? d.resourceId}{" "}
              ({formatDropChance(d.chance)})
            </div>
          ))}
          {stage.equipmentDrops && stage.equipmentDrops.map((d, i) => {
            const def = getEquipmentItemById(d.defId);
            const slotName = def ? (SLOTS[def.slot]?.name ?? def.slot) : "";
            return (
              <div key={`e${i}`} className="drop-row equip-drop">
                <span className="equip-drop-slot">{slotName}</span>
                {def?.name ?? d.defId}{" "}
                ({formatDropChance(d.chance)})
              </div>
            );
          })}
          {stage.lootTable && stage.lootTable.map((d, i) => {
            const found = !!state.lootLog?.[d.resourceId];
            return (
              <div key={`l${i}`} className="drop-row loot-drop">
                <GameIcon id={d.resourceId} size={16} />
                {d.amount}x {resources[d.resourceId]?.name ?? d.resourceId}{" "}
                ({formatDropChance(d.chance)})
                {found && <span className="loot-found-mark" title="Found!">&#10003;</span>}
              </div>
            );
          })}
          {stage.biomeDiscovery && !state.discoveredBiomes.includes(stage.biomeDiscovery) && (
            <div className="drop-row biome-drop">
              <GameIcon id={`biome_${stage.biomeDiscovery}`} size={16} />
              Discover: {stage.biomeDiscovery.replace(/_/g, " ")}{" "}
              ({formatDropChance(stage.biomeDiscoveryChance)})
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LoadoutPreview({ state, venture }: { state: GameState; venture: VentureDef }) {
  const stages = venture.stages;
  const loadoutStats = computeLoadoutStats(state);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableKey = combatEstimationKey(state, venture);
  const clearRates = useMemo(() => estimateStageClearRates(state, venture), [stableKey]);
  const winRate = useMemo(() => estimateWinRate(state, venture), [stableKey]);

  const atLeast: number[] = [];
  for (let i = 0; i < stages.length; i++) {
    let rate = 0;
    for (let j = i + 1; j <= stages.length; j++) {
      rate += clearRates[j];
    }
    atLeast.push(rate);
  }

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
      {venture.hint && winRate < 0.5 && (
        <div className="loadout-hint">{venture.hint}</div>
      )}
    </div>
  );
}

export function VenturePanel({ ventures, state, onStart }: Props) {
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
        Ventures
      </div>
      {ventures.map((venture) => {
        const affordable = canAfford(venture, state);
        const unfound = undiscoveredBiomeCount(venture, state);
        return (
          <div
            key={venture.id}
            className={`action-card ${!affordable ? "disabled" : ""}`}
            onClick={() => affordable && onStart(venture)}
          >
            <div className="action-card-header">
              <span className="action-name">{venture.name}</span>
              <span className="action-time">
                {(venture.durationMs / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="action-desc">{venture.description}</div>
            {unfound > 0 && (
              <div className="action-desc" style={{ fontStyle: "italic", color: "#f0c040" }}>
                {unfound} undiscovered {unfound === 1 ? "area" : "areas"} remaining
              </div>
            )}
            {(venture.foodCost || venture.waterCost) && (
              <div className="action-requires">
                Cost:{" "}
                {venture.foodCost != null && venture.foodCost > 0 && (
                  <span
                    style={{
                      color:
                        getTotalFood(state) < venture.foodCost
                          ? "#e74c3c"
                          : undefined,
                    }}
                  >
                    {venture.foodCost} food ({getTotalFood(state)} available)
                  </span>
                )}
                {venture.foodCost && venture.waterCost && ", "}
                {venture.waterCost != null && venture.waterCost > 0 && (
                  <span
                    className="tappable-item"
                    style={{
                      color:
                        getTotalWater(state) < venture.waterCost
                          ? "#e74c3c"
                          : undefined,
                    }}
                    onClick={(e) => { e.stopPropagation(); openLookup("fresh_water"); }}
                  >
                    {venture.waterCost} water ({getTotalWater(state)} available)
                  </span>
                )}
              </div>
            )}
            {venture.inputs && venture.inputs.length > 0 && (
              <div className="action-requires">
                Requires:{" "}
                {venture.inputs.map((inp, i) => {
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
            <div className="action-xp">+{venture.xpGain} {venture.skillId} XP</div>
            <LoadoutPreview state={state} venture={venture} />
            <StagedDropsDisplay stages={venture.stages} resources={RESOURCES} state={state} />
          </div>
        );
      })}
    </div>
  );
}
