import { useState } from "react";
import { getBuildings, getRecipes, getResources } from "../data/registry";
import { GameState, ResourceId } from "../data/types";
import { getEffectiveDecayInterval, getMoraleDurationMultiplier, getStorageLimit, MORALE_DECAY_INTERVAL_MS } from "../engine/gameState";
import { resourceHasUse } from "../engine/selectors";
import { GameIcon } from "./GameIcon";

export function ResourcePanel({ state }: { state: GameState }) {
  const RESOURCES = getResources();
  const [showMoraleTip, setShowMoraleTip] = useState(false);
  const entries = Object.entries(state.resources).filter(([id, v]) => {
    if (v <= 0) return false;
    const def = RESOURCES[id];
    // Always show food/water resources — they're consumed by expeditions, not just recipes
    if (def?.foodValue || def?.waterValue) return true;
    if (!resourceHasUse(id, state)) return false;
    return true;
  });
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
        onClick={() => setShowMoraleTip((v) => !v)}
        title={`${moraleLabel} — click for details`}
      >
        Morale:{" "}
        <span className="amount">{state.morale}</span>
        {moralePercent !== 0 && (
          <span className={`morale-speed-badge${moralePercent < 0 ? " negative" : ""}`}>
            {moralePercent > 0 ? `+${moralePercent}%` : `${moralePercent}%`}
          </span>
        )}
        <span className="morale-bar-mini">
          <span
            className="morale-bar-fill"
            style={{ width: `${Math.min(100, state.morale)}%` }}
          />
        </span>
      </span>
      {showMoraleTip && (
        <div className="morale-tooltip-expanded" onClick={() => setShowMoraleTip(false)}>
          <MoraleExplainer state={state} moraleLabel={moraleLabel} />
        </div>
      )}
      {entries.map(([id, amount]) => {
        const limit = getStorageLimit(state, id);
        const atCap = amount >= limit;
        return (
          <span
            key={id}
            className={`resource-chip${atCap ? " at-cap" : ""}`}
            title={RESOURCES[id]?.description}
          >
            <GameIcon id={id as ResourceId} size={16} /> {RESOURCES[id]?.name ?? id}
            <>
              :{" "}
              <span className="amount">
                {amount}/{limit}
              </span>
            </>
          </span>
        );
      })}
    </div>
  );
}

function MoraleExplainer({ state, moraleLabel }: { state: GameState; moraleLabel: string }) {
  const RECIPES = getRecipes();
  const BUILDINGS = getBuildings();

  const decayInterval = getEffectiveDecayInterval(state);
  const decayPerMin = (60000 / decayInterval).toFixed(1);
  const hasComfortBuilding = decayInterval > MORALE_DECAY_INTERVAL_MS;

  const moraleRecipes = RECIPES.filter((r) => r.moraleGain);
  const comfortBuildings = Object.values(BUILDINGS).filter((b) => b.comfortDecayReduction);

  return (
    <div className="morale-explainer">
      <div className="morale-explainer-header">
        <strong>Morale</strong> — {moraleLabel}
      </div>
      <div className="morale-explainer-section">
        <span className="morale-explainer-label">Speed effect</span>
        <span>High morale speeds up all actions (up to 20% faster at 100). Low morale slows them down (up to 20% slower at 0).</span>
      </div>
      <div className="morale-explainer-section">
        <span className="morale-explainer-label">Decay</span>
        <span>
          Loses {decayPerMin}/min while gathering or crafting. Does not decay while idle.
          {hasComfortBuilding && <span className="morale-explainer-note"> Slowed by your comfort building.</span>}
        </span>
      </div>
      <div className="morale-explainer-section">
        <span className="morale-explainer-label">Restore</span>
        {moraleRecipes.length > 0 ? (
          <span>
            {moraleRecipes.map((r, i) => (
              <span key={r.id}>
                {i > 0 && ", "}
                <strong>{r.name}</strong> (+{r.moraleGain})
              </span>
            ))}
          </span>
        ) : (
          <span>No morale recipes discovered yet.</span>
        )}
      </div>
      {comfortBuildings.length > 0 && (
        <div className="morale-explainer-section">
          <span className="morale-explainer-label">Comfort</span>
          <span>
            {comfortBuildings.map((b, i) => {
              const built = state.buildings.includes(b.id);
              return (
                <span key={b.id} className={built ? "morale-explainer-active" : ""}>
                  {i > 0 && ", "}
                  {b.name} ({Math.round((b.comfortDecayReduction ?? 0) * 100)}% slower decay)
                  {built && " \u2713"}
                </span>
              );
            })}
          </span>
        </div>
      )}
      <div className="morale-explainer-hint">Tap to close</div>
    </div>
  );
}
