import { useCallback, useEffect, useRef, useState } from "react";
import { BUILDINGS } from "../data/buildings";
import {
  EXPEDITIONS_BY_ID,
  RECIPES_BY_ID,
  STATIONS_BY_ID,
} from "../data/registries";
import { levelFromXp } from "../data/skills";
import { RESOURCES } from "../data/resources";
import {
  ActionDef,
  DiscoveryType,
  ExpeditionDef,
  GameState,
  RecipeDef,
  StationDef,
} from "../data/types";
import {
  addResource,
  createInitialState,
  deductFood,
  deductWater,
  getResource,
  getTotalFood,
  getTotalWater,
  loadGame,
  normalizeGameState,
  saveGame,
} from "./gameState";
import {
  selectAvailableActions,
  selectAvailableExpeditions,
  selectAvailableRecipes,
  selectAvailableStations,
  selectCurrentActionTiming,
} from "./selectors";
import { CompletionEvent, processTick } from "./tick";

const TICK_INTERVAL_MS = 100;
const SAVE_INTERVAL_MS = 10000;

/** Refund resources consumed by the current action (craft inputs / expedition food). */
function refundCurrentAction(state: GameState) {
  if (!state.currentAction) return;
  if (state.currentAction.type === "craft" && state.currentAction.recipeId) {
    const recipe = RECIPES_BY_ID[state.currentAction.recipeId];
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
    const exp = EXPEDITIONS_BY_ID[state.currentAction.expeditionId];
    if (exp?.foodCost && state.currentAction.foodPaid) {
      for (const [resId, amount] of Object.entries(state.currentAction.foodPaid)) {
        addResource(state, resId, amount);
      }
    }
    if (exp?.waterCost && state.currentAction.waterPaid) {
      for (const [resId, amount] of Object.entries(state.currentAction.waterPaid)) {
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
      if (prev.currentAction?.actionId === action.id) {
        return prev;
      }
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
        // Check vessel requirement
        if (expedition.requiredVessel && getResource(prev, expedition.requiredVessel) < 1) {
          return prev;
        }
        // Check food and water costs
        if (expedition.foodCost && getTotalFood(prev) < expedition.foodCost) {
          return prev;
        }
        if (expedition.waterCost && getTotalWater(prev) < expedition.waterCost) {
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
        // Deduct water
        let waterPaid: Record<string, number> | undefined;
        if (expedition.waterCost) {
          const paid = deductWater(next, expedition.waterCost);
          if (!paid) return prev;
          waterPaid = paid;
        }
        next.currentAction = {
          actionId: expedition.id,
          startedAt: Date.now(),
          type: "expedition",
          expeditionId: expedition.id,
          foodPaid,
          waterPaid,
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

  const deployStation = useCallback((station: StationDef) => {
    setState((prev) => {
      const skill = prev.skills[station.skillId];
      if (station.requiredSkillLevel && skill.level < station.requiredSkillLevel) return prev;
      if (station.requiredTool && getResource(prev, station.requiredTool) < 1) return prev;
      if (station.requiredBuildings) {
        for (const bid of station.requiredBuildings) {
          if (!prev.buildings.includes(bid)) return prev;
        }
      }
      // Check max deployed
      const maxDeployed = station.maxDeployed ?? 1;
      const currentCount = prev.stations.filter((s) => s.stationId === station.id).length;
      if (currentCount >= maxDeployed) return prev;
      // Check setup inputs
      if (station.setupInputs) {
        for (const inp of station.setupInputs) {
          if (getResource(prev, inp.resourceId) < inp.amount) return prev;
        }
      }
      const next = structuredClone(prev);
      // Deduct setup inputs
      if (station.setupInputs) {
        for (const inp of station.setupInputs) {
          next.resources[inp.resourceId] =
            (next.resources[inp.resourceId] ?? 0) - inp.amount;
        }
      }
      next.stations.push({
        stationId: station.id,
        deployedAt: Date.now(),
      });
      return next;
    });
  }, []);

  const collectStation = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= prev.stations.length) return prev;
      const placed = prev.stations[index];
      const def = STATIONS_BY_ID[placed.stationId];
      if (!def) return prev;
      const readyAt = placed.deployedAt + def.durationMs;
      if (Date.now() < readyAt) return prev; // not ready yet
      const next = structuredClone(prev);
      // Roll drops
      const newResources: string[] = [];
      for (const drop of def.yields) {
        const chance = drop.chance ?? 1;
        if (Math.random() < chance) {
          if (!next.discoveredResources.includes(drop.resourceId)) {
            newResources.push(drop.resourceId);
            next.discoveredResources.push(drop.resourceId);
          }
          addResource(next, drop.resourceId, drop.amount);
        }
      }
      // Award XP
      const skill = next.skills[def.skillId];
      skill.xp += def.xpGain;
      skill.level = levelFromXp(skill.xp);
      // Discovery log
      for (const resId of newResources) {
        const rdef = RESOURCES[resId];
        const name = rdef?.name ?? resId.replace(/_/g, " ");
        addDiscovery(next, "resource", `Found ${name} for the first time`);
      }
      // Remove the collected station
      next.stations.splice(index, 1);
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

  const markPhaseSeen = useCallback((phaseId: string) => {
    setState((prev) => {
      if (prev.seenPhases.includes(phaseId)) return prev;
      const next = structuredClone(prev);
      next.seenPhases.push(phaseId);
      return next;
    });
  }, []);

  const importSave = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const loaded = normalizeGameState(JSON.parse(reader.result as string));
          if (!loaded) {
            return;
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

  const availableActions = selectAvailableActions(state);
  const availableRecipes = selectAvailableRecipes(state);
  const availableExpeditions = selectAvailableExpeditions(state);
  const availableStations = selectAvailableStations(state);
  const { actionProgress, actionDuration } = selectCurrentActionTiming(state);

  return {
    state,
    availableActions,
    availableRecipes,
    availableExpeditions,
    availableStations,
    actionProgress,
    actionDuration,
    startAction,
    startCraft,
    startExpedition,
    stopAction,
    deployStation,
    collectStation,
    markPhaseSeen,
    resetGame,
    exportSave,
    importSave,
  };
}
