import { BUILDINGS } from "../data/buildings";
import { RESOURCES } from "../data/resources";
import { GameState, RecipeDef } from "../data/types";
import { getResource } from "../engine/gameState";

interface Props {
  buildingRecipes: RecipeDef[];
  state: GameState;
  onBuild: (recipe: RecipeDef) => void;
}

export function SettlementPanel({
  buildingRecipes,
  state,
  onBuild,
}: Props) {
  return (
    <div>
      {state.buildings.length > 0 && (
        <>
          <div className="section-title">Built</div>
          <div className="building-list">
            {state.buildings.map((bid) => {
              const bdef = BUILDINGS[bid];
              return (
                <div key={bid} className="building-card built">
                  <div className="building-name">{bdef?.name ?? bid}</div>
                  <div className="building-desc">
                    {bdef?.description ?? ""}
                  </div>
                  <div className="building-unlocks">
                    Unlocks: {bdef?.unlocks ?? ""}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {buildingRecipes.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 16 }}>
            Available to Build
          </div>
          {buildingRecipes.map((recipe) => {
            const canAfford = recipe.inputs.every(
              (inp) => getResource(state, inp.resourceId) >= inp.amount
            );
            const disabled = !canAfford;

            return (
              <div
                key={recipe.id}
                className={`action-card ${disabled ? "disabled" : ""}`}
                onClick={() => !disabled && onBuild(recipe)}
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
                <div className="action-xp">
                  +{recipe.xpGain} {recipe.skillId} XP
                </div>
              </div>
            );
          })}
        </>
      )}

      {state.buildings.length === 0 && buildingRecipes.length === 0 && (
        <div className="empty-message">
          No buildings available yet. Gather materials and level up skills!
        </div>
      )}
    </div>
  );
}
