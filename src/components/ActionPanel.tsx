import { useState } from "react";
import { getDropChanceBonus } from "../data/milestones";
import { getBiomeOrder, getBiomes, getResources, getTools } from "../data/registry";
import type { ActionDef, GameState } from "../data/types";
import { getResource, hasTool, isAtStorageCap } from "../engine/gameState";
import { resourceHasUse } from "../engine/selectors";
import { GameIcon } from "./GameIcon";

interface Props {
  actions: ActionDef[];
  state: GameState;
  onStart: (action: ActionDef) => void;
  currentActionId?: string | null;
}

export function ActionPanel({ actions, state, onStart, currentActionId }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const BIOMES = getBiomes();
  const BIOME_ORDER = getBiomeOrder();
  const RESOURCES = getResources();
  const TOOLS = getTools();

  const grouped = new Map<string, ActionDef[]>();
  for (const a of actions) {
    const biome: string = a.requiredBiome ?? BIOME_ORDER[0] ?? "beach";
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
        const biomeName = BIOMES[biomeId]?.name ?? biomeId.replace(/_/g, " ");
        return (
          <div key={biomeId}>
            <div
              className="section-title collapsible"
              onClick={() => toggleBiome(biomeId)}
            >
              <span className={`collapse-arrow ${isCollapsed ? "collapsed" : ""}`}>&#9662;</span>
              <GameIcon id={`biome_${biomeId}`} /> {biomeName}
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
              const isNew = !state.completedActions.includes(action.id);
              const visibleDrops = action.drops.filter((d) => resourceHasUse(d.resourceId, state));
              const allOutputsFull = visibleDrops.length > 0 && visibleDrops.every((d) => isAtStorageCap(state, d.resourceId));
              return (
                <div
                  key={action.id}
                  className={`action-card ${disabled ? "disabled" : ""} ${isActive ? "active" : ""} ${allOutputsFull ? "all-full" : ""}`}
                  onClick={() => !disabled && onStart(action)}
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
                  {visibleDrops.length > 0 ? (
                    <div className="action-drops">
                      Drops:
                      {visibleDrops
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
                        .map((d, i) => {
                          const full = isAtStorageCap(state, d.resourceId);
                          return (
                        <div key={i} className={`drop-row ${full ? "full" : ""}`}>
                            <GameIcon id={d.resourceId} size={16} />{d.amount}x{" "}
                            {RESOURCES[d.resourceId]?.name ?? d.resourceId}
                            {" "}({Math.round(d.effectiveChance * 100)}%)
                            {full && <span className="full-badge">FULL</span>}
                        </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="action-drops">XP only</div>
                  )}
                  {missingTool && (
                    <div className="action-requires">
                      Requires:{" "}
                      <span title={TOOLS[missingTool]?.description}>
                        <GameIcon id={missingTool} size={16} />{TOOLS[missingTool]?.name ?? missingTool}
                      </span>
                    </div>
                  )}
                  {missingResource && !missingTool && (
                    <div className="action-requires">
                      Requires:{" "}
                      <span title={RESOURCES[missingResource]?.description}>
                        <GameIcon id={missingResource} size={16} />{RESOURCES[missingResource]?.name ?? missingResource}
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
