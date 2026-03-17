import { RESOURCES } from "../data/resources";
import { GameState } from "../data/types";
import { getMoraleDurationMultiplier, getStorageLimit } from "../engine/gameState";

export function ResourcePanel({ state }: { state: GameState }) {
  const entries = Object.entries(state.resources).filter(([, v]) => v > 0);
  const moraleEffect = getMoraleDurationMultiplier(state.morale);
  const moralePercent = Math.round((1 - moraleEffect) * 100);
  const moraleLabel =
    moralePercent > 0
      ? `${moralePercent}% faster`
      : moralePercent < 0
        ? `${-moralePercent}% slower`
        : "normal speed";

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
      <span
        className={`resource-chip morale-chip${state.morale <= 25 ? " low-morale" : ""}`}
        title={`Morale: ${moraleLabel}. Maintain Camp to boost.`}
      >
        Morale:{" "}
        <span className="amount">{state.morale}</span>
        <span className="morale-bar-mini">
          <span
            className="morale-bar-fill"
            style={{ width: `${state.morale}%` }}
          />
        </span>
      </span>
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
