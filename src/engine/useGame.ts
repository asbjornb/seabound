import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIONS } from "../data/actions";
import { BUILDINGS } from "../data/buildings";
import { EXPEDITIONS } from "../data/expeditions";
import { getDurationMultiplier } from "../data/milestones";
import { levelFromXp } from "../data/skills";
import { RECIPES } from "../data/recipes";
import { RESOURCES } from "../data/resources";
import { STATIONS } from "../data/stations";
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
  getMoraleDurationMultiplier,
  getResource,
  getToolSpeedMultiplier,
  getTotalFood,
  getTotalWater,
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
      const def = STATIONS.find((s) => s.id === placed.stationId);
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

  // Check if a resource still has at least one uncompleted downstream recipe
  function resourceHasUse(resourceId: string, gs: GameState): boolean {
    return RECIPES.some((r) => {
      // Does this recipe consume the resource?
      const usesResource =
        r.inputs.some((inp) => inp.resourceId === resourceId);
      if (!usesResource) return false;
      // Is this recipe already completed?
      if (r.buildingOutput && gs.buildings.includes(r.buildingOutput)) return false;
      if (r.oneTimeCraft && r.output && getResource(gs, r.output.resourceId) >= 1) return false;
      return true;
    });
  }

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
    if (r.oneTimeCraft && r.output && getResource(state, r.output.resourceId) >= 1) {
      return false;
    }
    // Hide one-time-craft recipes whose output has no remaining downstream use
    if (r.oneTimeCraft && r.output && !resourceHasUse(r.output.resourceId, state)) {
      return false;
    }
    // Hide recipes whose inputs include undiscovered resources
    for (const inp of r.inputs) {
      if (!state.discoveredResources.includes(inp.resourceId)) return false;
    }
    return true;
  });

  // Filter expeditions by visibility rules
  const availableExpeditions = EXPEDITIONS.filter((exp) => {
    // Must own the required vessel to see this expedition
    if (exp.requiredVessel && getResource(state, exp.requiredVessel) < 1) return false;
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

  // Filter stations by requirements
  const availableStations = STATIONS.filter((s) => {
    const skill = state.skills[s.skillId];
    if (s.requiredSkillLevel && skill.level < s.requiredSkillLevel) return false;
    if (s.requiredTool && getResource(state, s.requiredTool) < 1) return false;
    if (s.requiredBuildings) {
      for (const bid of s.requiredBuildings) {
        if (!state.buildings.includes(bid)) return false;
      }
    }
    return true;
  });

  // Current action progress (0..1)
  const moraleMultiplier = getMoraleDurationMultiplier(state.morale);
  let actionProgress = 0;
  let actionDuration = 0;
  if (state.currentAction) {
    if (state.currentAction.type === "gather") {
      const def = ACTIONS.find(
        (a) => a.id === state.currentAction!.actionId
      );
      if (def) {
        const skillLevel = state.skills[def.skillId].level;
        const toolMultiplier = getToolSpeedMultiplier(state, def.id);
        const effectiveDuration = Math.round(
          def.durationMs * getDurationMultiplier(def.skillId, skillLevel, def.id) * moraleMultiplier * toolMultiplier
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
        const craftToolMultiplier = getToolSpeedMultiplier(state, def.id);
        const effectiveDuration = Math.round(def.durationMs * moraleMultiplier * craftToolMultiplier);
        actionDuration = effectiveDuration;
        const elapsed = Date.now() - state.currentAction.startedAt;
        actionProgress = Math.min(1, elapsed / effectiveDuration);
      }
    } else if (state.currentAction.type === "expedition") {
      const def = EXPEDITIONS.find(
        (e) => e.id === state.currentAction!.expeditionId
      );
      if (def) {
        const effectiveDuration = Math.round(def.durationMs * moraleMultiplier);
        actionDuration = effectiveDuration;
        const elapsed = Date.now() - state.currentAction.startedAt;
        actionProgress = Math.min(1, elapsed / effectiveDuration);
      }
    }
  }

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
    resetGame,
    exportSave,
    importSave,
  };
}
