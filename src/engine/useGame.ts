import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIONS } from "../data/actions";
import { EXPEDITIONS } from "../data/expeditions";
import { RECIPES } from "../data/recipes";
import { ActionDef, ExpeditionDef, GameState, RecipeDef } from "../data/types";
import {
  createInitialState,
  getResource,
  loadGame,
  saveGame,
} from "./gameState";
import { CompletionEvent, processTick } from "./tick";

const TICK_INTERVAL_MS = 100;
const SAVE_INTERVAL_MS = 10000;

export interface GameLog {
  id: number;
  message: string;
  timestamp: number;
}

export function useGame() {
  const [state, setState] = useState<GameState>(() => {
    return loadGame() ?? createInitialState();
  });
  const [logs, setLogs] = useState<GameLog[]>([]);
  const logIdRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const addLog = useCallback((message: string) => {
    setLogs((prev) => {
      const entry: GameLog = {
        id: logIdRef.current++,
        message,
        timestamp: Date.now(),
      };
      const next = [entry, ...prev];
      return next.length > 50 ? next.slice(0, 50) : next;
    });
  }, []);

  // Game tick loop
  useEffect(() => {
    // Process offline progress on mount
    const offlineMs = Date.now() - stateRef.current.lastTickAt;
    if (offlineMs > 2000) {
      setState((prev) => {
        const next = structuredClone(prev);
        const result = processTick(next, Date.now());
        if (result.completions.length > 0) {
          addLog(
            `While away: completed ${result.completions.length} action(s) (${Math.round(offlineMs / 1000)}s offline)`
          );
          for (const c of result.completions) {
            logCompletion(c, addLog);
          }
        }
        return next;
      });
    }

    const interval = setInterval(() => {
      setState((prev) => {
        const next = structuredClone(prev);
        const result = processTick(next, Date.now());
        for (const c of result.completions) {
          logCompletion(c, addLog);
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [addLog]);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame(stateRef.current);
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Save on unload
  useEffect(() => {
    const handler = () => saveGame(stateRef.current);
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const startAction = useCallback((action: ActionDef) => {
    setState((prev) => {
      const skill = prev.skills[action.skillId];
      if (action.requiredSkillLevel && skill.level < action.requiredSkillLevel) {
        return prev;
      }
      if (action.requiredTools) {
        for (const toolId of action.requiredTools) {
          if (getResource(prev, toolId) < 1) return prev;
        }
      }
      if (
        action.requiredBiome &&
        !prev.discoveredBiomes.includes(action.requiredBiome)
      ) {
        return prev;
      }
      const next = structuredClone(prev);
      next.currentAction = {
        actionId: action.id,
        startedAt: Date.now(),
        type: "gather",
      };
      return next;
    });
  }, []);

  const startCraft = useCallback(
    (recipe: RecipeDef) => {
      setState((prev) => {
        const skill = prev.skills[recipe.skillId];
        if (
          recipe.requiredSkillLevel &&
          skill.level < recipe.requiredSkillLevel
        ) {
          return prev;
        }
        // Check required items (item-trigger gate)
        if (recipe.requiredItems) {
          for (const itemId of recipe.requiredItems) {
            if (getResource(prev, itemId) < 1) return prev;
          }
        }
        // Check resources
        for (const input of recipe.inputs) {
          if (getResource(prev, input.resourceId) < input.amount) return prev;
        }
        const next = structuredClone(prev);
        for (const input of recipe.inputs) {
          next.resources[input.resourceId] =
            (next.resources[input.resourceId] ?? 0) - input.amount;
        }
        next.currentAction = {
          actionId: recipe.id,
          startedAt: Date.now(),
          type: "craft",
          recipeId: recipe.id,
        };
        addLog(`Started crafting: ${recipe.name}`);
        return next;
      });
    },
    [addLog]
  );

  const startExpedition = useCallback(
    (expedition: ExpeditionDef) => {
      setState((prev) => {
        // Check food costs
        if (expedition.foodCost) {
          for (const cost of expedition.foodCost) {
            if (getResource(prev, cost.resourceId) < cost.amount) return prev;
          }
        }
        const next = structuredClone(prev);
        // Deduct food
        if (expedition.foodCost) {
          for (const cost of expedition.foodCost) {
            next.resources[cost.resourceId] =
              (next.resources[cost.resourceId] ?? 0) - cost.amount;
          }
        }
        next.currentAction = {
          actionId: expedition.id,
          startedAt: Date.now(),
          type: "expedition",
          expeditionId: expedition.id,
        };
        addLog(`Set out on expedition: ${expedition.name}`);
        return next;
      });
    },
    [addLog]
  );

  const stopAction = useCallback(() => {
    setState((prev) => {
      if (!prev.currentAction) return prev;
      const next = structuredClone(prev);
      // If it was a craft, refund resources
      if (next.currentAction?.type === "craft" && next.currentAction.recipeId) {
        const recipe = RECIPES.find(
          (r) => r.id === next.currentAction!.recipeId
        );
        if (recipe) {
          for (const input of recipe.inputs) {
            next.resources[input.resourceId] =
              (next.resources[input.resourceId] ?? 0) + input.amount;
          }
        }
      }
      // If it was an expedition, refund food
      if (
        next.currentAction?.type === "expedition" &&
        next.currentAction.expeditionId
      ) {
        const exp = EXPEDITIONS.find(
          (e) => e.id === next.currentAction!.expeditionId
        );
        if (exp?.foodCost) {
          for (const cost of exp.foodCost) {
            next.resources[cost.resourceId] =
              (next.resources[cost.resourceId] ?? 0) + cost.amount;
          }
        }
      }
      next.currentAction = null;
      return next;
    });
  }, []);

  const resetGame = useCallback(() => {
    const fresh = createInitialState();
    setState(fresh);
    saveGame(fresh);
    setLogs([]);
  }, []);

  // Filter actions by skill level, biome discovery, AND building requirements
  const availableActions = ACTIONS.filter((a) => {
    const skill = state.skills[a.skillId];
    if (a.requiredSkillLevel && skill.level < a.requiredSkillLevel) return false;
    if (a.requiredBiome && !state.discoveredBiomes.includes(a.requiredBiome))
      return false;
    if (a.requiredBuildings) {
      for (const bid of a.requiredBuildings) {
        if (!state.buildings.includes(bid)) return false;
      }
    }
    return true;
  });

  // Filter recipes by skill level, item-trigger gates, AND building requirements
  // Also hide building recipes for buildings already constructed
  const availableRecipes = RECIPES.filter((r) => {
    const skill = state.skills[r.skillId];
    if (r.requiredSkillLevel && skill.level < r.requiredSkillLevel) return false;
    if (r.requiredItems) {
      for (const itemId of r.requiredItems) {
        if (getResource(state, itemId) < 1) return false;
      }
    }
    if (r.requiredBuildings) {
      for (const bid of r.requiredBuildings) {
        if (!state.buildings.includes(bid)) return false;
      }
    }
    // Hide building recipes for already-built buildings
    if (r.buildingOutput && state.buildings.includes(r.buildingOutput)) {
      return false;
    }
    return true;
  });

  // All expeditions (for now just scout_island)
  const availableExpeditions = EXPEDITIONS;

  // Current action progress (0..1)
  let actionProgress = 0;
  let actionDuration = 0;
  if (state.currentAction) {
    if (state.currentAction.type === "gather") {
      const def = ACTIONS.find(
        (a) => a.id === state.currentAction!.actionId
      );
      if (def) {
        actionDuration = def.durationMs;
        const elapsed = Date.now() - state.currentAction.startedAt;
        actionProgress = Math.min(1, elapsed / def.durationMs);
      }
    } else if (state.currentAction.type === "craft") {
      const def = RECIPES.find(
        (r) => r.id === state.currentAction!.recipeId
      );
      if (def) {
        actionDuration = def.durationMs;
        const elapsed = Date.now() - state.currentAction.startedAt;
        actionProgress = Math.min(1, elapsed / def.durationMs);
      }
    } else if (state.currentAction.type === "expedition") {
      const def = EXPEDITIONS.find(
        (e) => e.id === state.currentAction!.expeditionId
      );
      if (def) {
        actionDuration = def.durationMs;
        const elapsed = Date.now() - state.currentAction.startedAt;
        actionProgress = Math.min(1, elapsed / def.durationMs);
      }
    }
  }

  return {
    state,
    logs,
    availableActions,
    availableRecipes,
    availableExpeditions,
    actionProgress,
    actionDuration,
    startAction,
    startCraft,
    startExpedition,
    stopAction,
    resetGame,
  };
}

function logCompletion(c: CompletionEvent, addLog: (msg: string) => void) {
  if (c.expeditionMessage) {
    addLog(c.expeditionMessage);
  }
  if (c.biomeDiscovery) {
    addLog(
      `New area discovered: ${c.biomeDiscovery.replace(/_/g, " ")}! New actions unlocked.`
    );
  }
  const dropStr = c.drops.map((d) => `${d.amount}x ${d.name}`).join(", ");
  if (dropStr) {
    addLog(
      `${c.actionName}: +${dropStr} (+${c.xpGain} ${c.skillId} xp)`
    );
  } else if (!c.expeditionMessage) {
    addLog(`${c.actionName}: +${c.xpGain} ${c.skillId} xp`);
  }
  if (c.levelUp) {
    addLog(`Level up! ${c.skillId} is now level ${c.levelUp}!`);
  }
}
