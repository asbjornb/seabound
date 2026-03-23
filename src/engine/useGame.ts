import { useCallback, useEffect, useRef, useState } from "react";
import { BUILDINGS } from "../data/buildings";
import { getDropChanceBonus } from "../data/milestones";
import {
  STATIONS_BY_ID,
} from "../data/registries";
import { levelFromXp } from "../data/skills";
import { RESOURCES } from "../data/resources";
import { TOOLS } from "../data/tools";
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
  canAffordTagInputs,
  createInitialState,
  getBuildingCount,
  getEffectiveInputs,
  getResource,
  getTotalFood,
  getTotalWater,
  hasTool,
  hasBuilding,
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
      if (
        action.requiredBiome &&
        !prev.discoveredBiomes.includes(action.requiredBiome)
      ) {
        return prev;
      }
      const next = structuredClone(prev);
      resetRepetitiveCountOnManualActionChange(next, `gather:${action.id}`);
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
        // Check upgrade source building exists
        if (recipe.replacesBuilding && !hasBuilding(prev, recipe.replacesBuilding)) return prev;
        // Check resources (using effective inputs — some may be removed by buildings)
        const inputs = getEffectiveInputs(recipe, prev);
        for (const input of inputs) {
          if (getResource(prev, input.resourceId) < input.amount) return prev;
        }
        // Check tag-based inputs (e.g. "5 different foods")
        if (recipe.tagInputs && !canAffordTagInputs(recipe.tagInputs, prev)) return prev;
        const next = structuredClone(prev);
        resetRepetitiveCountOnManualActionChange(next, `craft:${recipe.id}`);
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
        // Check vessel requirement (now a building)
        if (expedition.requiredVessel && !hasBuilding(prev, expedition.requiredVessel)) {
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
        resetRepetitiveCountOnManualActionChange(next, `expedition:${expedition.id}`);
        next.currentAction = {
          actionId: expedition.id,
          startedAt: Date.now(),
          type: "expedition",
          expeditionId: expedition.id,
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
      resetRepetitiveCountOnManualActionChange(next, null);
      next.currentAction = null;
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
      const effectiveSetupInputs = station.setupInputs ? station.setupInputs.map((inp) => {
        // Farming 7: Efficient sowing — wild seed cost reduced from 3 to 2
        if (station.id === "plant_wild_seeds" && inp.resourceId === "wild_seed" &&
            prev.skills.farming.level >= 7) {
          return { ...inp, amount: 2 };
        }
        return inp;
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
      const def = STATIONS_BY_ID[placed.stationId];
      if (!def) return prev;
      const readyAt = placed.deployedAt + def.durationMs;
      if (Date.now() < readyAt) return prev; // not ready yet
      const next = structuredClone(prev);
      const skillLevel = next.skills[def.skillId].level;
      // Roll drops with milestone bonuses
      const newResources: string[] = [];
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
        }
      }
      // Farming level 8: Seed saving — wild seed planting always returns at least 1 seed
      if (def.id === "plant_wild_seeds" && skillLevel >= 8) {
        const gotSeed = newResources.includes("wild_seed") ||
          (next.resources["wild_seed"] ?? 0) > (prev.resources["wild_seed"] ?? 0);
        if (!gotSeed) {
          if (!next.discoveredResources.includes("wild_seed")) {
            newResources.push("wild_seed");
            next.discoveredResources.push("wild_seed");
          }
          addResource(next, "wild_seed", 1);
        }
      }
      // Farming level 18: Master farmer — wild seed planting always yields 2 root vegetables
      if (def.id === "plant_wild_seeds" && skillLevel >= 18) {
        const currentRootVeg = next.resources["root_vegetable"] ?? 0;
        const prevRootVeg = prev.resources["root_vegetable"] ?? 0;
        const gained = currentRootVeg - prevRootVeg;
        if (gained < 2) {
          if (!next.discoveredResources.includes("root_vegetable")) {
            newResources.push("root_vegetable");
            next.discoveredResources.push("root_vegetable");
          }
          addResource(next, "root_vegetable", 2 - Math.max(0, gained));
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
