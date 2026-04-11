import { useMemo, useState } from "react";
import { getEquipmentSlots, getEquipmentItemById, getAffixById, getRepairRecipes, getSalvageTables, getResources } from "../data/registry";
import { EquipmentItem, GameState, RepairRecipeDef, SalvageTableDef } from "../data/types";

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

const NEXT_CONDITION_LABEL: Record<string, string> = {
  broken: "Damaged",
  damaged: "Worn",
  worn: "Pristine",
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

function findRepairRecipe(item: EquipmentItem): RepairRecipeDef | undefined {
  const def = getEquipmentItemById(item.defId);
  if (!def?.tags) return undefined;
  return getRepairRecipes().find((r) =>
    r.targetTags.some((tag) => def.tags!.includes(tag))
  );
}

function canAffordRepair(recipe: RepairRecipeDef, state: GameState): boolean {
  for (const inp of recipe.inputs) {
    if ((state.resources[inp.resourceId] ?? 0) < inp.amount) return false;
  }
  return true;
}

function meetsRepairRequirements(recipe: RepairRecipeDef, state: GameState): boolean {
  const smithingLevel = state.skills["smithing"]?.level ?? 0;
  if (smithingLevel < recipe.requiredSkillLevel) return false;
  if (recipe.requiredBuildings?.some((b) => !state.buildings.includes(b))) return false;
  return true;
}

function findSalvageTable(item: EquipmentItem): SalvageTableDef | undefined {
  const def = getEquipmentItemById(item.defId);
  if (!def?.tags) return undefined;
  return getSalvageTables().find((t) =>
    t.targetTags.some((tag) => def.tags!.includes(tag))
  );
}

function meetsSalvageRequirements(table: SalvageTableDef, state: GameState): boolean {
  const smithingLevel = state.skills["smithing"]?.level ?? 0;
  return smithingLevel >= table.requiredSkillLevel;
}

export function EquipmentPanel({
  state,
  onRepairItem,
  onSalvageItem,
  onEquipItem,
  onDiscardItem,
}: {
  state: GameState;
  onRepairItem?: (instanceId: string) => void;
  onSalvageItem?: (instanceId: string) => void;
  onEquipItem?: (instanceId: string) => void;
  onDiscardItem?: (instanceId: string) => void;
}) {
  const SLOTS = getEquipmentSlots();
  const [slotFilter, setSlotFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<EquipSortKey>("slot");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null);

  const equippedIds = new Set(Object.values(state.loadout).filter((id): id is string => id != null));

  // Build the ordered list of slots
  const orderedSlots = useMemo(
    () => Object.values(SLOTS).sort((a, b) => a.order - b.order),
    [SLOTS]
  );

  // Loadout: map each slot to the equipped item (if any)
  const loadoutItems = useMemo(() => {
    const map = new Map<string, EquipmentItem | null>();
    for (const slot of orderedSlots) {
      const instanceId = state.loadout[slot.id];
      const item = instanceId ? state.equipmentInventory.find((i) => i.instanceId === instanceId) ?? null : null;
      map.set(slot.id, item);
    }
    return map;
  }, [orderedSlots, state.loadout, state.equipmentInventory]);

  // Unequipped items for the inventory section
  const searchLower = search.toLowerCase();
  const inventoryItems = state.equipmentInventory.filter((item) => {
    const def = getEquipmentItemById(item.defId);
    if (!def) return false;
    if (slotFilter !== "all" && def.slot !== slotFilter) return false;
    if (searchLower && !def.name.toLowerCase().includes(searchLower)) return false;
    return true;
  });

  const sorted = useMemo(() => sortEquipment(inventoryItems, sortBy), [inventoryItems, sortBy]);

  // Split into equipped and unequipped for display
  const equippedSorted = sorted.filter((i) => equippedIds.has(i.instanceId));
  const unequippedSorted = sorted.filter((i) => !equippedIds.has(i.instanceId));

  // Slot filter buttons: only show slots the player has items for
  const presentSlots = useMemo(() => {
    const slotSet = new Set<string>();
    for (const item of state.equipmentInventory) {
      const def = getEquipmentItemById(item.defId);
      if (def) slotSet.add(def.slot);
    }
    return Object.values(SLOTS)
      .filter((s) => slotSet.has(s.id))
      .sort((a, b) => a.order - b.order);
  }, [state.equipmentInventory, SLOTS]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Compute total stat bonuses from equipped items
  const totalStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const item of state.equipmentInventory) {
      if (!equippedIds.has(item.instanceId)) continue;
      const def = getEquipmentItemById(item.defId);
      if (!def) continue;
      for (const s of def.baseStats) {
        stats[s.stat] = (stats[s.stat] ?? 0) + s.value;
      }
      for (const a of item.affixes) {
        const affixDef = getAffixById(a.affixId);
        if (!affixDef) continue;
        const range = affixDef.rollRange ?? { min: 1, max: 1 };
        const scale = range.min + a.rollValue * (range.max - range.min);
        for (const m of affixDef.modifiers) {
          stats[m.stat] = (stats[m.stat] ?? 0) + Math.round(m.value * scale);
        }
      }
    }
    return stats;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.equipmentInventory, state.loadout]);

  const renderItem = (item: EquipmentItem) => {
    const def = getEquipmentItemById(item.defId);
    if (!def) return null;
    const isEquipped = equippedIds.has(item.instanceId);
    const isExpanded = expandedId === item.instanceId;
    const conditionClass = item.condition === "broken" ? " broken" : item.condition === "damaged" ? " damaged" : "";
    const uniqueClass = def.unique ? " unique-item" : "";
    return (
      <div
        key={item.instanceId}
        className={`inventory-item${isExpanded ? " expanded" : ""}${conditionClass}${isEquipped ? " equipped" : ""}${uniqueClass}`}
        onClick={() => toggleExpand(item.instanceId)}
      >
        <div className="inventory-item-header">
          <span className={`inventory-item-name${def.unique ? " unique-name" : ""}`}>
            {def.name}
            {def.unique && <span className="unique-badge">Unique</span>}
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
              const afford = canAffordRepair(recipe, state);
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
                    disabled={!meetsReqs || !afford}
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
  };

  return (
    <div className="equipment-panel">
      {/* ── Loadout Overview ── */}
      <div className="loadout-section">
        <h3 className="section-title">Loadout</h3>
        <div className="loadout-grid">
          {orderedSlots.map((slot) => {
            const item = loadoutItems.get(slot.id);
            const def = item ? getEquipmentItemById(item.defId) : null;
            const conditionClass = item?.condition === "broken" ? " broken" : item?.condition === "damaged" ? " damaged" : "";
            return (
              <div
                key={slot.id}
                className={`loadout-slot${item ? " filled" : " empty"}${conditionClass}`}
                onClick={() => {
                  if (item) toggleExpand(item.instanceId);
                }}
              >
                <span className="loadout-slot-label">{slot.name}</span>
                {item && def ? (
                  <div className="loadout-slot-item">
                    <span className={`loadout-item-name${def.unique ? " unique-name" : ""}`}>
                      {def.name}
                    </span>
                    {item.condition !== "pristine" && (
                      <span className={`loadout-condition${conditionClass}`}>
                        {CONDITION_LABELS[item.condition]}
                      </span>
                    )}
                    <button
                      className="equip-quick-btn unequip"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEquipItem?.(item.instanceId);
                      }}
                      title="Unequip"
                    >
                      &minus;
                    </button>
                  </div>
                ) : (
                  <span className="loadout-empty-label">Empty</span>
                )}
              </div>
            );
          })}
        </div>
        {/* Total stat bonuses */}
        {Object.keys(totalStats).length > 0 && (
          <div className="loadout-totals">
            <span className="loadout-totals-label">Total bonuses:</span>
            {Object.entries(totalStats).map(([stat, value]) => (
              <span key={stat} className={`equip-stat${value < 0 ? " negative" : ""}`}>
                {stat} {value > 0 ? "+" : ""}{value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Equipment Inventory ── */}
      <div className="equipment-inventory-section">
        <h3 className="section-title">Equipment ({state.equipmentInventory.length})</h3>
        <div className="inventory-filters">
          <button
            className={`inventory-filter${slotFilter === "all" ? " active" : ""}`}
            onClick={() => setSlotFilter("all")}
          >
            All
          </button>
          {presentSlots.map((slot) => (
            <button
              key={slot.id}
              className={`inventory-filter${slotFilter === slot.id ? " active" : ""}`}
              onClick={() => setSlotFilter(slot.id)}
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
              onClick={() => setSortBy(key)}
            >
              {EQUIP_SORT_LABELS[key]}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="inventory-search"
          placeholder="Search equipment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {equippedSorted.length > 0 && (
          <div className="equipment-group">
            <h4 className="equipment-group-label">Equipped</h4>
            <div className="inventory-items">
              {equippedSorted.map(renderItem)}
            </div>
          </div>
        )}

        {unequippedSorted.length > 0 && (
          <div className="equipment-group">
            {equippedSorted.length > 0 && (
              <h4 className="equipment-group-label">Unequipped</h4>
            )}
            <div className="inventory-items">
              {unequippedSorted.map(renderItem)}
            </div>
          </div>
        )}

        {sorted.length === 0 && (
          <p className="empty-message">No equipment matches filters.</p>
        )}
      </div>
    </div>
  );
}
