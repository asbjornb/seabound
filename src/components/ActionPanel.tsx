import { useState } from "react";
import { getDropChanceBonus } from "../data/milestones";
import { BIOME_ICONS, RESOURCE_ICONS } from "../data/icons";
import { RESOURCES } from "../data/resources";
import { ActionDef, BiomeId, GameState } from "../data/types";
import { getResource } from "../engine/gameState";

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
              {BIOME_ICONS[biomeId]} {BIOME_NAMES[biomeId]}
              <span className="section-count">{list.length}</span>
            </div>
            {!isCollapsed && list.map((action) => {
              const missingTool = action.requiredTools?.find(
                (t) => getResource(state, t) < 1
              );
              const disabled = !!missingTool;
              const isActive = currentActionId === action.id;
              return (
                <div
                  key={action.id}
                  className={`action-card ${disabled ? "disabled" : ""} ${isActive ? "active" : ""}`}
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
                            {RESOURCE_ICONS[d.resourceId] ?? ""}{d.amount}x{" "}
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
                      <span title={RESOURCES[missingTool]?.description}>
                        {RESOURCE_ICONS[missingTool] ?? ""}{RESOURCES[missingTool]?.name ?? missingTool}
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
