import { useState } from "react";
import { getDoubleOutputChance, getOutputChanceBonus } from "../data/milestones";
import { getResources, getTools, getBuildings, getEquipmentItemById, getEquipmentSlots } from "../data/registry";
import { GameState, RecipeDef } from "../data/types";
import { canAffordInput, getEffectiveInputs, getResource, getGroupBuildingCount, getEffectiveMaxCount, canAffordTagInputs, resolveTagInputs, getEffectiveMoraleGain, isRecipeOutputBlocked, getStorageLimit, getStorageGroupTotal, getStorageGroupMembers } from "../engine/gameState";
import { computeItemStats, formatStat } from "./EquipmentPanel";
import { GameIcon } from "./GameIcon";
import { useItemLookup } from "./ItemLookup";

interface Props {
  recipes: RecipeDef[];
  state: GameState;
  onCraft: (recipe: RecipeDef) => void;
  onHighlightResources?: (ids: Set<string>) => void;
  queueMode?: boolean;
}

type CategoryId = "tools" | "repeatable";

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "tools", label: "Tools & One-Time Crafts" },
  { id: "repeatable", label: "Repeatable" },
];

function isOneTimeCraft(recipe: RecipeDef): boolean {
  const BUILDINGS = getBuildings();
  return !!(recipe.oneTimeCraft || (recipe.buildingOutput && !BUILDINGS[recipe.buildingOutput]?.maxCount));
}

export function CraftingPanel({ recipes, state, onCraft, onHighlightResources, queueMode }: Props) {
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const BUILDINGS = getBuildings();
  const openLookup = useItemLookup();
  const [collapsed, setCollapsed] = useState<Set<CategoryId>>(() => {
    try { const v = localStorage.getItem("sb_craft_collapsed"); return v ? new Set(JSON.parse(v)) : new Set(); } catch { return new Set(); }
  });
  const [foldedCards, setFoldedCards] = useState<Set<string>>(() => {
    try { const v = localStorage.getItem("sb_craft_folded"); return v ? new Set(JSON.parse(v)) : new Set(); } catch { return new Set(); }
  });
  const [craftableOnly, setCraftableOnly] = useState(false);

  if (recipes.length === 0) {
    return (
      <div className="empty-message">
        No recipes unlocked yet. Discover new areas and gather materials!
      </div>
    );
  }

  const toggleCategory = (catId: CategoryId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      try { localStorage.setItem("sb_craft_collapsed", JSON.stringify([...next])); } catch { /* */ }
      return next;
    });
  };

  const toggleCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFoldedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem("sb_craft_folded", JSON.stringify([...next])); } catch { /* */ }
      return next;
    });
  };

  // Group recipes by category
  const grouped = new Map<CategoryId, RecipeDef[]>();
  for (const r of recipes) {
    const catId: CategoryId = isOneTimeCraft(r) ? "tools" : "repeatable";
    const list = grouped.get(catId) ?? [];
    list.push(r);
    grouped.set(catId, list);
  }

  // Count craftable for the filter badge
  const craftableCount = recipes.filter((r) => {
    const inputs = getEffectiveInputs(r, state);
    return inputs.every((inp) => getResource(state, inp.resourceId) >= inp.amount)
    && (!r.tagInputs || canAffordTagInputs(r.tagInputs, state))
    && !(r.output && isRecipeOutputBlocked(state, r.output.resourceId, inputs));
  }).length;

  return (
    <div>
      <div className="filter-bar">
        <button
          className={`filter-toggle ${craftableOnly ? "active" : ""}`}
          onClick={() => setCraftableOnly(!craftableOnly)}
        >
          Craftable now{craftableOnly ? "" : ` (${craftableCount})`}
        </button>
      </div>
      {CATEGORIES.map(({ id: catId, label }) => {
        let list = grouped.get(catId);
        if (!list) return null;

        if (craftableOnly) {
          list = list.filter((r) => {
            const inputs = getEffectiveInputs(r, state);
            return inputs.every(
              (inp) => getResource(state, inp.resourceId) >= inp.amount
            )
            && (!r.tagInputs || canAffordTagInputs(r.tagInputs, state))
            && !(r.output && isRecipeOutputBlocked(state, r.output.resourceId, inputs));
          });
          if (list.length === 0) return null;
        }

        const isCollapsed = collapsed.has(catId);
        return (
          <div key={catId}>
            <div
              className="section-title collapsible"
              onClick={() => toggleCategory(catId)}
            >
              <span className={`collapse-arrow ${isCollapsed ? "collapsed" : ""}`}>&#9662;</span>
              {label}
              <span className="section-count">{list.length}</span>
            </div>
            {!isCollapsed && list.map((recipe) => {
              if (foldedCards.has(recipe.id)) {
                return (
                  <div key={recipe.id} className="action-card folded" onClick={(e) => toggleCard(recipe.id, e)}>
                    <div className="action-card-header">
                      <span className="collapse-arrow collapsed">&#9662;</span>
                      <span className="action-name">{recipe.name}</span>
                      <span className="action-time">{(recipe.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                );
              }
              const inputs = getEffectiveInputs(recipe, state);
              const canAffordInputs = inputs.every(
                (inp) => canAffordInput(inp, state)
              );
              const canAffordTags = !recipe.tagInputs || canAffordTagInputs(recipe.tagInputs, state);
              const outputFull = !!(recipe.output && isRecipeOutputBlocked(state, recipe.output.resourceId, inputs));
              const disabled = !canAffordInputs || !canAffordTags || outputFull;

              // Resolve which tagged resources would be used (for display)
              const resolvedTags = recipe.tagInputs ? resolveTagInputs(recipe.tagInputs, state) : null;

              const isNew = !state.completedRecipes.includes(recipe.id);
              const inputResourceIds = inputs.map((inp) => inp.resourceId);
              const showQueueHint = queueMode && !disabled;
              return (
                <div
                  key={recipe.id}
                  className={`action-card ${disabled ? "disabled" : ""}`}
                  onClick={() => !disabled && onCraft(recipe)}
                  onMouseEnter={() => onHighlightResources?.(new Set(inputResourceIds))}
                  onMouseLeave={() => onHighlightResources?.(new Set())}
                >
                  <div className="action-card-header">
                    <span className="collapse-arrow" onClick={(e) => toggleCard(recipe.id, e)}>&#9662;</span>
                    <span className="action-name">
                      {recipe.name}
                      {isNew && <span className="new-badge">NEW</span>}
                      {showQueueHint && <span className="queue-badge">QUEUE</span>}
                    </span>
                    <span className="action-time">
                      {(recipe.durationMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div className="action-desc">{recipe.description}</div>
                  <div className="recipe-inputs">
                    Needs:{" "}
                    {inputs.map((inp, i) => {
                      const have = getResource(state, inp.resourceId);
                      const enough = have >= inp.amount;
                      const altId = inp.alternateResourceId && state.discoveredResources.includes(inp.alternateResourceId) ? inp.alternateResourceId : undefined;
                      const altHave = altId ? getResource(state, altId) : 0;
                      const altEnough = altId ? altHave >= inp.amount : false;
                      return (
                        <span key={i}>
                          {i > 0 && ", "}
                          <span className={enough || altEnough ? "has" : "missing"}>
                            <span className="tappable-item" onClick={(e) => { e.stopPropagation(); openLookup(inp.resourceId); }}><GameIcon id={inp.resourceId} size={16} />{inp.amount}x{" "}
                            {RESOURCES[inp.resourceId]?.name ?? inp.resourceId}</span> (
                            {have})
                            {altId && (
                              <>
                                {" "}or <span className="tappable-item" onClick={(e) => { e.stopPropagation(); openLookup(altId); }}><GameIcon id={altId} size={16} />{RESOURCES[altId]?.name ?? altId}</span> ({altHave})
                              </>
                            )}
                          </span>
                        </span>
                      );
                    })}
                    {recipe.tagInputs?.map((ti, i) => {
                      // Count how many distinct tagged resources player has
                      const available = Object.values(RESOURCES)
                        .filter((r) => r.tags?.includes(ti.tag) && (state.resources[r.id] ?? 0) >= 1)
                        .length;
                      const enough = available >= ti.count;
                      return (
                        <span key={`tag-${i}`}>
                          {(inputs.length > 0 || i > 0) && ", "}
                          <span className={enough ? "has" : "missing"}>
                            {ti.count} different {ti.tag}s ({available}/{ti.count})
                          </span>
                          {resolvedTags && enough && (
                            <span className="tag-input-detail">
                              {" "}— {resolvedTags
                                .slice(
                                  recipe.tagInputs!.slice(0, i).reduce((sum, t) => sum + t.count, 0),
                                  recipe.tagInputs!.slice(0, i).reduce((sum, t) => sum + t.count, 0) + ti.count
                                )
                                .map((r, j) => (
                                  <span key={j}>
                                    {j > 0 && ", "}
                                    <GameIcon id={r.resourceId} size={16} />{RESOURCES[r.resourceId]?.name ?? r.resourceId}
                                  </span>
                                ))}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  {recipe.requiredTools && recipe.requiredTools.length > 0 && (
                    <div className="action-requires met">
                      Uses:{" "}
                      {recipe.requiredTools.map((id, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          <span title={TOOLS[id]?.description}><GameIcon id={id} size={16} />{TOOLS[id]?.name ?? id}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {(() => {
                    // Filter out requiredItems that are already listed as inputs (they're just discovery gates)
                    const inputIds = new Set(recipe.inputs.map((inp) => inp.resourceId));
                    const nonInputItems = recipe.requiredItems?.filter((id) => !inputIds.has(id)) ?? [];
                    return nonInputItems.length > 0 ? (
                      <div className="action-requires met">
                        Uses:{" "}
                        {nonInputItems.map((id, i) => (
                          <span key={i}>
                            {i > 0 && ", "}
                            <span title={RESOURCES[id]?.description}><GameIcon id={id} size={16} />{RESOURCES[id]?.name ?? id}</span>
                          </span>
                        ))}
                      </div>
                    ) : null;
                  })()}
                  {recipe.equipmentOutput ? (() => {
                    const eqDef = getEquipmentItemById(recipe.equipmentOutput!);
                    if (!eqDef) return <div className="recipe-output">Produces: {recipe.equipmentOutput}</div>;
                    const SLOTS = getEquipmentSlots();
                    const slotName = SLOTS[eqDef.slot]?.name ?? eqDef.slot;

                    // Compare base stats vs currently equipped item in same slot
                    const equippedInstanceId = state.loadout[eqDef.slot];
                    const equippedItem = equippedInstanceId
                      ? state.equipmentInventory.find((i) => i.instanceId === equippedInstanceId)
                      : undefined;

                    const baseStats: Record<string, number> = {};
                    for (const s of eqDef.baseStats) {
                      baseStats[s.stat] = (baseStats[s.stat] ?? 0) + s.value;
                    }

                    let comparison: React.ReactNode = null;
                    if (equippedItem) {
                      const equippedStats = computeItemStats(equippedItem);
                      const allStats = new Set([...Object.keys(baseStats), ...Object.keys(equippedStats)]);
                      const diffs: { stat: string; diff: number }[] = [];
                      for (const stat of allStats) {
                        const diff = (baseStats[stat] ?? 0) - (equippedStats[stat] ?? 0);
                        if (diff !== 0) diffs.push({ stat, diff });
                      }
                      const equippedDef = getEquipmentItemById(equippedItem.defId);
                      const equippedName = equippedDef?.name ?? "equipped";
                      if (diffs.length > 0) {
                        comparison = (
                          <div className="equip-compare">
                            <span className="compare-label">vs. {equippedName} (base stats):</span>
                            <div className="compare-stats">
                              {diffs.map(({ stat, diff }) => (
                                <span key={stat} className={`compare-stat ${diff > 0 ? "gain" : "loss"}`}>
                                  {stat} {diff > 0 ? "+" : ""}{diff}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      } else {
                        comparison = (
                          <div className="equip-compare">
                            <span className="compare-label">vs. {equippedName}:</span>
                            <span className="compare-stat">identical base stats</span>
                          </div>
                        );
                      }
                    }

                    return (
                      <div className="recipe-output equipment-preview">
                        <div>
                          Produces: <GameIcon id={recipe.equipmentOutput!} size={16} /> {eqDef.name}
                          {" "}<span className="equip-slot-tag">{slotName}</span>
                          {" "}<span className="equip-tier">T{eqDef.tier}</span>
                        </div>
                        <div className="equip-stat-preview">
                          {eqDef.baseStats.map((s) => (
                            <span key={s.stat} className={`equip-stat-chip${s.value < 0 ? " negative" : ""}`}>
                              {s.stat} {formatStat(s.value)}
                            </span>
                          ))}
                        </div>
                        {eqDef.maxAffixes > 0 && (
                          <div className="equip-affix-hint">
                            25% chance of a forge affix
                          </div>
                        )}
                        {comparison}
                      </div>
                    );
                  })() : recipe.toolOutput ? (
                    <div className="recipe-output">
                      Produces: <span className="tappable-item" onClick={(e) => { e.stopPropagation(); openLookup(recipe.toolOutput!); }}><GameIcon id={recipe.toolOutput} size={16} />{" "}
                      {TOOLS[recipe.toolOutput]?.name ?? recipe.toolOutput}</span>
                    </div>
                  ) : recipe.buildingOutput ? (
                    <div className="recipe-output">
                      Builds: <span className="tappable-item" onClick={(e) => { e.stopPropagation(); openLookup(recipe.buildingOutput!); }}>{BUILDINGS[recipe.buildingOutput]?.name ?? recipe.buildingOutput}</span>
                      {BUILDINGS[recipe.buildingOutput]?.maxCount && BUILDINGS[recipe.buildingOutput]!.maxCount! > 1
                        ? ` (${getGroupBuildingCount(state, recipe.buildingOutput)}/${getEffectiveMaxCount(state, recipe.buildingOutput)})`
                        : ""}
                    </div>
                  ) : recipe.output ? (
                    <div className="recipe-output">
                      Produces: <span className="tappable-item" onClick={(e) => { e.stopPropagation(); openLookup(recipe.output!.resourceId); }}><GameIcon id={recipe.output.resourceId} size={16} />{recipe.output.amount}x{" "}
                      {RESOURCES[recipe.output.resourceId]?.name ??
                        recipe.output.resourceId}</span>{" "}
                      ({getResource(state, recipe.output.resourceId)})
                      {(() => {
                        const baseChance = recipe.outputChance ?? 1;
                        if (baseChance < 1) {
                          const bonus = getOutputChanceBonus(
                            recipe.skillId,
                            state.skills[recipe.skillId].level,
                            recipe.id
                          );
                          const finalChance = Math.min(baseChance + bonus, 1);
                          if (finalChance < 1) {
                            return ` — ${Math.round(finalChance * 100)}% success`;
                          }
                        }
                        const doubleChance = getDoubleOutputChance(
                          recipe.skillId,
                          state.skills[recipe.skillId].level,
                          recipe.id
                        );
                        return doubleChance > 0
                          ? ` — ${Math.round(doubleChance * 100)}% chance to double`
                          : null;
                      })()}
                      {outputFull && (
                        <span className="storage-full-warning"> — Storage full</span>
                      )}
                      {(() => {
                        const groupMembers = getStorageGroupMembers(state, recipe.output!.resourceId);
                        if (groupMembers.length === 0) return null;
                        const limit = getStorageLimit(state, recipe.output!.resourceId);
                        const groupTotal = getStorageGroupTotal(state, RESOURCES[recipe.output!.resourceId]?.storageCapGroup ?? "");
                        return (
                          <div className="storage-group-info">
                            Shares storage ({groupTotal}/{limit}) with{" "}
                            {groupMembers.map((m, i) => (
                              <span key={m.id}>
                                {i > 0 && ", "}
                                <GameIcon id={m.id} size={16} />{m.name} ({m.amount})
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : recipe.moraleGain ? (
                    <div className="recipe-output">
                      +{recipe.moraleGain} Morale
                      {(() => {
                        const effective = getEffectiveMoraleGain(state.morale, recipe.moraleGain);
                        return effective < recipe.moraleGain
                          ? ` (${effective === 0 ? "no effect" : `+${effective} actual`} — soft cap above 100)`
                          : null;
                      })()}
                    </div>
                  ) : (
                    <div className="recipe-output">XP only</div>
                  )}
                  <div className="action-xp">
                    <GameIcon id={`skill_${recipe.skillId}`} size={16} /> +{recipe.xpGain} {recipe.skillId} XP
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
