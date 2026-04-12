import { useMemo, useState } from "react";
import { getBuildings, getRecipes, getResources } from "../data/registry";
import { GameState, ResourceId } from "../data/types";
import { getEffectiveDecayInterval, getMoraleDurationMultiplier, getStorageLimit, isAtStorageCap, MORALE_DECAY_INTERVAL_MS } from "../engine/gameState";
import { resourceHasUse } from "../engine/selectors";
import { GameIcon } from "./GameIcon";
import { useItemLookup } from "./ItemLookup";

const STASH_THRESHOLD = 15;

export function ResourcePanel({ state, onToggleStash }: { state: GameState; onToggleStash: (id: string) => void }) {
  const RESOURCES = getResources();
  const openLookup = useItemLookup();
  const [showMoraleTip, setShowMoraleTip] = useState(false);
  const [stashOpen, setStashOpen] = useState(false);
  const [organizing, setOrganizing] = useState(false);

  const stashed = useMemo(() => new Set(state.stashedResources), [state.stashedResources]);

  const entries = Object.entries(state.resources).filter(([id, v]) => {
    if (v <= 0) return false;
    const def = RESOURCES[id];
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

  const hasStashedEntries = entries.some(([id]) => stashed.has(id));
  const useStashSections = entries.length > STASH_THRESHOLD || hasStashedEntries;
  const pinnedEntries = useStashSections ? entries.filter(([id]) => !stashed.has(id)) : entries;
  const stashedEntries = useStashSections ? entries.filter(([id]) => stashed.has(id)) : [];

  if (entries.length === 0) {
    return (
      <div className="resource-panel">
        <span className="resource-chip" style={{ opacity: 0.5 }}>
          No resources yet — start gathering!
        </span>
      </div>
    );
  }

  const renderChip = (id: string, amount: number) => {
    const limit = getStorageLimit(state, id);
    const atCap = isAtStorageCap(state, id);
    return (
      <span
        key={id}
        className={`resource-chip${atCap ? " at-cap" : ""}${organizing ? " organizing" : ""} tappable-item`}
        title={RESOURCES[id]?.description}
        onClick={organizing ? () => onToggleStash(id) : () => openLookup(id)}
      >
        <GameIcon id={id as ResourceId} size={16} /> {RESOURCES[id]?.name ?? id}
        <>
          :{" "}
          <span className="amount">
            {amount}/{limit}
          </span>
        </>
        {organizing && (
          <span className="stash-badge" title={stashed.has(id) ? "Show" : "Stash"}>
            {stashed.has(id) ? "+" : "−"}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="resource-panel">
      <span
        className={`resource-chip morale-chip${state.morale <= 25 ? " low-morale" : ""}`}
        onClick={() => setShowMoraleTip((v: boolean) => !v)}
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
      {pinnedEntries.map(([id, amount]) => renderChip(id, amount))}
      {useStashSections && stashedEntries.length > 0 && (
        <>
          <button
            className="resource-chip stash-toggle"
            onClick={() => setStashOpen((v: boolean) => !v)}
          >
            {stashOpen ? "▾" : "▸"} +{stashedEntries.length} more
          </button>
          {stashOpen && stashedEntries.map(([id, amount]) => renderChip(id, amount))}
        </>
      )}
      {useStashSections && (
        <button
          className={`resource-chip stash-organize-btn${organizing ? " active" : ""}`}
          onClick={() => setOrganizing((v: boolean) => !v)}
          title={organizing ? "Done organizing" : "Choose which items to stash"}
        >
          {organizing ? "Done" : "Organize"}
        </button>
      )}
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
