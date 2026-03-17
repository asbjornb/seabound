import { getDropChanceBonus } from "../data/milestones";
import { RESOURCES } from "../data/resources";
import { ActionDef, GameState, SkillId } from "../data/types";
import { getResource } from "../engine/gameState";

interface Props {
  actions: ActionDef[];
  state: GameState;
  onStart: (action: ActionDef) => void;
}

const SKILL_ORDER: SkillId[] = [
  "foraging",
  "fishing",
  "woodworking",
  "crafting",
];

export function ActionPanel({ actions, state, onStart }: Props) {
  const grouped = new Map<SkillId, ActionDef[]>();
  for (const a of actions) {
    const list = grouped.get(a.skillId) ?? [];
    list.push(a);
    grouped.set(a.skillId, list);
  }

  return (
    <div>
      {SKILL_ORDER.map((skillId) => {
        const list = grouped.get(skillId);
        if (!list) return null;
        return (
          <div key={skillId}>
            <div className="section-title">
              {skillId} (Lvl {state.skills[skillId].level})
            </div>
            {list.map((action) => {
              const missingTool = action.requiredTools?.find(
                (t) => getResource(state, t) < 1
              );
              const disabled = !!missingTool;
              return (
                <div
                  key={action.id}
                  className={`action-card ${disabled ? "disabled" : ""}`}
                  onClick={() => !disabled && onStart(action)}
                >
                  <div className="action-card-header">
                    <span className="action-name">{action.name}</span>
                    <span className="action-time">
                      {(action.durationMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div className="action-desc">{action.description}</div>
                  <div className="action-drops">
                    Drops:{" "}
                    {action.drops
                      .map((d) => ({
                        ...d,
                        effectiveChance: Math.min(
                          1,
                          (d.chance ?? 1) +
                            getDropChanceBonus(action.skillId, state.skills[action.skillId].level, action.id, d.resourceId)
                        ),
                      }))
                      .filter((d) => d.effectiveChance > 0)
                      .map((d, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        <span>
                          {d.amount}x{" "}
                          {RESOURCES[d.resourceId]?.name ?? d.resourceId}
                          {d.effectiveChance < 1
                            ? ` (${Math.round(d.effectiveChance * 100)}%)`
                            : ""}
                        </span>
                      </span>
                    ))}
                  </div>
                  {missingTool && (
                    <div className="action-requires">
                      Requires:{" "}
                      <span>
                        {RESOURCES[missingTool]?.name ?? missingTool}
                      </span>
                    </div>
                  )}
                  <div className="action-xp">
                    +{action.xpGain} {action.skillId} XP
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
