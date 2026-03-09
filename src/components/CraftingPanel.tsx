import { RESOURCES } from "../data/resources";
import { GameState, RecipeDef } from "../data/types";
import { getResource } from "../engine/gameState";

interface Props {
  recipes: RecipeDef[];
  state: GameState;
  onCraft: (recipe: RecipeDef) => void;
  busy: boolean;
}

export function CraftingPanel({ recipes, state, onCraft, busy }: Props) {
  if (recipes.length === 0) {
    return <div className="empty-message">No recipes unlocked yet. Level up crafting!</div>;
  }

  return (
    <div>
      {recipes.map((recipe) => {
        const canAfford = recipe.inputs.every(
          (inp) => getResource(state, inp.resourceId) >= inp.amount
        );
        const disabled = busy || !canAfford;

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
            <div className="recipe-output">
              Produces: {recipe.output.amount}x{" "}
              {RESOURCES[recipe.output.resourceId]?.name ??
                recipe.output.resourceId}
            </div>
            <div className="action-xp">
              +{recipe.xpGain} {recipe.skillId} XP
            </div>
          </div>
        );
      })}
    </div>
  );
}
