import { useState } from "react";
import { SKILL_ICONS } from "../data/icons";
import { RESOURCES } from "../data/resources";
import { GameState, RecipeDef, SkillId } from "../data/types";
import { getResource } from "../engine/gameState";

interface Props {
  recipes: RecipeDef[];
  state: GameState;
  onCraft: (recipe: RecipeDef) => void;
}

const SKILL_ORDER: SkillId[] = [
  "crafting",
  "cooking",
  "woodworking",
  "weaving",
  "construction",
  "preservation",
];

export function CraftingPanel({ recipes, state, onCraft }: Props) {
  const [collapsed, setCollapsed] = useState<Set<SkillId>>(new Set());
  const [craftableOnly, setCraftableOnly] = useState(false);

  if (recipes.length === 0) {
    return (
      <div className="empty-message">
        No recipes unlocked yet. Discover new areas and gather materials!
      </div>
    );
  }

  const toggleSkill = (skillId: SkillId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  // Group recipes by skill
  const grouped = new Map<SkillId, RecipeDef[]>();
  for (const r of recipes) {
    const list = grouped.get(r.skillId) ?? [];
    list.push(r);
    grouped.set(r.skillId, list);
  }

  // Count craftable for the filter badge
  const craftableCount = recipes.filter((r) =>
    r.inputs.every((inp) => getResource(state, inp.resourceId) >= inp.amount)
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
      {SKILL_ORDER.map((skillId) => {
        let list = grouped.get(skillId);
        if (!list) return null;

        if (craftableOnly) {
          list = list.filter((r) =>
            r.inputs.every(
              (inp) => getResource(state, inp.resourceId) >= inp.amount
            )
          );
          if (list.length === 0) return null;
        }

        const isCollapsed = collapsed.has(skillId);
        return (
          <div key={skillId}>
            <div
              className="section-title collapsible"
              onClick={() => toggleSkill(skillId)}
            >
              <span className={`collapse-arrow ${isCollapsed ? "collapsed" : ""}`}>&#9662;</span>
              {SKILL_ICONS[skillId]} {skillId} (Lvl {state.skills[skillId].level})
              <span className="section-count">{list.length}</span>
            </div>
            {!isCollapsed && list.map((recipe) => {
              const canAfford = recipe.inputs.every(
                (inp) => getResource(state, inp.resourceId) >= inp.amount
              );
              const disabled = !canAfford;

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
                    {recipe.inputs.map((inp, i) => {
                      const have = getResource(state, inp.resourceId);
                      const enough = have >= inp.amount;
                      return (
                        <span key={i}>
                          {i > 0 && ", "}
                          <span className={enough ? "has" : "missing"}>
                            {inp.amount}x{" "}
                            {RESOURCES[inp.resourceId]?.name ?? inp.resourceId} (
                            {have})
                          </span>
                        </span>
                      );
                    })}
                  </div>
                  {recipe.requiredItems && (
                    <div className="action-requires">
                      Requires:{" "}
                      {recipe.requiredItems.map((id, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          <span>{RESOURCES[id]?.name ?? id}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {recipe.output ? (
                    <div className="recipe-output">
                      Produces: {recipe.output.amount}x{" "}
                      {RESOURCES[recipe.output.resourceId]?.name ??
                        recipe.output.resourceId}{" "}
                      ({getResource(state, recipe.output.resourceId)})
                    </div>
                  ) : recipe.moraleGain ? (
                    <div className="recipe-output">+{recipe.moraleGain} Morale</div>
                  ) : (
                    <div className="recipe-output">XP only</div>
                  )}
                  <div className="action-xp">
                    +{recipe.xpGain} {recipe.skillId} XP
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
