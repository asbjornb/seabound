import { getBuildings, getResources, getTools } from "../data/registry";
import { ActionDef, BuildingId, GameState, RecipeDef } from "../data/types";
import { getEffectiveInputs, getResource, getBuildingCount, hasTool, getEffectiveMoraleGain } from "../engine/gameState";
import { resourceHasUse } from "../engine/selectors";
import { GameIcon } from "./GameIcon";

interface Props {
  buildRecipes: RecipeDef[];
  buildActions: ActionDef[];
  state: GameState;
  onBuild: (recipe: RecipeDef) => void;
  onStartAction: (action: ActionDef) => void;
}

function formatStorageBonus(b: { tag?: string; excludeTags?: string[]; amount: number }): string {
  if (b.tag) return `+${b.amount} ${b.tag}`;
  if (b.excludeTags) return `+${b.amount} (excl. ${b.excludeTags.join(", ")})`;
  return `+${b.amount} all`;
}

export function SettlementPanel({
  buildRecipes,
  buildActions,
  state,
  onBuild,
  onStartAction,
}: Props) {
  const BUILDINGS = getBuildings();
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const buildingRecipes = buildRecipes.filter((r) => !!r.buildingOutput);
  const maintenanceRecipes = buildRecipes.filter((r) => !r.buildingOutput);
  return (
    <div>
      {(buildActions.length > 0 || maintenanceRecipes.length > 0) && (
        <>
          <div className="section-title">Build Tasks</div>
          {buildActions.map((action) => {
            const missingTool = action.requiredTools?.find(
              (t) => !hasTool(state, t)
            );
            const missingResource = action.requiredResources?.find(
              (r) => getResource(state, r) < 1
            );
            const disabled = !!missingTool || !!missingResource;
            const isNew = !state.completedActions.includes(action.id);
            return (
              <div
                key={action.id}
                className={`action-card ${disabled ? "disabled" : ""}`}
                onClick={() => !disabled && onStartAction(action)}
              >
                <div className="action-card-header">
                  <span className="action-name">
                    {action.name}
                    {isNew && <span className="new-badge">NEW</span>}
                  </span>
                  <span className="action-time">
                    {(action.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="action-desc">{action.description}</div>
                {action.drops.filter((d) => resourceHasUse(d.resourceId, state)).length > 0 ? (
                  <div className="action-drops">
                    Drops:
                    {[...action.drops]
                      .filter((d) => resourceHasUse(d.resourceId, state))
                      .sort((a, b) => (b.chance ?? 1) - (a.chance ?? 1))
                      .map((d, i) => (
                      <div key={i} className="drop-row">
                        {d.amount}x {RESOURCES[d.resourceId]?.name ?? d.resourceId}
                        {" "}({Math.round((d.chance ?? 1) * 100)}%)
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="action-drops">XP only</div>
                )}
                {missingTool && (
                  <div className="action-requires">
                    Requires: <GameIcon id={missingTool} size={16} />{TOOLS[missingTool]?.name ?? missingTool}
                  </div>
                )}
                {missingResource && !missingTool && (
                  <div className="action-requires">
                    Requires: {RESOURCES[missingResource]?.name ?? missingResource}
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
            const isNew = !state.completedRecipes.includes(recipe.id);
            return (
              <div
                key={recipe.id}
                className={`action-card ${disabled ? "disabled" : ""}`}
                onClick={() => !disabled && onBuild(recipe)}
              >
                <div className="action-card-header">
                  <span className="action-name">
                    {recipe.name}
                    {isNew && <span className="new-badge">NEW</span>}
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
                {recipe.output ? (
                  <div className="recipe-output">
                    Makes: {recipe.output.amount}x{" "}
                    {RESOURCES[recipe.output.resourceId]?.name ??
                      recipe.output.resourceId}
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
                ) : null}
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

            const isNew = !state.completedRecipes.includes(recipe.id);
            return (
              <div
                key={recipe.id}
                className={`action-card ${disabled ? "disabled" : ""}`}
                onClick={() => !disabled && onBuild(recipe)}
              >
                <div className="action-card-header">
                  <span className="action-name">
                    {recipe.name}
                    {isNew && <span className="new-badge">NEW</span>}
                  </span>
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
                          .map(formatStorageBonus)
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
            {/* Deduplicate buildings for display, showing count for stackable */}
            {[...new Set(state.buildings)].map((bid) => {
              const bdef = BUILDINGS[bid];
              const count = getBuildingCount(state, bid);
              const isStackable = bdef?.maxCount && bdef.maxCount > 1;
              return (
                <div key={bid} className="building-card built">
                  <div className="building-name">
                    <GameIcon id={bid as BuildingId} /> {bdef?.name ?? bid}
                    {isStackable && ` (${count})`}
                  </div>
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
                        .map((b) => {
                          const total = b.amount * count;
                          const base = formatStorageBonus(b);
                          return isStackable ? `${base} (${total} total)` : base;
                        })
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
