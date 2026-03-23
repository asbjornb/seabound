import { BUILDINGS } from "../data/buildings";
import { BUILDING_ICONS, getItemIcon } from "../data/icons";
import { RESOURCES } from "../data/resources";
import { TOOLS } from "../data/tools";
import { ActionDef, BuildingId, GameState, RecipeDef } from "../data/types";
import { getEffectiveInputs, getResource, hasItem } from "../engine/gameState";

interface Props {
  buildRecipes: RecipeDef[];
  buildActions: ActionDef[];
  state: GameState;
  onBuild: (recipe: RecipeDef) => void;
  onStartAction: (action: ActionDef) => void;
}

export function SettlementPanel({
  buildRecipes,
  buildActions,
  state,
  onBuild,
  onStartAction,
}: Props) {
  const buildingRecipes = buildRecipes.filter((r) => !!r.buildingOutput);
  const maintenanceRecipes = buildRecipes.filter((r) => !r.buildingOutput);
  return (
    <div>
      {(buildActions.length > 0 || maintenanceRecipes.length > 0) && (
        <>
          <div className="section-title">Build Tasks</div>
          {buildActions.map((action) => {
            const missingTool = action.requiredTools?.find(
              (t) => !hasItem(state, t)
            );
            const disabled = !!missingTool;
            return (
              <div
                key={action.id}
                className={`action-card ${disabled ? "disabled" : ""}`}
                onClick={() => !disabled && onStartAction(action)}
              >
                <div className="action-card-header">
                  <span className="action-name">{action.name}</span>
                  <span className="action-time">
                    {(action.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="action-desc">{action.description}</div>
                {action.drops.length > 0 ? (
                  <div className="action-drops">
                    Drops:{" "}
                    {action.drops.map((d, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        {d.amount}x {RESOURCES[d.resourceId]?.name ?? d.resourceId}
                        {d.chance != null && d.chance < 1
                          ? ` (${Math.round(d.chance * 100)}%)`
                          : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="action-drops">XP only</div>
                )}
                {missingTool && (
                  <div className="action-requires">
                    Requires: {getItemIcon(missingTool)}{RESOURCES[missingTool]?.name ?? TOOLS[missingTool]?.name ?? missingTool}
                  </div>
                )}
                <div className="action-xp">
                  +{action.xpGain} {action.skillId} XP
                </div>
              </div>
            );
          })}
          {maintenanceRecipes.map((recipe) => {
            const inputs = getEffectiveInputs(recipe, state);
            const canAfford = inputs.every(
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
                  {inputs.map((inp, i) => {
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
            const inputs = getEffectiveInputs(recipe, state);
            const canAfford = inputs.every(
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
                  {inputs.map((inp, i) => {
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
                  <div className="building-name">{BUILDING_ICONS[bid as BuildingId] ?? ""} {bdef?.name ?? bid}</div>
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

      {state.buildings.length === 0 && buildRecipes.length === 0 && (
        <div className="empty-message">
          No buildings available yet. Gather materials and level up skills!
        </div>
      )}
    </div>
  );
}
