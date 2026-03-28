import { useState } from "react";
import { getDoubleOutputChance } from "../data/milestones";
import { RESOURCES } from "../data/resources";
import { TOOLS } from "../data/tools";
import { BUILDINGS } from "../data/buildings";
import { GameState, RecipeDef } from "../data/types";
import { getEffectiveInputs, getResource, getBuildingCount, canAffordTagInputs, resolveTagInputs, getEffectiveMoraleGain } from "../engine/gameState";
import { GameIcon } from "./GameIcon";

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
  return !!(recipe.oneTimeCraft || (recipe.buildingOutput && !BUILDINGS[recipe.buildingOutput]?.maxCount));
}

export function CraftingPanel({ recipes, state, onCraft }: Props) {
  const [collapsed, setCollapsed] = useState<Set<CategoryId>>(new Set());
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
                            <GameIcon id={inp.resourceId} size={16} />{inp.amount}x{" "}
                            {RESOURCES[inp.resourceId]?.name ?? inp.resourceId} (
                            {have})
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
                    <div className="action-requires">
                      Requires:{" "}
                      {recipe.requiredTools.map((id, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          <span title={TOOLS[id]?.description}><GameIcon id={id} size={16} />{TOOLS[id]?.name ?? id}</span>
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
                          <span title={RESOURCES[id]?.description}><GameIcon id={id} size={16} />{RESOURCES[id]?.name ?? id}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {recipe.toolOutput ? (
                    <div className="recipe-output">
                      Produces: <GameIcon id={recipe.toolOutput} size={16} />{" "}
                      {TOOLS[recipe.toolOutput]?.name ?? recipe.toolOutput}
                    </div>
                  ) : recipe.buildingOutput ? (
                    <div className="recipe-output">
                      Builds: {BUILDINGS[recipe.buildingOutput]?.name ?? recipe.buildingOutput}
                      {BUILDINGS[recipe.buildingOutput]?.maxCount && BUILDINGS[recipe.buildingOutput]!.maxCount! > 1
                        ? ` (${getBuildingCount(state, recipe.buildingOutput)}/${BUILDINGS[recipe.buildingOutput]!.maxCount})`
                        : ""}
                    </div>
                  ) : recipe.output ? (
                    <div className="recipe-output">
                      Produces: <GameIcon id={recipe.output.resourceId} size={16} />{recipe.output.amount}x{" "}
                      {RESOURCES[recipe.output.resourceId]?.name ??
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
