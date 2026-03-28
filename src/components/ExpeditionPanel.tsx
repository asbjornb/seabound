import { RESOURCES } from "../data/resources";
import { ExpeditionDef, GameState } from "../data/types";
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
  return true;
}

function undiscoveredBiomeCount(exp: ExpeditionDef, state: GameState): number {
  const biomes = exp.outcomes
    .filter((o) => o.biomeDiscovery)
    .map((o) => o.biomeDiscovery!);
  return biomes.filter((b) => !state.discoveredBiomes.includes(b)).length;
}

export function ExpeditionPanel({
  expeditions,
  state,
  onStart,
}: Props) {
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
            <div className="action-xp">+{exp.xpGain} {exp.skillId} XP</div>
          </div>
        );
      })}
    </div>
  );
}
