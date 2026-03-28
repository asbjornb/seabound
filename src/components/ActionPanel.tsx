import { useState } from "react";
import { getDropChanceBonus, getDurationMultiplier } from "../data/milestones";
import { RESOURCES } from "../data/resources";
import { TOOLS } from "../data/tools";
import { ActionDef, BiomeId, GameState } from "../data/types";
import { getResource, getMoraleDurationMultiplier, getToolSpeedMultiplier, hasTool } from "../engine/gameState";
import { GameIcon } from "./GameIcon";

interface Props {
  actions: ActionDef[];
  state: GameState;
  onStart: (action: ActionDef) => void;
  currentActionId?: string | null;
}

const BIOME_NAMES: Record<BiomeId, string> = {
  beach: "Beach",
  coconut_grove: "Coconut Grove",
  rocky_shore: "Rocky Shore",
  bamboo_grove: "Bamboo Grove",
  jungle_interior: "Jungle Interior",
  nearby_island: "Nearby Island",
};

/** Order biomes appear in the gather panel. Actions without a biome go under "beach". */
const BIOME_ORDER: BiomeId[] = [
  "beach",
  "coconut_grove",
  "rocky_shore",
  "bamboo_grove",
  "jungle_interior",
  "nearby_island",
];

export function ActionPanel({ actions, state, onStart, currentActionId }: Props) {
  const [collapsed, setCollapsed] = useState<Set<BiomeId>>(new Set());

  const grouped = new Map<BiomeId, ActionDef[]>();
  for (const a of actions) {
    const biome: BiomeId = a.requiredBiome ?? "beach";
    const list = grouped.get(biome) ?? [];
    list.push(a);
    grouped.set(biome, list);
  }

  const toggleBiome = (biomeId: BiomeId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(biomeId)) next.delete(biomeId);
      else next.add(biomeId);
      return next;
    });
  };

  return (
    <div>
      {BIOME_ORDER.map((biomeId) => {
        const list = grouped.get(biomeId);
        if (!list) return null;
        const isCollapsed = collapsed.has(biomeId);
        return (
          <div key={biomeId}>
            <div
              className="section-title collapsible"
              onClick={() => toggleBiome(biomeId)}
            >
              <span className={`collapse-arrow ${isCollapsed ? "collapsed" : ""}`}>&#9662;</span>
              <GameIcon id={`biome_${biomeId}`} /> {BIOME_NAMES[biomeId]}
              <span className="section-count">{list.length}</span>
            </div>
            {!isCollapsed && list.map((action) => {
              // Check tool requirements
              const missingTools = action.requiredTools?.filter(
                (t) => !hasTool(state, t)
              ) ?? [];
              // Check resource requirements
              const missingResources = action.requiredResources?.filter(
                (r) => getResource(state, r) < 1
              ) ?? [];
              const disabled = missingTools.length > 0 || missingResources.length > 0;
              const isActive = currentActionId === action.id;

              // Calculate effective duration with morale + tool + milestone bonuses
              const skillLevel = state.skills[action.skillId].level;
              const moraleMultiplier = getMoraleDurationMultiplier(state.morale);
              const toolMultiplier = getToolSpeedMultiplier(state, action.id);
              const milestoneMultiplier = getDurationMultiplier(action.skillId, skillLevel, action.id);
              const effectiveDuration = Math.round(
                action.durationMs * milestoneMultiplier * moraleMultiplier * toolMultiplier
              );
              const hasSpeedBonus = effectiveDuration < action.durationMs;

              return (
                <div
                  key={action.id}
                  className={`action-card ${disabled ? "disabled" : ""} ${isActive ? "active" : ""}`}
                  onClick={() => !disabled && onStart(action)}
                >
                  <div className="action-card-header">
                    <span className="action-name">{action.name}</span>
                    <span className={`action-time${hasSpeedBonus ? " boosted" : ""}`}>
                      {(effectiveDuration / 1000).toFixed(1)}s
                      {hasSpeedBonus && <span className="base-time"> ({(action.durationMs / 1000).toFixed(1)}s)</span>}
                    </span>
                  </div>
                  <div className="action-desc">{action.description}</div>
                  {action.drops.length > 0 ? (
                    <div className="action-drops">
                      Drops:
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
                        .sort((a, b) => b.effectiveChance - a.effectiveChance)
                        .map((d, i) => (
                        <div key={i} className="drop-row">
                            <GameIcon id={d.resourceId} size={16} />{d.amount}x{" "}
                            {RESOURCES[d.resourceId]?.name ?? d.resourceId}
                            {" "}({Math.round(d.effectiveChance * 100)}%)
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="action-drops">XP only</div>
                  )}
                  {(missingTools.length > 0 || missingResources.length > 0) && (
                    <div className="action-requires">
                      Requires:{" "}
                      {missingTools.map((t, i) => (
                        <span key={`tool-${i}`}>
                          {i > 0 && ", "}
                          <span title={TOOLS[t]?.description}>
                            <GameIcon id={t} size={16} />{TOOLS[t]?.name ?? t}
                          </span>
                        </span>
                      ))}
                      {missingTools.length > 0 && missingResources.length > 0 && ", "}
                      {missingResources.map((r, i) => (
                        <span key={`res-${i}`}>
                          {i > 0 && ", "}
                          <span title={RESOURCES[r]?.description}>
                            <GameIcon id={r} size={16} />{RESOURCES[r]?.name ?? r}
                          </span>
                        </span>
                      ))}
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
