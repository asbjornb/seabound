import { BUILDINGS } from "../data/buildings";
import { RESOURCES } from "../data/resources";
import { GameState, RecipeDef } from "../data/types";
import { getResource } from "../engine/gameState";

interface Props {
  campRecipes: RecipeDef[];
  state: GameState;
  onBuild: (recipe: RecipeDef) => void;
}

export function SettlementPanel({
  campRecipes,
  state,
  onBuild,
}: Props) {
  const buildingRecipes = campRecipes.filter((r) => !!r.buildingOutput);
  const maintenanceRecipes = campRecipes.filter((r) => !r.buildingOutput);
  return (
    <div>
      {maintenanceRecipes.length > 0 && (
        <>
          <div className="section-title">Camp Maintenance</div>
          {maintenanceRecipes.map((recipe) => {
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
                {recipe.output && (
                  <div className="recipe-output">
                    Makes: {recipe.output.amount}x{" "}
                    {RESOURCES[recipe.output.resourceId]?.name ??
                      recipe.output.resourceId}
                  </div>
                )}
                <div className="action-xp">
                  +{recipe.xpGain} {recipe.skillId} XP
                </div>
              </div>
            );
          })}
        </>
      )}

      {buildingRecipes.length > 0 && (
        <>
          <div className="section-title">Available to Build</div>
          {buildingRecipes.map((recipe) => {
            const canAfford = recipe.inputs.every(
              (inp) => getResource(state, inp.resourceId) >= inp.amount
            );
            const disabled = !canAfford;
            const bdef = recipe.buildingOutput
              ? BUILDINGS[recipe.buildingOutput]
              : undefined;

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
                {bdef && (
                  <>
                    <div className="building-unlocks">
                      Unlocks: {bdef.unlocks}
                    </div>
                    {bdef.storageBonus && (
                      <div className="building-storage">
                        Storage:{" "}
                        {bdef.storageBonus
                          .map((b) => `+${b.amount} ${b.category}`)
                          .join(", ")}
                      </div>
                    )}
                  </>
                )}
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

      {state.buildings.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 16 }}>
            Built
          </div>
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
                  {bdef?.storageBonus && (
                    <div className="building-storage">
                      Storage:{" "}
                      {bdef.storageBonus
                        .map((b) => `+${b.amount} ${b.category}`)
                        .join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {state.buildings.length === 0 && campRecipes.length === 0 && (
        <div className="empty-message">
          No buildings available yet. Gather materials and level up skills!
        </div>
      )}
    </div>
  );
}
