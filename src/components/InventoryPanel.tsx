import { useState } from "react";
import { RESOURCES } from "../data/resources";
import { ResourceCategory, GameState } from "../data/types";
import { getMoraleDurationMultiplier, getStorageLimit } from "../engine/gameState";

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  food: "Food",
  raw: "Raw Materials",
  processed: "Processed",
  tool: "Tools",
  structure: "Structures",
};

const CATEGORY_ORDER: ResourceCategory[] = [
  "food",
  "tool",
  "raw",
  "processed",
  "structure",
];

export function InventoryPanel({ state }: { state: GameState }) {
  const [filter, setFilter] = useState<ResourceCategory | "all">("all");
  const entries = Object.entries(state.resources).filter(([, v]) => v > 0);

  // Group by category
  const grouped: Record<string, { id: string; amount: number }[]> = {};
  for (const [id, amount] of entries) {
    const def = RESOURCES[id];
    const cat = def?.category ?? "raw";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ id, amount });
  }

  const presentCategories = CATEGORY_ORDER.filter((cat) => grouped[cat]);
  const visibleCategories =
    filter === "all" ? presentCategories : presentCategories.filter((c) => c === filter);

  if (entries.length === 0) {
    return (
      <div className="inventory-panel">
        <p className="empty-message">No items yet — start gathering!</p>
      </div>
    );
  }

  const moraleEffect = getMoraleDurationMultiplier(state.morale);
  const moralePercent = Math.round((1 - moraleEffect) * 100);
  const moraleLabel =
    moralePercent > 0
      ? `+${moralePercent}% speed`
      : moralePercent < 0
        ? `${moralePercent}% speed`
        : "normal";

  return (
    <div className="inventory-panel">
      <div className={`morale-display${state.morale <= 25 ? " low-morale" : ""}`}>
        <span className="morale-label">
          Morale: {state.morale} <span className="morale-effect">({moraleLabel})</span>
        </span>
        <div className="morale-bar">
          <div className="morale-bar-fill" style={{ width: `${Math.min(100, state.morale)}%` }} />
        </div>
      </div>
      <div className="inventory-filters">
        <button
          className={`inventory-filter${filter === "all" ? " active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {presentCategories.map((cat) => (
          <button
            key={cat}
            className={`inventory-filter${filter === cat ? " active" : ""}`}
            onClick={() => setFilter(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
      {visibleCategories.map((cat) => (
        <div key={cat} className="inventory-category">
          <h3 className="section-title">{CATEGORY_LABELS[cat]}</h3>
          <div className="inventory-items">
            {grouped[cat].map(({ id, amount }) => {
              const def = RESOURCES[id];
              const limit = getStorageLimit(state, id);
              const atCap = amount >= limit;
              return (
                <div
                  key={id}
                  className={`inventory-item${atCap ? " at-cap" : ""}`}
                >
                  <div className="inventory-item-header">
                    <span className="inventory-item-name">
                      {def?.name ?? id}
                    </span>
                    {cat !== "tool" && (
                      <span className={`inventory-item-count${atCap ? " at-cap" : ""}`}>
                        {amount}/{limit}
                      </span>
                    )}
                  </div>
                  <div className="inventory-item-desc">
                    {def?.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
