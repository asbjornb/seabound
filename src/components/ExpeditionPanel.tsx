import { ExpeditionDef, GameState } from "../data/types";
import { getResource } from "../engine/gameState";

interface Props {
  expeditions: ExpeditionDef[];
  state: GameState;
  onStart: (expedition: ExpeditionDef) => void;
  busy: boolean;
}

function canAfford(exp: ExpeditionDef, state: GameState): boolean {
  if (!exp.foodCost) return true;
  return exp.foodCost.every(
    (c) => getResource(state, c.resourceId) >= c.amount
  );
}

export function ExpeditionPanel({
  expeditions,
  state,
  onStart,
  busy,
}: Props) {
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

      <div className="section-title" style={{ marginTop: 16 }}>
        Expeditions
      </div>
      {expeditions.map((exp) => {
        const affordable = canAfford(exp, state);
        const disabled = busy || !affordable;
        return (
          <div
            key={exp.id}
            className={`action-card ${disabled ? "disabled" : ""}`}
            onClick={() => !disabled && onStart(exp)}
          >
            <div className="action-card-header">
              <span className="action-name">{exp.name}</span>
              <span className="action-time">
                {(exp.durationMs / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="action-desc">{exp.description}</div>
            {exp.foodCost && exp.foodCost.length > 0 && (
              <div className="action-requires">
                Cost:{" "}
                {exp.foodCost.map((c, i) => (
                  <span key={i}>
                    {i > 0 && ", "}
                    <span
                      style={{
                        color:
                          getResource(state, c.resourceId) < c.amount
                            ? "#e74c3c"
                            : undefined,
                      }}
                    >
                      {c.amount}x {c.resourceId.replace(/_/g, " ")}
                    </span>
                  </span>
                ))}
              </div>
            )}
            <div className="action-xp">+{exp.xpGain} {exp.skillId} XP</div>
          </div>
        );
      })}
    </div>
  );
}
