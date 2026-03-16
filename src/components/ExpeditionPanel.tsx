import { ExpeditionDef, GameState } from "../data/types";

interface Props {
  expeditions: ExpeditionDef[];
  state: GameState;
  onStart: (expedition: ExpeditionDef) => void;
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
            {b.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 16 }}>
        Expeditions
      </div>
      {expeditions.map((exp) => (
        <div
          key={exp.id}
          className="action-card"
          onClick={() => onStart(exp)}
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
                  <span>
                    {c.amount}x {c.resourceId.replace(/_/g, " ")}
                  </span>
                </span>
              ))}
            </div>
          )}
          <div className="action-xp">+15 navigation XP</div>
        </div>
      ))}
    </div>
  );
}
