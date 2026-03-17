import { useState } from "react";
import { RESOURCES } from "../data/resources";
import { ResourceCategory, GameState } from "../data/types";
import { getStorageLimit } from "../engine/gameState";

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

  return (
    <div className="inventory-panel">
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
