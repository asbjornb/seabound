import { useMemo, useState } from "react";
import { getResources, getTools, getActions, getRecipes } from "../data/registry";
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

type FilterId = "all" | "food" | "tools" | "items";
type SortId = "name" | "quantity" | "fullness";
type ViewMode = "grid" | "list";

const FILTER_LABELS: Record<FilterId, string> = {
  all: "All",
  food: "Food",
  tools: "Tools",
  items: "Items",
};

const SORT_LABELS: Record<SortId, string> = {
  name: "Name",
  quantity: "Quantity",
  fullness: "Fullness",
};

export function InventoryPanel({ state }: { state: GameState }) {
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const [filter, setFilter] = useState<FilterId>("all");
  const [sort, setSort] = useState<SortId>("name");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const toolEnables = useMemo(buildToolEnablesMap, []);

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

  const searchLower = search.toLowerCase();

  // Filter resources
  const filteredResources = resourceEntries
    .filter(([id]) => {
      if (filter === "tools") return false;
      const def = RESOURCES[id];
      const tags = def?.tags ?? [];
      if (filter === "food" && !tags.includes("food")) return false;
      if (filter === "items" && tags.includes("food")) return false;
      // Search filter
      if (searchLower && !(def?.name ?? id).toLowerCase().includes(searchLower)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") {
        const nameA = (RESOURCES[a[0]]?.name ?? a[0]).toLowerCase();
        const nameB = (RESOURCES[b[0]]?.name ?? b[0]).toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sort === "quantity") {
        return b[1] - a[1]; // highest first
      }
      // fullness
      const fullA = a[1] / getStorageLimit(state, a[0]);
      const fullB = b[1] / getStorageLimit(state, b[0]);
      return fullB - fullA; // most full first
    });

  const showTools = filter === "all" || filter === "tools";

  // Filter tools by search
  const filteredTools = showTools && hasTools
    ? state.tools.filter((toolId) => {
        if (!searchLower) return true;
        const def = TOOLS[toolId];
        return (def?.name ?? toolId).toLowerCase().includes(searchLower);
      })
    : [];

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

      {/* Search + View Toggle */}
      <div className="inventory-toolbar">
        <input
          type="text"
          className="inventory-search"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="inventory-view-toggle"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
        >
          {viewMode === "grid" ? "☰" : "⊞"}
        </button>
      </div>

      {/* Filters + Sort */}
      <div className="inventory-controls">
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
        <select
          className="inventory-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortId)}
        >
          {Object.entries(SORT_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Tools section */}
      {filteredTools.length > 0 && (
        <div className="inventory-category">
          <h3 className="section-title">Tools</h3>
          {viewMode === "grid" ? (
            <div className="inventory-grid">
              {filteredTools.map((toolId) => {
                const def = TOOLS[toolId];
                const isSelected = selectedItem === `tool:${toolId}`;
                return (
                  <div
                    key={toolId}
                    className={`inventory-tile${isSelected ? " selected" : ""}`}
                    onClick={() => setSelectedItem(isSelected ? null : `tool:${toolId}`)}
                    title={def?.name ?? toolId}
                  >
                    <GameIcon id={toolId as ToolId} size={32} />
                    <span className="tile-name">{def?.name ?? toolId}</span>
                    {isSelected && (
                      <div className="tile-detail">
                        <div className="inventory-item-desc">
                          {def?.description}
                          {toolEnables[toolId] && (
                            <div className="tool-enables">
                              Enables: {toolEnables[toolId].join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="inventory-items">
              {filteredTools.map((toolId) => {
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
          )}
        </div>
      )}

      {/* Resources */}
      {filteredResources.length > 0 && (
        <div className="inventory-category">
          {filter !== "tools" && (
            <h3 className="section-title">
              {filter === "food" ? "Food" : "Items"}
              <span className="section-count"> ({filteredResources.length})</span>
            </h3>
          )}
          {viewMode === "grid" ? (
            <div className="inventory-grid">
              {filteredResources.map(([id, amount]) => {
                const def = RESOURCES[id];
                const limit = getStorageLimit(state, id);
                const atCap = isAtStorageCap(state, id);
                const fullness = amount / limit;
                const isSelected = selectedItem === id;
                return (
                  <div
                    key={id}
                    className={`inventory-tile${atCap ? " at-cap" : ""}${isSelected ? " selected" : ""}`}
                    onClick={() => setSelectedItem(isSelected ? null : id)}
                    title={`${def?.name ?? id}: ${amount}/${limit}`}
                  >
                    <GameIcon id={id as ResourceId} size={32} />
                    <span className={`tile-count${atCap ? " at-cap" : ""}`}>{amount}</span>
                    <div className="tile-fullness-bar">
                      <div
                        className={`tile-fullness-fill${fullness >= 0.9 ? " high" : fullness >= 0.6 ? " medium" : ""}`}
                        style={{ width: `${Math.min(100, fullness * 100)}%` }}
                      />
                    </div>
                    {isSelected && (
                      <div className="tile-detail">
                        <div className="tile-detail-name">{def?.name ?? id}</div>
                        <div className="tile-detail-amount">{amount} / {limit}</div>
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
                          {toolEnables[id] && (
                            <div className="tool-enables">
                              Enables: {toolEnables[id].join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
