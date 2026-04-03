import { useMemo, useState } from "react";
import { getResources, getTools, getActions, getRecipes, getStations, getExpeditions } from "../data/registry";
import { ResourceId, ToolId, GameState } from "../data/types";
import { getMoraleDurationMultiplier, getStorageLimit, isAtStorageCap, getStorageGroupMembers } from "../engine/gameState";
import { resourceHasUse } from "../engine/selectors";
import { GameIcon } from "./GameIcon";

/** Build a map of tool → list of action/recipe names it enables */
function buildToolEnablesMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const action of getActions()) {
    for (const toolId of action.requiredTools ?? []) {
      if (!map[toolId]) map[toolId] = [];
      map[toolId].push(action.name);
    }
  }
  for (const recipe of getRecipes()) {
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

/** Build a map of resource → list of source names (actions, recipes, stations, expeditions that produce it) */
function buildResourceSourceMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  const add = (resId: string, source: string) => {
    if (!map[resId]) map[resId] = [];
    if (!map[resId].includes(source)) map[resId].push(source);
  };
  for (const action of getActions()) {
    for (const drop of action.drops) {
      if ((drop.chance ?? 1) > 0) add(drop.resourceId, action.name);
    }
  }
  for (const recipe of getRecipes()) {
    if (recipe.output) add(recipe.output.resourceId, recipe.name);
  }
  for (const station of getStations()) {
    for (const y of station.yields) {
      if ((y.chance ?? 1) > 0) add(y.resourceId, station.name);
    }
  }
  for (const exp of getExpeditions()) {
    for (const outcome of exp.outcomes) {
      for (const drop of outcome.drops ?? []) {
        add(drop.resourceId, exp.name);
      }
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
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const [filter, setFilter] = useState<FilterId>("all");
  const toolEnables = useMemo(buildToolEnablesMap, []);
  const resourceSources = useMemo(buildResourceSourceMap, []);

  const resourceEntries = Object.entries(state.resources).filter(([id, v]) => {
    if (v <= 0) return false;
    const def = RESOURCES[id];
    // Always show food/water resources — they're consumed by expeditions, not just recipes
    if (def?.foodValue || def?.waterValue) return true;
    // Hide resources with no remaining use in any recipe
    if (!resourceHasUse(id, state)) return false;
    return true;
  });
  const hasTools = state.tools.length > 0;
  const hasFood = resourceEntries.some(([id]) => RESOURCES[id]?.tags?.includes("food"));
  const hasItems = resourceEntries.some(([id]) => !RESOURCES[id]?.tags?.includes("food"));

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
      ? `${moralePercent}% faster`
      : moralePercent < 0
        ? `${-moralePercent}% slower`
        : "normal speed";

  // Build filter buttons from what's present
  const presentFilters: FilterId[] = ["all"];
  if (hasFood) presentFilters.push("food");
  if (hasTools) presentFilters.push("tools");
  if (hasItems) presentFilters.push("items");

  // Filter resources
  const filteredResources = resourceEntries.filter(([id]) => {
    if (filter === "all") return true;
    const tags = RESOURCES[id]?.tags ?? [];
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
              const def = TOOLS[toolId];
              return (
                <div key={toolId} className="inventory-item">
                  <div className="inventory-item-header">
                    <span className="inventory-item-name">
                      <GameIcon id={toolId as ToolId} /> {def?.name ?? toolId}
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
              const def = RESOURCES[id];
              const limit = getStorageLimit(state, id);
              const atCap = isAtStorageCap(state, id);
              return (
                <div
                  key={id}
                  className={`inventory-item${atCap ? " at-cap" : ""}`}
                >
                  <div className="inventory-item-header">
                    <span className="inventory-item-name">
                      <GameIcon id={id as ResourceId} /> {def?.name ?? id}
                    </span>
                    <span className={`inventory-item-count${atCap ? " at-cap" : ""}`}>
                      {amount}/{limit}
                    </span>
                  </div>
                  <div className="inventory-item-desc">
                    {def?.description}
                    {(() => {
                      const groupMembers = getStorageGroupMembers(state, id);
                      if (groupMembers.length === 0) return null;
                      return (
                        <div className="storage-group-hint">
                          Shares storage with{" "}
                          {groupMembers.map((m, i) => (
                            <span key={m.id}>
                              {i > 0 && ", "}
                              <GameIcon id={m.id as ResourceId} size={16} />{m.name}
                              {m.amount > 0 && ` (${m.amount})`}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                    {resourceSources[id] && (
                      <div className="resource-sources">
                        From: {resourceSources[id].join(", ")}
                      </div>
                    )}
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
