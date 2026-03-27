import { useState } from "react";
import { getDataPack } from "../data/dataPack";
import { getDropChanceBonus } from "../data/milestones";
import { BIOME_ICONS, RESOURCE_ICONS, TOOL_ICONS } from "../data/icons";
import { ActionDef, GameState } from "../data/types";
import { getResource, hasTool } from "../engine/gameState";

interface Props {
  actions: ActionDef[];
  state: GameState;
  onStart: (action: ActionDef) => void;
  currentActionId?: string | null;
}

const BIOME_NAMES: Record<string, string> = {
  beach: "Beach",
  coconut_grove: "Coconut Grove",
  rocky_shore: "Rocky Shore",
  bamboo_grove: "Bamboo Grove",
  jungle_interior: "Jungle Interior",
  nearby_island: "Nearby Island",
};

/** Order biomes appear in the gather panel. Actions without a biome go under "beach". */
const BIOME_ORDER: string[] = [
  "beach",
  "coconut_grove",
  "rocky_shore",
  "bamboo_grove",
  "jungle_interior",
  "nearby_island",
];

export function ActionPanel({ actions, state, onStart, currentActionId }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const pack = getDataPack();

  const grouped = new Map<string, ActionDef[]>();
  for (const a of actions) {
    const biome = a.requiredBiome ?? "beach";
    const list = grouped.get(biome) ?? [];
    list.push(a);
    grouped.set(biome, list);
  }

  const toggleBiome = (biomeId: string) => {
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
              // Check tool requirements
              const missingTool = action.requiredTools?.find(
                (t) => !hasTool(state, t)
              );
              // Check resource requirements
              const missingResource = action.requiredResources?.find(
                (r) => getResource(state, r) < 1
              );
              const disabled = !!missingTool || !!missingResource;
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
                            {pack.resources[d.resourceId]?.name ?? d.resourceId}
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
                      <span title={pack.tools[missingTool]?.description}>
                        {TOOL_ICONS[missingTool] ?? ""}{pack.tools[missingTool]?.name ?? missingTool}
                      </span>
                    </div>
                  )}
                  {missingResource && !missingTool && (
                    <div className="action-requires">
                      Requires:{" "}
                      <span title={pack.resources[missingResource]?.description}>
                        {RESOURCE_ICONS[missingResource] ?? ""}{pack.resources[missingResource]?.name ?? missingResource}
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
