import { useMemo, useState } from "react";
import { getDataPack } from "../data/dataPack";
import { RESOURCE_ICONS, TOOL_ICONS } from "../data/icons";
import { GameState } from "../data/types";
import { getMoraleDurationMultiplier, getStorageLimit } from "../engine/gameState";

/** Build a map of tool → list of action/recipe names it enables */
function buildToolEnablesMap(): Record<string, string[]> {
  const pack = getDataPack();
  const map: Record<string, string[]> = {};
  for (const action of pack.actions) {
    for (const toolId of action.requiredTools ?? []) {
      if (!map[toolId]) map[toolId] = [];
      map[toolId].push(action.name);
    }
  }
  for (const recipe of pack.recipes) {
    for (const toolId of recipe.requiredTools ?? []) {
      if (!map[toolId]) map[toolId] = [];
      map[toolId].push(recipe.name);
    }
    for (const itemId of recipe.requiredItems ?? []) {
      if (!map[itemId]) map[itemId] = [];
      map[itemId].push(recipe.name);
    }
  }
  return map;
}

type FilterId = "all" | "food" | "tools" | "items";

const FILTER_LABELS: Record<FilterId, string> = {
  all: "All",
  food: "Food",
  tools: "Tools",
  items: "Items",
};

export function InventoryPanel({ state }: { state: GameState }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const toolEnables = useMemo(buildToolEnablesMap, []);
  const pack = getDataPack();

  const resourceEntries = Object.entries(state.resources).filter(([, v]) => v > 0);
  const hasTools = state.tools.length > 0;
  const hasFood = resourceEntries.some(([id]) => pack.resources[id]?.tags?.includes("food"));
  const hasItems = resourceEntries.some(([id]) => !pack.resources[id]?.tags?.includes("food"));

  if (resourceEntries.length === 0 && !hasTools) {
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

  // Build filter buttons from what's present
  const presentFilters: FilterId[] = ["all"];
  if (hasFood) presentFilters.push("food");
  if (hasTools) presentFilters.push("tools");
  if (hasItems) presentFilters.push("items");

  // Filter resources
  const filteredResources = resourceEntries.filter(([id]) => {
    if (filter === "all") return true;
    const tags = pack.resources[id]?.tags ?? [];
    if (filter === "food") return tags.includes("food");
    if (filter === "items") return !tags.includes("food");
    return false; // "tools" filter hides resources
  });

  const showTools = filter === "all" || filter === "tools";

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
        {presentFilters.map((f) => (
          <button
            key={f}
            className={`inventory-filter${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Tools section */}
      {showTools && hasTools && (
        <div className="inventory-category">
          <h3 className="section-title">Tools</h3>
          <div className="inventory-items">
            {state.tools.map((toolId) => {
              const def = pack.tools[toolId];
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

      {/* Resources */}
      {filteredResources.length > 0 && (
        <div className="inventory-category">
          {filter !== "all" && filter !== "tools" && (
            <h3 className="section-title">{FILTER_LABELS[filter]}</h3>
          )}
          {filter === "all" && <h3 className="section-title">Items</h3>}
          <div className="inventory-items">
            {filteredResources.map(([id, amount]) => {
              const def = pack.resources[id];
              const limit = getStorageLimit(state, id);
              const atCap = amount >= limit;
              return (
                <div
                  key={id}
                  className={`inventory-item${atCap ? " at-cap" : ""}`}
                >
                  <div className="inventory-item-header">
                    <span className="inventory-item-name">
                      {RESOURCE_ICONS[id] ?? ""} {def?.name ?? id}
                    </span>
                    <span className={`inventory-item-count${atCap ? " at-cap" : ""}`}>
                      {amount}/{limit}
                    </span>
                  </div>
                  <div className="inventory-item-desc">
                    {def?.description}
                    {toolEnables[id] && (
                      <div className="tool-enables">
                        Enables: {toolEnables[id].join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
