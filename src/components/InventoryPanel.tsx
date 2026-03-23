import { useMemo, useState } from "react";
import { RESOURCE_ICONS, TOOL_ICONS } from "../data/icons";
import { RESOURCES } from "../data/resources";
import { TOOLS } from "../data/tools";
import { ACTIONS } from "../data/actions";
import { RECIPES } from "../data/recipes";
import { ResourceCategory, ResourceId, GameState } from "../data/types";
import { getMoraleDurationMultiplier, getStorageLimit } from "../engine/gameState";

/** Build a map of tool → list of action/recipe names it enables */
function buildToolEnablesMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const action of ACTIONS) {
    for (const toolId of action.requiredTools ?? []) {
      if (!map[toolId]) map[toolId] = [];
      map[toolId].push(action.name);
    }
  }
  for (const recipe of RECIPES) {
    for (const itemId of recipe.requiredItems ?? []) {
      if (!map[itemId]) map[itemId] = [];
      map[itemId].push(recipe.name);
    }
  }
  return map;
}

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  food: "Food",
  raw: "Raw Materials",
  processed: "Processed",
  structure: "Structures",
};

const CATEGORY_ORDER: ResourceCategory[] = [
  "food",
  "raw",
  "processed",
  "structure",
];

export function InventoryPanel({ state }: { state: GameState }) {
  const [filter, setFilter] = useState<ResourceCategory | "tools" | "all">("all");
  const toolEnables = useMemo(buildToolEnablesMap, []);
  const entries = Object.entries(state.resources).filter(([, v]) => v > 0);

  // Group by category
  const grouped: Record<string, { id: string; amount: number }[]> = {};
  for (const [id, amount] of entries) {
    const def = RESOURCES[id];
    const cat = def?.category ?? "raw";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ id, amount });
  }

  const hasTools = state.tools.length > 0;
  const presentCategories = CATEGORY_ORDER.filter((cat) => grouped[cat]);
  const visibleCategories =
    filter === "all" ? presentCategories : filter === "tools" ? [] : presentCategories.filter((c) => c === filter);
  const showTools = filter === "all" || filter === "tools";

  if (entries.length === 0 && !hasTools) {
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
        {hasTools && (
          <button
            className={`inventory-filter${filter === "tools" ? " active" : ""}`}
            onClick={() => setFilter("tools")}
          >
            Tools
          </button>
        )}
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
      {showTools && hasTools && (
        <div className="inventory-category">
          <h3 className="section-title">Tools</h3>
          <div className="inventory-items">
            {state.tools.map((toolId) => {
              const def = TOOLS[toolId];
              return (
                <div key={toolId} className="inventory-item">
                  <div className="inventory-item-header">
                    <span className="inventory-item-name">
                      {TOOL_ICONS[toolId] ?? ""} {def?.name ?? toolId}
                    </span>
                  </div>
                  <div className="inventory-item-desc">
                    {def?.description}
                    {toolEnables[toolId] && (
                      <div className="tool-enables">
                        Enables: {toolEnables[toolId].join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
                      {RESOURCE_ICONS[id as ResourceId] ?? ""} {def?.name ?? id}
                    </span>
                    <span className={`inventory-item-count${atCap ? " at-cap" : ""}`}>
                      {amount}/{limit}
                    </span>
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
