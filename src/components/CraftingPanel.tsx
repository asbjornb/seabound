import { useState } from "react";
import { getDataPack } from "../data/dataPack";
import { RESOURCE_ICONS, SKILL_ICONS, TOOL_ICONS } from "../data/icons";
import { getDoubleOutputChance } from "../data/milestones";
import { GameState, RecipeDef } from "../data/types";
import { getEffectiveInputs, getResource, getBuildingCount, canAffordTagInputs, resolveTagInputs } from "../engine/gameState";

interface Props {
  recipes: RecipeDef[];
  state: GameState;
  onCraft: (recipe: RecipeDef) => void;
}

type CategoryId = "tools" | "repeatable";

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "tools", label: "Tools & One-Time Crafts" },
  { id: "repeatable", label: "Repeatable" },
];

function isOneTimeCraft(recipe: RecipeDef): boolean {
  const pack = getDataPack();
  return !!(recipe.oneTimeCraft || (recipe.buildingOutput && !pack.buildings[recipe.buildingOutput]?.maxCount));
}

export function CraftingPanel({ recipes, state, onCraft }: Props) {
  const [collapsed, setCollapsed] = useState<Set<CategoryId>>(new Set());
  const [craftableOnly, setCraftableOnly] = useState(false);
  const pack = getDataPack();

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
  const craftableCount = recipes.filter((r) =>
    getEffectiveInputs(r, state).every((inp) => getResource(state, inp.resourceId) >= inp.amount)
    && (!r.tagInputs || canAffordTagInputs(r.tagInputs, state))
  ).length;

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
          list = list.filter((r) =>
            getEffectiveInputs(r, state).every(
              (inp) => getResource(state, inp.resourceId) >= inp.amount
            )
            && (!r.tagInputs || canAffordTagInputs(r.tagInputs, state))
          );
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
              const inputs = getEffectiveInputs(recipe, state);
              const canAffordInputs = inputs.every(
                (inp) => getResource(state, inp.resourceId) >= inp.amount
              );
              const canAffordTags = !recipe.tagInputs || canAffordTagInputs(recipe.tagInputs, state);
              const disabled = !canAffordInputs || !canAffordTags;

              // Resolve which tagged resources would be used (for display)
              const resolvedTags = recipe.tagInputs ? resolveTagInputs(recipe.tagInputs, state) : null;

              return (
                <div
                  key={recipe.id}
                  className={`action-card ${disabled ? "disabled" : ""}`}
                  onClick={() => !disabled && onCraft(recipe)}
                >
                  <div className="action-card-header">
                    <span className="action-name">{recipe.name}</span>
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
                      return (
                        <span key={i}>
                          {i > 0 && ", "}
                          <span className={enough ? "has" : "missing"}>
                            {RESOURCE_ICONS[inp.resourceId] ?? ""}{inp.amount}x{" "}
                            {pack.resources[inp.resourceId]?.name ?? inp.resourceId} (
                            {have})
                          </span>
                        </span>
                      );
                    })}
                    {recipe.tagInputs?.map((ti, i) => {
                      // Count how many distinct tagged resources player has
                      const available = Object.values(pack.resources)
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
                                    {RESOURCE_ICONS[r.resourceId] ?? ""}{pack.resources[r.resourceId]?.name ?? r.resourceId}
                                  </span>
                                ))}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  {recipe.requiredTools && recipe.requiredTools.length > 0 && (
                    <div className="action-requires">
                      Requires:{" "}
                      {recipe.requiredTools.map((id, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          <span title={pack.tools[id]?.description}>{TOOL_ICONS[id] ?? ""}{pack.tools[id]?.name ?? id}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {recipe.requiredItems && recipe.requiredItems.length > 0 && (
                    <div className="action-requires">
                      Requires:{" "}
                      {recipe.requiredItems.map((id, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          <span title={pack.resources[id]?.description}>{RESOURCE_ICONS[id] ?? ""}{pack.resources[id]?.name ?? id}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {recipe.toolOutput ? (
                    <div className="recipe-output">
                      Produces: {TOOL_ICONS[recipe.toolOutput] ?? ""}{" "}
                      {pack.tools[recipe.toolOutput]?.name ?? recipe.toolOutput}
                    </div>
                  ) : recipe.buildingOutput ? (
                    <div className="recipe-output">
                      Builds: {pack.buildings[recipe.buildingOutput]?.name ?? recipe.buildingOutput}
                      {pack.buildings[recipe.buildingOutput]?.maxCount && pack.buildings[recipe.buildingOutput]!.maxCount! > 1
                        ? ` (${getBuildingCount(state, recipe.buildingOutput)}/${pack.buildings[recipe.buildingOutput]!.maxCount})`
                        : ""}
                    </div>
                  ) : recipe.output ? (
                    <div className="recipe-output">
                      Produces: {RESOURCE_ICONS[recipe.output.resourceId] ?? ""}{recipe.output.amount}x{" "}
                      {pack.resources[recipe.output.resourceId]?.name ??
                        recipe.output.resourceId}{" "}
                      ({getResource(state, recipe.output.resourceId)})
                      {(() => {
                        const doubleChance = getDoubleOutputChance(
                          recipe.skillId,
                          state.skills[recipe.skillId].level,
                          recipe.id
                        );
                        return doubleChance > 0
                          ? ` — ${Math.round(doubleChance * 100)}% chance to double`
                          : null;
                      })()}
                    </div>
                  ) : recipe.moraleGain ? (
                    <div className="recipe-output">+{recipe.moraleGain} Morale</div>
                  ) : (
                    <div className="recipe-output">XP only</div>
                  )}
                  <div className="action-xp">
                    {SKILL_ICONS[recipe.skillId]} +{recipe.xpGain} {recipe.skillId} XP
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
