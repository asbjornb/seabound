import { RESOURCES } from "../data/resources";
import { GameState } from "../data/types";

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
      {entries.map(([id, amount]) => (
        <span key={id} className="resource-chip" title={RESOURCES[id]?.description}>
          {RESOURCES[id]?.name ?? id}: <span className="amount">{amount}</span>
        </span>
      ))}
    </div>
  );
}
