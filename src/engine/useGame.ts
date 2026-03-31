import { useCallback, useEffect, useRef, useState } from "react";
import { getDropChanceBonus, getStationInputAmount, getStationGuaranteedDrops } from "../data/milestones";
import {
  getBuildings,
  getResources,
  getStationById,
  getTools,
} from "../data/registry";
import { levelFromXp } from "../data/skills";
import type {
  ActionDef,
  DiscoveryType,
  ExpeditionDef,
  GameState,
  RecipeDef,
  StationDef,
} from "../data/types";

import {
  addResource,
  canAffordInput,
  isAtStorageCap,
  canAffordTagInputs,
  createInitialState,
  getBuildingCount,
  getGroupBuildingCount,
  getEffectiveInputs,
  getEffectiveMaxCount,
  getResource,
  getTotalFood,
  getTotalWater,
  hasTool,
  hasBuilding,
  hasVessel,
  loadGame,
  normalizeGameState,
  saveGame,
} from "./gameState";
import {
  selectAvailableActions,
  selectAvailableExpeditions,
  selectAvailableRecipes,
  selectAvailableStations,
  selectLockedStations,
  selectCurrentActionTiming,
} from "./selectors";
import { CompletionEvent, processTick } from "./tick";

const TICK_INTERVAL_MS = 100;
const SAVE_INTERVAL_MS = 10000;

function getCurrentActionKey(state: GameState): string | null {
  if (!state.currentAction) return null;
  const { type, actionId } = state.currentAction;
  return `${type}:${actionId}`;
}

function resetRepetitiveCountOnManualActionChange(state: GameState, nextActionKey: string | null): void {
  const prevActionKey = getCurrentActionKey(state);
  if (prevActionKey !== nextActionKey) {
    state.repetitiveActionCount = 0;
  }
}

/** Save partial progress for the current action before switching away. */
function saveCurrentActionProgress(state: GameState): void {
  if (!state.currentAction) return;
  const key = getCurrentActionKey(state);
  if (!key) return;
  const elapsed = Date.now() - state.currentAction.startedAt;
  if (elapsed > 0) {
    state.savedActionProgress[key] = elapsed;
  }
}

/** Restore saved progress for an action by adjusting startedAt backwards. */
function restoreActionProgress(state: GameState, actionKey: string): void {
  const saved = state.savedActionProgress[actionKey];
  if (saved && saved > 0 && state.currentAction) {
    state.currentAction.startedAt = Date.now() - saved;
    delete state.savedActionProgress[actionKey];
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
  const BUILDINGS = getBuildings();
  const TOOLS = getTools();
  const RESOURCES = getResources();

  if (c.biomeDiscovery) {
    const name = c.biomeDiscovery.replace(/_/g, " ");
    addDiscovery(state, "biome", `Discovered the ${name}`);
  }
  if (c.buildingBuilt) {
    const bdef = BUILDINGS[c.buildingBuilt];
    const name = bdef?.name ?? c.buildingBuilt.replace(/_/g, " ");
    addDiscovery(state, "building", `Built a ${name}`);
    // Easter egg: building a dugout without ever building a raft
    if (c.buildingBuilt === "dugout" && !state.buildings.includes("raft")) {
      addDiscovery(state, "building", "A raft? Where you're going, you don't need rafts.");
    }
  }
  if (c.toolCrafted) {
    const tdef = TOOLS[c.toolCrafted];
    const name = tdef?.name ?? c.toolCrafted.replace(/_/g, " ");
    addDiscovery(state, "tool", `Crafted ${name}`);
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
          if (!hasTool(prev, toolId)) return prev;
        }
      }
      if (action.requiredResources) {
        for (const resId of action.requiredResources) {
          if (getResource(prev, resId) < 1) return prev;
        }
      }
      if (action.requiredBuildings) {
        for (const buildingId of action.requiredBuildings) {
          if (!hasBuilding(prev, buildingId)) return prev;
        }
      }
      if (
        action.requiredBiome &&
        !prev.discoveredBiomes.includes(action.requiredBiome)
      ) {
        return prev;
      }
      const next = structuredClone(prev);
      saveCurrentActionProgress(next);
      resetRepetitiveCountOnManualActionChange(next, `gather:${action.id}`);
      const actionKey = `gather:${action.id}`;
      const fullAtStart = action.drops
        .filter((d) => isAtStorageCap(next, d.resourceId))
        .map((d) => d.resourceId);
      next.currentAction = {
        actionId: action.id,
        startedAt: Date.now(),
        type: "gather",
        ...(fullAtStart.length > 0 && { fullAtStart }),
      };
      restoreActionProgress(next, actionKey);
      return next;
    });
  }, []);

  const startCraft = useCallback(
    (recipe: RecipeDef) => {
      setState((prev) => {
        const BUILDINGS = getBuildings();
        const skill = prev.skills[recipe.skillId];
        if (
          recipe.requiredSkillLevel &&
          skill.level < recipe.requiredSkillLevel
        ) {
          return prev;
        }
        // Check dual-skill requirements
        if (recipe.requiredSkills?.some((req) => prev.skills[req.skillId].level < req.level)) {
          return prev;
        }
        // Check required tools
        if (recipe.requiredTools) {
          for (const toolId of recipe.requiredTools) {
            if (!hasTool(prev, toolId)) return prev;
          }
        }
        // Check required items (item-trigger gate)
        if (recipe.requiredItems) {
          for (const itemId of recipe.requiredItems) {
            if (getResource(prev, itemId) < 1) return prev;
          }
        }
        // Check required buildings
        if (recipe.requiredBuildings?.some((bid) => !hasBuilding(prev, bid))) return prev;
        // Check stackable building max count (group-aware for upgrade chains)
        // Skip for upgrade recipes — they replace 1-for-1 so the total doesn't increase
        if (recipe.buildingOutput && !recipe.replacesBuilding) {
          const bdef = BUILDINGS[recipe.buildingOutput];
          if (bdef?.maxCount && getGroupBuildingCount(prev, recipe.buildingOutput) >= getEffectiveMaxCount(prev, recipe.buildingOutput)) return prev;
        }
        // Check upgrade source building exists
        if (recipe.replacesBuilding && !hasBuilding(prev, recipe.replacesBuilding)) return prev;
        // Check resources (using effective inputs — some may be removed by buildings)
        const inputs = getEffectiveInputs(recipe, prev);
        for (const input of inputs) {
          if (!canAffordInput(input, prev)) return prev;
        }
        // Check tag-based inputs (e.g. "5 different foods")
        if (recipe.tagInputs && !canAffordTagInputs(recipe.tagInputs, prev)) return prev;
        const next = structuredClone(prev);
        saveCurrentActionProgress(next);
        resetRepetitiveCountOnManualActionChange(next, `craft:${recipe.id}`);
        const actionKey = `craft:${recipe.id}`;
        const fullAtStart = recipe.output && isAtStorageCap(next, recipe.output.resourceId)
          ? [recipe.output.resourceId] : [];
        next.currentAction = {
          actionId: recipe.id,
          startedAt: Date.now(),
          type: "craft",
          recipeId: recipe.id,
          ...(fullAtStart.length > 0 && { fullAtStart }),
        };
        restoreActionProgress(next, actionKey);
        return next;
      });
    },
    []
  );

  const startExpedition = useCallback(
    (expedition: ExpeditionDef) => {
      setState((prev) => {
        // Check vessel requirement — higher-tier vessels satisfy lower-tier ones
        if (expedition.requiredVessel && !hasVessel(prev, expedition.requiredVessel)) {
          return prev;
        }
        // Check food, water, and resource input costs
        if (expedition.foodCost && getTotalFood(prev) < expedition.foodCost) {
          return prev;
        }
        if (expedition.waterCost && getTotalWater(prev) < expedition.waterCost) {
          return prev;
        }
        if (expedition.inputs?.some(
          (inp) => (prev.resources[inp.resourceId] ?? 0) < inp.amount
        )) {
          return prev;
        }
        const next = structuredClone(prev);
        saveCurrentActionProgress(next);
        resetRepetitiveCountOnManualActionChange(next, `expedition:${expedition.id}`);
        const actionKey = `expedition:${expedition.id}`;
        next.currentAction = {
          actionId: expedition.id,
          startedAt: Date.now(),
          type: "expedition",
          expeditionId: expedition.id,
        };
        restoreActionProgress(next, actionKey);
        return next;
      });
    },
    []
  );

  const stopAction = useCallback(() => {
    setState((prev) => {
      if (!prev.currentAction) return prev;
      const next = structuredClone(prev);
      saveCurrentActionProgress(next);
      resetRepetitiveCountOnManualActionChange(next, null);
      next.currentAction = null;
      return next;
    });
  }, []);

  const toggleStopWhenFull = useCallback(() => {
    setState((prev) => {
      const next = structuredClone(prev);
      next.stopWhenFull = !prev.stopWhenFull;
      return next;
    });
  }, []);

  const deployStation = useCallback((station: StationDef) => {
    setState((prev) => {
      const skill = prev.skills[station.skillId];
      if (station.requiredSkillLevel && skill.level < station.requiredSkillLevel) return prev;
      if (station.requiredTool && !hasTool(prev, station.requiredTool)) return prev;
      if (station.requiredBuildings) {
        for (const bid of station.requiredBuildings) {
          if (!prev.buildings.includes(bid)) return prev;
        }
      }
      // Check max deployed
      let maxDeployed = station.maxDeployed ?? 1;
      if (station.maxDeployedPerBuildings) {
        maxDeployed = station.maxDeployedPerBuildings.reduce(
          (sum, bid) => sum + getBuildingCount(prev, bid), 0
        );
      }
      const currentCount = prev.stations.filter((s) => s.stationId === station.id).length;
      if (currentCount >= maxDeployed) return prev;
      // Get effective setup inputs (may be modified by milestones)
      const skillLevel = prev.skills[station.skillId].level;
      const effectiveSetupInputs = station.setupInputs ? station.setupInputs.map((inp) => {
        const newAmount = getStationInputAmount(station.skillId, skillLevel, station.id, inp.resourceId, inp.amount);
        return { ...inp, amount: newAmount };
      }) : [];
      // Check setup inputs
      for (const inp of effectiveSetupInputs) {
        if (getResource(prev, inp.resourceId) < inp.amount) return prev;
      }
      const next = structuredClone(prev);
      // Deduct setup inputs
      for (const inp of effectiveSetupInputs) {
        next.resources[inp.resourceId] =
          (next.resources[inp.resourceId] ?? 0) - inp.amount;
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
      const def = getStationById(placed.stationId);
      if (!def) return prev;
      const readyAt = placed.deployedAt + def.durationMs;
      if (Date.now() < readyAt) return prev; // not ready yet
      const next = structuredClone(prev);
      const skillLevel = next.skills[def.skillId].level;
      // Roll drops with milestone bonuses
      const newResources: string[] = [];
      const droppedAmounts = new Map<string, number>();
      for (const drop of def.yields) {
        let chance = drop.chance ?? 1;
        // Apply milestone drop chance bonuses (uses actionId = stationId)
        chance = Math.min(1, chance + getDropChanceBonus(def.skillId, skillLevel, def.id, drop.resourceId));
        if (Math.random() < chance) {
          if (!next.discoveredResources.includes(drop.resourceId)) {
            newResources.push(drop.resourceId);
            next.discoveredResources.push(drop.resourceId);
          }
          addResource(next, drop.resourceId, drop.amount);
          droppedAmounts.set(drop.resourceId, (droppedAmounts.get(drop.resourceId) ?? 0) + drop.amount);
        }
      }
      // Apply guaranteed drops from milestones
      const guaranteedDrops = getStationGuaranteedDrops(def.skillId, skillLevel, def.id);
      for (const [resourceId, minAmount] of guaranteedDrops) {
        const got = droppedAmounts.get(resourceId) ?? 0;
        if (got < minAmount) {
          if (!next.discoveredResources.includes(resourceId)) {
            newResources.push(resourceId);
            next.discoveredResources.push(resourceId);
          }
          addResource(next, resourceId, minAmount - got);
        }
      }
      // Award XP
      const skill = next.skills[def.skillId];
      skill.xp += def.xpGain;
      skill.level = levelFromXp(skill.xp);
      // Discovery log
      const RESOURCES = getResources();
      for (const resId of newResources) {
        const rdef = RESOURCES[resId];
        const name = rdef?.name ?? resId.replace(/_/g, " ");
        addDiscovery(next, "resource", `Found ${name} for the first time`);
      }
      // Remove the collected station and auto-redeploy if no setup inputs needed
      next.stations.splice(index, 1);
      if (!def.setupInputs || def.setupInputs.length === 0) {
        // Auto-reset: re-deploy the station immediately (no resources consumed)
        next.stations.push({
          stationId: def.id,
          deployedAt: Date.now(),
        });
      }
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

  const markDiscoverySeen = useCallback((id: number) => {
    setState((prev) => {
      if (id <= prev.lastSeenDiscoveryId) return prev;
      return { ...prev, lastSeenDiscoveryId: id };
    });
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

  const importSaveFromJson = useCallback(
    (json: string): boolean => {
      try {
        const loaded = normalizeGameState(JSON.parse(json));
        if (!loaded) return false;
        saveGame(loaded);
        setState(loaded);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const availableActions = selectAvailableActions(state);
  const availableRecipes = selectAvailableRecipes(state);
  const availableExpeditions = selectAvailableExpeditions(state);
  const availableStations = selectAvailableStations(state);
  const lockedStations = selectLockedStations(state);
  const { actionProgress, actionDuration } = selectCurrentActionTiming(state);

  return {
    state,
    availableActions,
    availableRecipes,
    availableExpeditions,
    availableStations,
    lockedStations,
    actionProgress,
    actionDuration,
    startAction,
    startCraft,
    startExpedition,
    stopAction,
    toggleStopWhenFull,
    deployStation,
    collectStation,
    markDiscoverySeen,
    markPhaseSeen,
    resetGame,
    exportSave,
    importSave,
    importSaveFromJson,
  };
}
