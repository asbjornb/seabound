import { EXPEDITIONS } from "../data/expeditions";
import { ExpeditionDef, GameState } from "../data/types";
import { getTotalFood } from "../engine/gameState";

interface Props {
  expeditions: ExpeditionDef[];
  state: GameState;
  onStart: (expedition: ExpeditionDef) => void;
}

function canAfford(exp: ExpeditionDef, state: GameState): boolean {
  if (!exp.foodCost) return true;
  return getTotalFood(state) >= exp.foodCost;
}

export function ExpeditionPanel({
  expeditions,
  state,
  onStart,
}: Props) {
  // Count total discoverable biomes from expedition outcomes (plus beach)
  const allBiomes = new Set(["beach"]);
  for (const exp of EXPEDITIONS) {
    for (const o of exp.outcomes) {
      if (o.biomeDiscovery) allBiomes.add(o.biomeDiscovery);
    }
  }
  const undiscoveredCount = allBiomes.size - state.discoveredBiomes.length;

  return (
    <div>
      <div className="section-title">Discovered Areas</div>
      <div className="biome-list">
        {state.discoveredBiomes.map((b) => (
          <span key={b} className="resource-chip">
            {b.replace(/_/g, " ")}
          </span>
        ))}
      </div>
      {undiscoveredCount > 0 && (
        <div className="action-desc" style={{ marginTop: 4, fontStyle: "italic" }}>
          {undiscoveredCount} undiscovered {undiscoveredCount === 1 ? "area" : "areas"} remaining…
        </div>
      )}

      <div className="section-title" style={{ marginTop: 16 }}>
        Expeditions
      </div>
      {expeditions.map((exp) => {
        const affordable = canAfford(exp, state);
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
            {exp.foodCost != null && exp.foodCost > 0 && (
              <div className="action-requires">
                Cost:{" "}
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
              </div>
            )}
            <div className="action-xp">+{exp.xpGain} {exp.skillId} XP</div>
          </div>
        );
      })}
    </div>
  );
}
