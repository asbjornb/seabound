import { RESOURCES } from "../data/resources";
import { GameState } from "../data/types";
import { getStorageLimit } from "../engine/gameState";

export function ResourcePanel({ state }: { state: GameState }) {
  const entries = Object.entries(state.resources).filter(([, v]) => v > 0);

  if (entries.length === 0) {
    return (
      <div className="resource-panel">
        <span className="resource-chip" style={{ opacity: 0.5 }}>
          No resources yet — start gathering!
        </span>
      </div>
    );
  }

  return (
    <div className="resource-panel">
      {entries.map(([id, amount]) => {
        const limit = getStorageLimit(state, id);
        const atCap = amount >= limit;
        return (
          <span
            key={id}
            className={`resource-chip${atCap ? " at-cap" : ""}`}
            title={RESOURCES[id]?.description}
          >
            {RESOURCES[id]?.name ?? id}:{" "}
            <span className="amount">
              {amount}/{limit}
            </span>
          </span>
        );
      })}
    </div>
  );
}
