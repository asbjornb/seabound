import { useMemo, useState } from "react";
import { getResources, getTools, getActions, getRecipes, getStations, getExpeditions, getEquipmentSlots, getEquipmentItemById, getAffixById, getRepairRecipes, getSalvageTables } from "../data/registry";
import { ResourceId, ToolId, GameState, EquipmentItem, RepairRecipeDef, SalvageTableDef } from "../data/types";
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

type EquipSortKey = "name" | "tier" | "slot";

const EQUIP_SORT_LABELS: Record<EquipSortKey, string> = {
  name: "Name",
  tier: "Tier",
  slot: "Slot",
};

const CONDITION_LABELS: Record<string, string> = {
  pristine: "Pristine",
  worn: "Worn",
  damaged: "Damaged",
  broken: "Broken",
};

function sortEquipment(items: EquipmentItem[], sortBy: EquipSortKey): EquipmentItem[] {
  const SLOTS = getEquipmentSlots();
  return [...items].sort((a, b) => {
    const defA = getEquipmentItemById(a.defId);
    const defB = getEquipmentItemById(b.defId);
    if (!defA || !defB) return 0;
    switch (sortBy) {
      case "name":
        return defA.name.localeCompare(defB.name);
      case "tier":
        return defB.tier - defA.tier || defA.name.localeCompare(defB.name);
      case "slot":
        return (SLOTS[defA.slot]?.order ?? 99) - (SLOTS[defB.slot]?.order ?? 99) || defA.name.localeCompare(defB.name);
    }
  });
}

type ViewMode = "list" | "grid";

export function InventoryPanel({ state, highlightedResources, onRepairItem, onSalvageItem, onEquipItem, onDiscardItem }: { state: GameState; highlightedResources?: Set<string>; onRepairItem?: (instanceId: string) => void; onSalvageItem?: (instanceId: string) => void; onEquipItem?: (instanceId: string) => void; onDiscardItem?: (instanceId: string) => void }) {
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [equipSlotFilter, setEquipSlotFilter] = useState<string>("all");
  const [equipSort, setEquipSort] = useState<EquipSortKey>("slot");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try { return (localStorage.getItem("sb_inv_view") as ViewMode) ?? "list"; } catch { return "list"; }
  });
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

  const searchLower = search.toLowerCase();

  // Filter resources
  const filteredResources = resourceEntries.filter(([id]) => {
    if (filter === "tools") return false;
    if (filter === "food" && !RESOURCES[id]?.tags?.includes("food")) return false;
    if (filter === "items" && RESOURCES[id]?.tags?.includes("food")) return false;
    if (searchLower && !(RESOURCES[id]?.name ?? id).toLowerCase().includes(searchLower)) return false;
    return true;
  });

  const showTools = filter === "all" || filter === "tools";
  const filteredTools = state.tools.filter((toolId) => {
    if (!searchLower) return true;
    return (TOOLS[toolId]?.name ?? toolId).toLowerCase().includes(searchLower);
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev: string | null) => (prev === id ? null : id));
  };

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
        <button
          className="inventory-view-toggle"
          onClick={() => {
            const next = viewMode === "list" ? "grid" : "list";
            setViewMode(next);
            try { localStorage.setItem("sb_inv_view", next); } catch { /* */ }
          }}
          title={viewMode === "list" ? "Compact grid view" : "List view"}
        >
          {viewMode === "list" ? "⊞" : "☰"}
        </button>
      </div>
      <input
        type="text"
        className="inventory-search"
        placeholder="Search items…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Resources */}
      {filteredResources.length > 0 && (
        <div className="inventory-category">
          {filter !== "all" && filter !== "tools" && (
            <h3 className="section-title">{FILTER_LABELS[filter]}</h3>
          )}
          {filter === "all" && <h3 className="section-title">Items</h3>}
          {viewMode === "grid" ? (
            <div className="inventory-grid">
              {filteredResources.map(([id, amount]) => {
                const def = RESOURCES[id];
                const limit = getStorageLimit(state, id);
                const atCap = isAtStorageCap(state, id);
                const isHighlighted = highlightedResources?.has(id);
                return (
                  <div
                    key={id}
                    className={`inventory-grid-cell${atCap ? " at-cap" : ""}${isHighlighted ? " highlighted" : ""}`}
                    title={`${def?.name ?? id}: ${amount}/${limit}`}
                  >
                    <GameIcon id={id as ResourceId} size={28} />
                    <span className={`grid-cell-count${atCap ? " at-cap" : ""}`}>{amount}</span>
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
                const isHighlighted = highlightedResources?.has(id);
                const isExpanded = expandedId === id;
                return (
                  <div
                    key={id}
                    className={`inventory-item${atCap ? " at-cap" : ""}${isHighlighted ? " highlighted" : ""}${isExpanded ? " expanded" : ""}`}
                    onClick={() => toggleExpand(id)}
                  >
                    <div className="inventory-item-header">
                      <span className="inventory-item-name">
                        <GameIcon id={id as ResourceId} /> {def?.name ?? id}
                      </span>
                      <span className={`inventory-item-count${atCap ? " at-cap" : ""}`}>
                        {amount}/{limit}
                      </span>
                    </div>
                    {isExpanded && (
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tools section — below items since tools don't change often */}
      {showTools && filteredTools.length > 0 && (
        <div className="inventory-category">
          <h3 className="section-title">Tools</h3>
          {viewMode === "grid" ? (
            <div className="inventory-grid">
              {filteredTools.map((toolId) => {
                const def = TOOLS[toolId];
                return (
                  <div
                    key={toolId}
                    className="inventory-grid-cell"
                    title={def?.name ?? toolId}
                  >
                    <GameIcon id={toolId as ToolId} size={28} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="inventory-items">
              {filteredTools.map((toolId) => {
                const def = TOOLS[toolId];
                const isExpanded = expandedId === `tool:${toolId}`;
                return (
                  <div
                    key={toolId}
                    className={`inventory-item${isExpanded ? " expanded" : ""}`}
                    onClick={() => toggleExpand(`tool:${toolId}`)}
                  >
                    <div className="inventory-item-header">
                      <span className="inventory-item-name">
                        <GameIcon id={toolId as ToolId} /> {def?.name ?? toolId}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="inventory-item-desc">
                        {def?.description}
                        {toolEnables[toolId] && (
                          <div className="tool-enables">
                            Enables: {toolEnables[toolId].join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Equipment section — shows when player has equipment items */}
      {state.equipmentInventory.length > 0 && (
        <EquipmentSection
          items={state.equipmentInventory}
          loadout={state.loadout}
          state={state}
          search={searchLower}
          slotFilter={equipSlotFilter}
          onSlotFilter={setEquipSlotFilter}
          sortBy={equipSort}
          onSort={setEquipSort}
          expandedId={expandedId}
          onToggleExpand={toggleExpand}
          onRepairItem={onRepairItem}
          onSalvageItem={onSalvageItem}
          onEquipItem={onEquipItem}
          onDiscardItem={onDiscardItem}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// Equipment Section (extracted for clarity)
// ═══════════════════════════════════════

const NEXT_CONDITION_LABEL: Record<string, string> = {
  broken: "Damaged",
  damaged: "Worn",
  worn: "Pristine",
};

/** Find the salvage table that applies to an equipment item, if any. */
function findSalvageTable(item: EquipmentItem): SalvageTableDef | undefined {
  const def = getEquipmentItemById(item.defId);
  if (!def?.tags) return undefined;
  return getSalvageTables().find((t) =>
    t.targetTags.some((tag) => def.tags!.includes(tag))
  );
}

/** Check if the player meets salvage requirements (skill level). */
function meetsSalvageRequirements(table: SalvageTableDef, state: GameState): boolean {
  const smithingLevel = state.skills["smithing"]?.level ?? 0;
  return smithingLevel >= table.requiredSkillLevel;
}

/** Find the repair recipe that applies to an equipment item, if any. */
function findRepairRecipe(item: EquipmentItem): RepairRecipeDef | undefined {
  const def = getEquipmentItemById(item.defId);
  if (!def?.tags) return undefined;
  return getRepairRecipes().find((r) =>
    r.targetTags.some((tag) => def.tags!.includes(tag))
  );
}

/** Check if the player can afford a repair. */
function canAffordRepair(recipe: RepairRecipeDef, state: GameState): boolean {
  for (const inp of recipe.inputs) {
    if ((state.resources[inp.resourceId] ?? 0) < inp.amount) return false;
  }
  return true;
}

/** Check if the player meets repair requirements (skill + buildings). */
function meetsRepairRequirements(recipe: RepairRecipeDef, state: GameState): boolean {
  const smithingLevel = state.skills["smithing"]?.level ?? 0;
  if (smithingLevel < recipe.requiredSkillLevel) return false;
  if (recipe.requiredBuildings?.some((b) => !state.buildings.includes(b))) return false;
  return true;
}

function EquipmentSection({
  items,
  loadout,
  state,
  search,
  slotFilter,
  onSlotFilter,
  sortBy,
  onSort,
  expandedId,
  onToggleExpand,
  onRepairItem,
  onSalvageItem,
  onEquipItem,
  onDiscardItem,
}: {
  items: EquipmentItem[];
  loadout: GameState["loadout"];
  state: GameState;
  search: string;
  slotFilter: string;
  onSlotFilter: (s: string) => void;
  sortBy: EquipSortKey;
  onSort: (s: EquipSortKey) => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onRepairItem?: (instanceId: string) => void;
  onSalvageItem?: (instanceId: string) => void;
  onEquipItem?: (instanceId: string) => void;
  onDiscardItem?: (instanceId: string) => void;
}) {
  const SLOTS = getEquipmentSlots();
  const equippedIds = new Set(Object.values(loadout).filter((id): id is string => id != null));
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null);

  // Filter by slot and search
  const filtered = items.filter((item) => {
    const def = getEquipmentItemById(item.defId);
    if (!def) return false;
    if (slotFilter !== "all" && def.slot !== slotFilter) return false;
    if (search && !def.name.toLowerCase().includes(search)) return false;
    return true;
  });

  const sorted = useMemo(() => sortEquipment(filtered, sortBy), [filtered, sortBy]);

  // Slot filter buttons: only show slots the player has items for
  const presentSlots = useMemo(() => {
    const slotSet = new Set<string>();
    for (const item of items) {
      const def = getEquipmentItemById(item.defId);
      if (def) slotSet.add(def.slot);
    }
    return Object.values(SLOTS)
      .filter((s) => slotSet.has(s.id))
      .sort((a, b) => a.order - b.order);
  }, [items, SLOTS]);

  if (sorted.length === 0 && slotFilter === "all" && !search) return null;

  return (
    <div className="inventory-category">
      <h3 className="section-title">Equipment ({items.length})</h3>
      <div className="inventory-filters">
        <button
          className={`inventory-filter${slotFilter === "all" ? " active" : ""}`}
          onClick={() => onSlotFilter("all")}
        >
          All
        </button>
        {presentSlots.map((slot) => (
          <button
            key={slot.id}
            className={`inventory-filter${slotFilter === slot.id ? " active" : ""}`}
            onClick={() => onSlotFilter(slot.id)}
          >
            {slot.name}
          </button>
        ))}
      </div>
      <div className="equip-sort-row">
        <span className="equip-sort-label">Sort:</span>
        {(Object.keys(EQUIP_SORT_LABELS) as EquipSortKey[]).map((key) => (
          <button
            key={key}
            className={`inventory-filter${sortBy === key ? " active" : ""}`}
            onClick={() => onSort(key)}
          >
            {EQUIP_SORT_LABELS[key]}
          </button>
        ))}
      </div>
      <div className="inventory-items">
        {sorted.map((item) => {
          const def = getEquipmentItemById(item.defId);
          if (!def) return null;
          const isEquipped = equippedIds.has(item.instanceId);
          const isExpanded = expandedId === `equip:${item.instanceId}`;
          const conditionClass = item.condition === "broken" ? " broken" : item.condition === "damaged" ? " damaged" : "";
          return (
            <div
              key={item.instanceId}
              className={`inventory-item${isExpanded ? " expanded" : ""}${conditionClass}${isEquipped ? " equipped" : ""}`}
              onClick={() => onToggleExpand(`equip:${item.instanceId}`)}
            >
              <div className="inventory-item-header">
                <span className="inventory-item-name">
                  {def.name}
                  {isEquipped && <span className="equip-badge">E</span>}
                </span>
                <span className="equip-meta">
                  <span className="equip-slot-tag">{SLOTS[def.slot]?.name ?? def.slot}</span>
                  {item.condition !== "pristine" && (
                    <span className={`equip-condition${conditionClass}`}>
                      {CONDITION_LABELS[item.condition] ?? item.condition}
                    </span>
                  )}
                  <button
                    className={`equip-quick-btn${isEquipped ? " unequip" : ""}`}
                    disabled={item.condition === "broken" && !isEquipped}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEquipItem?.(item.instanceId);
                    }}
                    title={isEquipped ? "Unequip" : "Equip"}
                  >
                    {isEquipped ? "\u2212" : "+"}
                  </button>
                </span>
              </div>
              {isExpanded && (
                <div className="inventory-item-desc">
                  {def.description}
                  <div className="equip-stats">
                    <span className="equip-tier">Tier {def.tier}</span>
                    {def.baseStats.map((s) => (
                      <span key={s.stat} className={`equip-stat${s.value < 0 ? " negative" : ""}`}>
                        {s.stat} {s.value > 0 ? "+" : ""}{s.value}
                      </span>
                    ))}
                  </div>
                  {item.affixes.length > 0 && (
                    <div className="equip-affixes">
                      {item.affixes.map((a) => {
                        const affixDef = getAffixById(a.affixId);
                        if (!affixDef) return null;
                        const range = affixDef.rollRange ?? { min: 1, max: 1 };
                        const scale = range.min + a.rollValue * (range.max - range.min);
                        return (
                          <span key={a.affixId} className="equip-affix" title={affixDef.description}>
                            {affixDef.name} ({Math.round(scale * 100)}%)
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="equip-actions">
                    <button
                      className={`equip-btn${isEquipped ? " unequip" : ""}`}
                      disabled={item.condition === "broken" && !isEquipped}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEquipItem?.(item.instanceId);
                      }}
                    >
                      {isEquipped ? "Unequip" : "Equip"}
                    </button>
                  </div>
                  {item.condition !== "pristine" && (() => {
                    const recipe = findRepairRecipe(item);
                    if (!recipe) return null;
                    const meetsReqs = meetsRepairRequirements(recipe, state);
                    const canAfford = canAffordRepair(recipe, state);
                    const RESOURCES = getResources();
                    return (
                      <div className="equip-repair">
                        <div className="equip-repair-cost">
                          Repair to {NEXT_CONDITION_LABEL[item.condition]}:
                          {recipe.inputs.map((inp) => {
                            const rdef = RESOURCES[inp.resourceId];
                            const has = state.resources[inp.resourceId] ?? 0;
                            return (
                              <span key={inp.resourceId} className={`repair-material${has < inp.amount ? " insufficient" : ""}`}>
                                {" "}{rdef?.name ?? inp.resourceId} {has}/{inp.amount}
                              </span>
                            );
                          })}
                          {recipe.requiredSkillLevel > 0 && (
                            <span className={`repair-material${(state.skills["smithing"]?.level ?? 0) < recipe.requiredSkillLevel ? " insufficient" : ""}`}>
                              {" "}Smithing Lv{recipe.requiredSkillLevel}
                            </span>
                          )}
                        </div>
                        <button
                          className="repair-btn"
                          disabled={!meetsReqs || !canAfford}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRepairItem?.(item.instanceId);
                          }}
                        >
                          Repair
                        </button>
                      </div>
                    );
                  })()}
                  {!isEquipped && (() => {
                    const table = findSalvageTable(item);
                    if (!table) return null;
                    const meetsReqs = meetsSalvageRequirements(table, state);
                    const RESOURCES = getResources();
                    const CONDITION_MULT: Record<string, number> = { pristine: 1, worn: 0.75, damaged: 0.5, broken: 0.25 };
                    const mult = CONDITION_MULT[item.condition] ?? 0.5;
                    return (
                      <div className="equip-salvage">
                        <div className="equip-salvage-yields">
                          Salvage yields:
                          {table.outputs.map((out) => {
                            const rdef = RESOURCES[out.resourceId];
                            const amt = Math.max(1, Math.round(out.amount * mult));
                            const chanceLabel = (out.chance ?? 1) < 1 ? ` (${Math.round((out.chance ?? 1) * 100)}%)` : "";
                            return (
                              <span key={out.resourceId} className="salvage-material">
                                {" "}{rdef?.name ?? out.resourceId} x{amt}{chanceLabel}
                              </span>
                            );
                          })}
                          {item.affixes.length > 0 && (
                            <span className="salvage-reagent-hint"> + possible reagents</span>
                          )}
                          {table.requiredSkillLevel > 0 && (
                            <span className={`repair-material${(state.skills["smithing"]?.level ?? 0) < table.requiredSkillLevel ? " insufficient" : ""}`}>
                              {" "}Smithing Lv{table.requiredSkillLevel}
                            </span>
                          )}
                        </div>
                        <button
                          className="salvage-btn"
                          disabled={!meetsReqs}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSalvageItem?.(item.instanceId);
                          }}
                        >
                          Salvage
                        </button>
                      </div>
                    );
                  })()}
                  <div className="equip-discard">
                    {confirmDiscard === item.instanceId ? (
                      <>
                        <span className="discard-confirm-label">Destroy this item?</span>
                        <button
                          className="discard-btn confirm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDiscardItem?.(item.instanceId);
                            setConfirmDiscard(null);
                          }}
                        >
                          Yes, trash
                        </button>
                        <button
                          className="discard-btn cancel"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDiscard(null);
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="discard-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDiscard(item.instanceId);
                        }}
                      >
                        Trash
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="empty-message">No equipment matches filters.</p>
        )}
      </div>
    </div>
  );
}
