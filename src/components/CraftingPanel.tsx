import { RESOURCES } from "../data/resources";
import { GameState, RecipeDef } from "../data/types";
import { getResource } from "../engine/gameState";

interface Props {
  recipes: RecipeDef[];
  state: GameState;
  onCraft: (recipe: RecipeDef) => void;
}

export function CraftingPanel({ recipes, state, onCraft }: Props) {
  if (recipes.length === 0) {
    return (
      <div className="empty-message">
        No recipes unlocked yet. Discover new areas and gather materials!
      </div>
    );
  }

  return (
    <div>
      {recipes.map((recipe) => {
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
                  recipe.output.resourceId}
              </div>
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
}
