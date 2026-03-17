import { useState } from "react";
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
  "construction",
  "crafting",
];

export function ActionPanel({ actions, state, onStart }: Props) {
  const [collapsed, setCollapsed] = useState<Set<SkillId>>(new Set());

  const grouped = new Map<SkillId, ActionDef[]>();
  for (const a of actions) {
    const list = grouped.get(a.skillId) ?? [];
    list.push(a);
    grouped.set(a.skillId, list);
  }

  const toggleSkill = (skillId: SkillId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  return (
    <div>
      {SKILL_ORDER.map((skillId) => {
        const list = grouped.get(skillId);
        if (!list) return null;
        const isCollapsed = collapsed.has(skillId);
        return (
          <div key={skillId}>
            <div
              className="section-title collapsible"
              onClick={() => toggleSkill(skillId)}
            >
              <span className={`collapse-arrow ${isCollapsed ? "collapsed" : ""}`}>&#9662;</span>
              {skillId} (Lvl {state.skills[skillId].level})
              <span className="section-count">{list.length}</span>
            </div>
            {!isCollapsed && list.map((action) => {
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
                  {action.drops.length > 0 ? (
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
                  ) : (
                    <div className="action-drops">XP only</div>
                  )}
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
