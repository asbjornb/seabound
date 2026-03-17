import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIONS } from "../data/actions";
import { BUILDINGS } from "../data/buildings";
import { EXPEDITIONS } from "../data/expeditions";
import { getDurationMultiplier } from "../data/milestones";
import { RECIPES } from "../data/recipes";
import { RESOURCES } from "../data/resources";
import {
  ActionDef,
  DiscoveryType,
  ExpeditionDef,
  GameState,
  RecipeDef,
} from "../data/types";
import {
  addResource,
  createInitialState,
  deductFood,
  getResource,
  getTotalFood,
  loadGame,
  saveGame,
} from "./gameState";
import { CompletionEvent, processTick } from "./tick";

const TICK_INTERVAL_MS = 100;
const SAVE_INTERVAL_MS = 10000;

/** Refund resources consumed by the current action (craft inputs / expedition food). */
function refundCurrentAction(state: GameState) {
  if (!state.currentAction) return;
  if (state.currentAction.type === "craft" && state.currentAction.recipeId) {
    const recipe = RECIPES.find((r) => r.id === state.currentAction!.recipeId);
    if (recipe) {
      for (const input of recipe.inputs) {
        addResource(state, input.resourceId, input.amount);
      }
    }
  }
  if (
    state.currentAction.type === "expedition" &&
    state.currentAction.expeditionId
  ) {
    const exp = EXPEDITIONS.find(
      (e) => e.id === state.currentAction!.expeditionId
    );
    if (exp?.foodCost && state.currentAction.foodPaid) {
      for (const [resId, amount] of Object.entries(state.currentAction.foodPaid)) {
        addResource(state, resId, amount);
      }
    }
  }
}

let nextDiscoveryId = 0;

function addDiscovery(
  state: GameState,
  type: DiscoveryType,
  message: string
): void {
  state.discoveryLog.unshift({
    id: nextDiscoveryId++,
    type,
    message,
    timestamp: Date.now(),
  });
}

function processCompletionDiscoveries(
  state: GameState,
  c: CompletionEvent
): void {
  if (c.biomeDiscovery) {
    const name = c.biomeDiscovery.replace(/_/g, " ");
    addDiscovery(state, "biome", `Discovered the ${name}`);
  }
  if (c.buildingBuilt) {
    const bdef = BUILDINGS[c.buildingBuilt];
    const name = bdef?.name ?? c.buildingBuilt.replace(/_/g, " ");
    addDiscovery(state, "building", `Built a ${name}`);
  }
  if (c.newResources) {
    for (const resId of c.newResources) {
      const rdef = RESOURCES[resId];
      const name = rdef?.name ?? resId.replace(/_/g, " ");
      addDiscovery(state, "resource", `Found ${name} for the first time`);
    }
  }
  if (c.levelUp) {
    const skillName = c.skillId.charAt(0).toUpperCase() + c.skillId.slice(1);
    addDiscovery(state, "level", `Reached ${skillName} level ${c.levelUp}`);
  }
}

export function useGame() {
  const [state, setState] = useState<GameState>(() => {
    const loaded = loadGame() ?? createInitialState();
    // Initialize discovery ID counter from existing log
    if (loaded.discoveryLog.length > 0) {
      nextDiscoveryId = Math.max(...loaded.discoveryLog.map((e) => e.id)) + 1;
    }
    return loaded;
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  // Game tick loop
  useEffect(() => {
    // Process offline progress on mount
    const offlineMs = Date.now() - stateRef.current.lastTickAt;
    if (offlineMs > 2000) {
      setState((prev) => {
        const next = structuredClone(prev);
        const result = processTick(next, Date.now());
        for (const c of result.completions) {
          processCompletionDiscoveries(next, c);
        }
        return next;
      });
    }

    const interval = setInterval(() => {
      setState((prev) => {
        const next = structuredClone(prev);
        const result = processTick(next, Date.now());
        for (const c of result.completions) {
          processCompletionDiscoveries(next, c);
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

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
      refundCurrentAction(next);
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
        refundCurrentAction(next);
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
        return next;
      });
    },
    []
  );

  const startExpedition = useCallback(
    (expedition: ExpeditionDef) => {
      setState((prev) => {
        // Check food costs
        if (expedition.foodCost && getTotalFood(prev) < expedition.foodCost) {
          return prev;
        }
        const next = structuredClone(prev);
        refundCurrentAction(next);
        // Deduct food
        let foodPaid: Record<string, number> | undefined;
        if (expedition.foodCost) {
          const paid = deductFood(next, expedition.foodCost);
          if (!paid) return prev;
          foodPaid = paid;
        }
        next.currentAction = {
          actionId: expedition.id,
          startedAt: Date.now(),
          type: "expedition",
          expeditionId: expedition.id,
          foodPaid,
        };
        return next;
      });
    },
    []
  );

  const stopAction = useCallback(() => {
    setState((prev) => {
      if (!prev.currentAction) return prev;
      const next = structuredClone(prev);
      refundCurrentAction(next);
      next.currentAction = null;
      return next;
    });
  }, []);

  const resetGame = useCallback(() => {
    const fresh = createInitialState();
    setState(fresh);
    saveGame(fresh);
  }, []);

  const exportSave = useCallback(() => {
    saveGame(stateRef.current);
    const data = JSON.stringify(stateRef.current);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seabound-save.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importSave = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const loaded = JSON.parse(reader.result as string) as GameState;
          // Ensure migration fields exist
          if (!loaded.discoveryLog) loaded.discoveryLog = [];
          if (!loaded.discoveredResources) {
            loaded.discoveredResources = Object.keys(loaded.resources).filter(
              (id) => (loaded.resources[id] ?? 0) > 0
            );
          }
          saveGame(loaded);
          setState(loaded);
        } catch {
          // silently fail — could add error UI later
        }
      };
      reader.readAsText(file);
    },
    []
  );

  // Filter actions by skill level, biome discovery, building requirements, AND tool availability
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
    // Hide actions whose required tools the player doesn't have yet
    if (a.requiredTools) {
      for (const toolId of a.requiredTools) {
        if (getResource(state, toolId) < 1) return false;
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
    // Hide one-time-craft recipes once the player owns the output
    if (r.oneTimeCraft && getResource(state, r.output.resourceId) >= 1) {
      return false;
    }
    return true;
  });

  // Filter expeditions by visibility rules
  const availableExpeditions = EXPEDITIONS.filter((exp) => {
    // Must have discovered required biomes to see this expedition
    if (exp.requiredBiomes) {
      for (const req of exp.requiredBiomes) {
        if (!state.discoveredBiomes.includes(req)) return false;
      }
    }
    // Hide expedition once all its discoverable biomes have been found
    if (exp.hideWhenAllFound) {
      const discoverableBiomes = exp.outcomes
        .filter((o) => o.biomeDiscovery)
        .map((o) => o.biomeDiscovery!);
      if (
        discoverableBiomes.length > 0 &&
        discoverableBiomes.every((b) => state.discoveredBiomes.includes(b))
      ) {
        return false;
      }
    }
    return true;
  });

  // Current action progress (0..1)
  let actionProgress = 0;
  let actionDuration = 0;
  if (state.currentAction) {
    if (state.currentAction.type === "gather") {
      const def = ACTIONS.find(
        (a) => a.id === state.currentAction!.actionId
      );
      if (def) {
        const skillLevel = state.skills[def.skillId].level;
        const effectiveDuration = Math.round(
          def.durationMs * getDurationMultiplier(def.skillId, skillLevel, def.id)
        );
        actionDuration = effectiveDuration;
        const elapsed = Date.now() - state.currentAction.startedAt;
        actionProgress = Math.min(1, elapsed / effectiveDuration);
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
    exportSave,
    importSave,
  };
}
