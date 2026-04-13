import { useCallback, useEffect, useRef, useState } from "react";
import { getDropChanceBonus, getStationInputAmount, getStationGuaranteedDrops } from "../data/milestones";
import {
  getActionById,
  getBuildings,
  getAffixById,
  getEquipmentItemById,
  getExpeditionById,
  getPhases,
  getRecipeById,
  getRepairRecipes,
  getResources,
  getSalvageTables,
  getStationById,
  getTools,
} from "../data/registry";
import { IMBUING_REAGENTS } from "../data/equipment";
import { levelFromXp } from "../data/skills";
import {
  trackExpeditionComplete,
  trackRepairItem,
  trackSalvageItem,
  trackCombatLogClear,
  trackOptionalitySnapshot,
  trackRoutineStarted,
  trackRoutineStopped,
} from "../lib/analytics-events";
import type {
  ActionDef,
  DiscoveryType,
  ExpeditionDef,
  GameState,
  ItemCondition,
  QueuedAction,
  RecipeDef,
  Routine,
  RoutineStep,
  StationDef,
} from "../data/types";
import { getMaxQueueSize, isQueueUnlocked } from "../data/queue";

import {
  addResource,
  canAffordInput,
  canDeploySharedStation,
  isAtStorageCap,
  isRecipeOutputBlocked,
  canAffordTagInputs,
  createInitialState,
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
  MAINLAND_VERSION,
} from "./gameState";
import {
  checkMilestones,
  startHeartbeat,
  stopHeartbeat,
  trackSessionEnd,
  trackSessionStart,
} from "../lib/analytics-events";
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

/** Try to start a routine step by directly mutating state. Returns true if successful. */
function tryStartRoutineStep(state: GameState, step: RoutineStep): boolean {
  if (step.actionType === "gather") {
    const action = getActionById(step.actionId);
    if (!action) return false;
    const skill = state.skills[action.skillId];
    if (action.requiredSkillLevel && skill.level < action.requiredSkillLevel) return false;
    if (action.requiredTools?.some((t) => !hasTool(state, t))) return false;
    if (action.requiredResources?.some((r) => getResource(state, r) < 1)) return false;
    if (action.requiredBuildings?.some((b) => !hasBuilding(state, b))) return false;
    if (action.requiredBiome && !state.discoveredBiomes.includes(action.requiredBiome)) return false;

    saveCurrentActionProgress(state);
    resetRepetitiveCountOnManualActionChange(state, `gather:${action.id}`);
    const fullAtStart = action.drops
      .filter((d) => isAtStorageCap(state, d.resourceId))
      .map((d) => d.resourceId);
    state.currentAction = {
      actionId: action.id,
      startedAt: Date.now(),
      type: "gather",
      ...(fullAtStart.length > 0 && { fullAtStart }),
    };
    restoreActionProgress(state, `gather:${action.id}`);
    return true;
  }

  if (step.actionType === "craft") {
    const recipe = getRecipeById(step.actionId);
    if (!recipe) return false;
    const skill = state.skills[recipe.skillId];
    if (recipe.requiredSkillLevel && skill.level < recipe.requiredSkillLevel) return false;
    if (recipe.requiredTools?.some((t) => !hasTool(state, t))) return false;
    if (recipe.requiredBuildings?.some((b) => !hasBuilding(state, b))) return false;
    const inputs = getEffectiveInputs(recipe, state);
    for (const inp of inputs) {
      if (!canAffordInput(inp, state)) return false;
    }
    if (recipe.tagInputs && !canAffordTagInputs(recipe.tagInputs, state)) return false;
    if (recipe.output && isAtStorageCap(state, recipe.output.resourceId)) return false;

    saveCurrentActionProgress(state);
    resetRepetitiveCountOnManualActionChange(state, `craft:${recipe.id}`);
    const fullAtStart = recipe.output && isAtStorageCap(state, recipe.output.resourceId)
      ? [recipe.output.resourceId] : [];
    state.currentAction = {
      actionId: recipe.id,
      startedAt: Date.now(),
      type: "craft",
      recipeId: recipe.id,
      ...(fullAtStart.length > 0 && { fullAtStart }),
    };
    restoreActionProgress(state, `craft:${recipe.id}`);
    return true;
  }

  if (step.actionType === "expedition") {
    const expedition = getExpeditionById(step.actionId);
    if (!expedition) return false;
    if (expedition.requiredVessel && !hasVessel(state, expedition.requiredVessel)) return false;
    if (expedition.foodCost && getTotalFood(state) < expedition.foodCost) return false;
    if (expedition.waterCost && getTotalWater(state) < expedition.waterCost) return false;
    if (expedition.inputs?.some((inp) => (state.resources[inp.resourceId] ?? 0) < inp.amount)) return false;

    saveCurrentActionProgress(state);
    resetRepetitiveCountOnManualActionChange(state, `expedition:${expedition.id}`);
    state.currentAction = {
      actionId: expedition.id,
      startedAt: Date.now(),
      type: "expedition",
      expeditionId: expedition.id,
    };
    restoreActionProgress(state, `expedition:${expedition.id}`);
    return true;
  }

  return false;
}

/** Advance the active routine to the next step. Deactivates if no step can start. */
function advanceRoutine(state: GameState): void {
  if (!state.activeRoutine) return;
  const routine = state.routines.find((r) => r.id === state.activeRoutine!.routineId);
  if (!routine || routine.steps.length === 0) {
    state.activeRoutine = null;
    return;
  }

  const progress = state.activeRoutine;
  const wasLastStep = progress.currentStep >= routine.steps.length - 1;

  // If on the last step, check if output is full → stop routine
  if (wasLastStep) {
    const step = routine.steps[progress.currentStep];
    let outputFull = false;
    if (step.actionType === "gather") {
      const action = getActionById(step.actionId);
      if (action) {
        const guaranteed = action.drops.filter((d) => !d.chance || d.chance >= 1);
        const relevant = guaranteed.length > 0 ? guaranteed : action.drops;
        outputFull = relevant.length > 0 && relevant.every((d) => isAtStorageCap(state, d.resourceId));
      }
    } else if (step.actionType === "craft") {
      const recipe = getRecipeById(step.actionId);
      if (recipe?.output) {
        outputFull = isAtStorageCap(state, recipe.output.resourceId);
      }
    }
    if (outputFull) {
      state.activeRoutine = null;
      trackRoutineStopped(state, "output_full");
      return;
    }
  }

  // Try each step starting from the next one
  const numSteps = routine.steps.length;
  for (let i = 0; i < numSteps; i++) {
    const nextIndex = (progress.currentStep + 1 + i) % numSteps;
    const step = routine.steps[nextIndex];
    if (tryStartRoutineStep(state, step)) {
      progress.currentStep = nextIndex;
      progress.completionsInStep = 0;
      return;
    }
  }

  // No step could start — deactivate routine
  state.activeRoutine = null;
  trackRoutineStopped(state, "cant_proceed");
}

/** Try to start the next queued action. Removes the entry on success or if it can't start. */
function advanceQueue(state: GameState): void {
  while (state.actionQueue.length > 0) {
    const queued = state.actionQueue[0];
    state.actionQueue.shift();

    if (queued.actionType === "routine") {
      const routine = state.routines.find((r) => r.id === queued.actionId);
      if (!routine || routine.steps.length === 0) continue;
      state.activeRoutine = { routineId: queued.actionId, currentStep: 0, completionsInStep: 0 };
      const step = routine.steps[0];
      if (!tryStartRoutineStep(state, step)) {
        advanceRoutine(state);
        if (!state.activeRoutine) continue;
      }
      return;
    }

    const step: RoutineStep = { actionId: queued.actionId, actionType: queued.actionType, count: 0 };
    if (tryStartRoutineStep(state, step)) {
      return;
    }
    // If the queued action can't start (e.g. missing resources), skip it and try the next
  }
}

let nextDiscoveryId = 0;
let nextCombatLogId = 0;

function addDiscovery(
  state: GameState,
  type: DiscoveryType,
  message: string,
  extra?: { biomeId?: string }
): void {
  state.discoveryLog.unshift({
    id: nextDiscoveryId++,
    type,
    message,
    timestamp: Date.now(),
    ...extra,
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
    // Use the expedition outcome flavor text if available, otherwise fall back to generic
    const flavorText = c.expeditionMessage ?? `You discovered the ${c.biomeDiscovery.replace(/_/g, " ")}!`;
    addDiscovery(state, "biome", flavorText, { biomeId: c.biomeDiscovery });
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
  // Show failure insights for mainland expedition combat
  if (c.encounterResult && c.encounterResult.failureInsights.length > 0) {
    const gradeLabel = c.encounterResult.grade === "partial" ? "Partial success" : "Expedition failed";
    const insights = c.encounterResult.failureInsights.slice(0, 3); // cap to avoid toast spam
    addDiscovery(state, "expedition", `${gradeLabel}: ${insights.join(". ")}`);
  }
  // Show equipment drops from mainland expeditions
  if (c.equipmentDropped) {
    for (const eq of c.equipmentDropped) {
      const eqDef = getEquipmentItemById(eq.defId);
      const condLabel = eq.condition === "broken" ? " (broken)" : "";
      if (eqDef?.unique) {
        addDiscovery(state, "equipment", `UNIQUE drop: ${eq.name}!`);
      } else {
        addDiscovery(state, "equipment", `Found ${eq.name}${condLabel}!`);
      }
    }
  }
  // Generate detailed combat log entry for mainland expeditions
  if (c.encounterResult) {
    state.combatLog.unshift({
      id: nextCombatLogId++,
      timestamp: Date.now(),
      expeditionId: c.actionId,
      expeditionName: c.actionName,
      grade: c.encounterResult.grade,
      enemyName: c.encounterResult.enemyName,
      roundsFought: c.encounterResult.roundsFought,
      playerHpStart: c.encounterResult.playerHpStart,
      playerHpEnd: c.encounterResult.playerHpEnd,
      enemyHpStart: c.encounterResult.enemyHpStart,
      enemyHpEnd: c.encounterResult.enemyHpEnd,
      totalDamageDealt: c.encounterResult.totalDamageDealt,
      totalDamageTaken: c.encounterResult.totalDamageTaken,
      critsLanded: c.encounterResult.critsLanded,
      dodges: c.encounterResult.dodges,
      estimatedWinRate: c.encounterResult.estimatedWinRate,
      dropMultiplier: c.encounterResult.dropMultiplier,
      xpMultiplier: c.encounterResult.xpMultiplier,
      failureInsights: c.encounterResult.failureInsights,
      drops: c.drops,
      xpGain: c.xpGain,
      equipmentDropped: c.equipmentDropped,
      outcomeMessage: c.expeditionMessage,
    });
    // Cap combat log to 50 entries to prevent unbounded growth
    if (state.combatLog.length > 50) {
      state.combatLog.length = 50;
    }

    // Track expedition telemetry
    const hpRatio = c.encounterResult.playerHpStart > 0 ? c.encounterResult.playerHpEnd / c.encounterResult.playerHpStart : 0;
    trackExpeditionComplete(
      state,
      c.actionId,
      c.encounterResult.grade,
      hpRatio,
      c.equipmentDropped?.length ?? 0,
    );

    // Persist lower-detail expedition summary in journal
    const gradeLabel = c.encounterResult.grade === "success" ? "Success" : c.encounterResult.grade === "partial" ? "Partial" : "Failed";
    const dropCount = c.drops.reduce((sum, d) => sum + d.amount, 0);
    const eqCount = c.equipmentDropped?.length ?? 0;
    const lootParts: string[] = [];
    if (dropCount > 0) lootParts.push(`${dropCount} resources`);
    if (eqCount > 0) lootParts.push(`${eqCount} equipment`);
    const lootSummary = lootParts.length > 0 ? ` — ${lootParts.join(", ")}` : "";
    const hpPct = c.encounterResult.playerHpStart > 0 ? Math.round(c.encounterResult.playerHpEnd / c.encounterResult.playerHpStart * 100) : 0;
    addDiscovery(state, "expedition", `${c.actionName}: ${gradeLabel} vs ${c.encounterResult.enemyName} (${hpPct}% HP remaining)${lootSummary}`);
  }
}

function bumpActionCompletionCount(state: GameState, actionType: string, actionId: string): number {
  const key = `${actionType}:${actionId}`;
  const nextCount = (state.actionCompletionCounts[key] ?? 0) + 1;
  state.actionCompletionCounts[key] = nextCount;
  return nextCount;
}

function addAmbientLoreNote(state: GameState, loreId: string, message: string): void {
  if (state.seenLoreNotes.includes(loreId)) return;
  state.seenLoreNotes.push(loreId);
  addDiscovery(state, "lore", message);
}

function processAmbientLore(state: GameState, c: CompletionEvent): void {
  const completionCount = bumpActionCompletionCount(state, c.actionType, c.actionId);

  if (c.actionType === "gather" && c.actionId === "drop_line_fish" && completionCount === 4) {
    addAmbientLoreNote(
      state,
      "lore_drop_line_4",
      "The line goes taut on something heavy, then slack. The bait comes back untouched."
    );
  }

  if (c.actionType === "gather" && c.actionId === "comb_rock_pools" && completionCount === 5) {
    addAmbientLoreNote(
      state,
      "lore_rock_pools_5",
      "For a few breaths, the surf and gulls go silent. Then the island sounds return."
    );
  }

  if (c.actionType === "gather" && c.actionId === "collect_driftwood" && completionCount === 7) {
    addAmbientLoreNote(
      state,
      "lore_driftwood_7",
      "A smooth shell hums faintly when held to your ear, then goes still."
    );
  }

  if (c.actionType === "expedition" && c.actionId === "explore_beach" && !c.biomeDiscovery) {
    const noDiscoveryCount = bumpActionCompletionCount(state, "expedition_no_discovery", c.actionId);
    if (noDiscoveryCount === 2) {
      addAmbientLoreNote(
        state,
        "lore_explore_beach_no_biome_2",
        "On the return crossing, a pale light hangs on the horizon where no land should be."
      );
    }
  }

  if (c.actionType === "expedition" && c.actionId === "sail_nearby_island" && completionCount === 3) {
    addAmbientLoreNote(
      state,
      "lore_nearby_island_3",
      "At dusk, a long wail carries over calm water. It fades before you can place it."
    );
  }

  // ── Tutorial tips (one-time, dismissable) ──

  // After first craft: teach tapping items
  if (c.actionType === "craft" && completionCount === 1 &&
      !state.seenLoreNotes.includes("tip_tap_items")) {
    addAmbientLoreNote(
      state,
      "tip_tap_items",
      "Tip: Tap any item name to see how to get it and what it\u2019s used for"
    );
  }

  // After a few total completions: mention the Guide button
  const totalCompletions = Object.values(state.actionCompletionCounts).reduce((a, b) => a + b, 0);
  if (totalCompletions >= 15 && !state.seenLoreNotes.includes("tip_guide_button")) {
    addAmbientLoreNote(
      state,
      "tip_guide_button",
      "Tip: The Guide button at the top lists every item you\u2019ve seen"
    );
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

  // Track last user interaction for "engaged time" (clicks/touches within 60s = active)
  const lastInteractionRef = useRef(Date.now());
  useEffect(() => {
    const ENGAGEMENT_TIMEOUT_MS = 60_000;
    const markActive = () => { lastInteractionRef.current = Date.now(); };
    window.addEventListener("pointerdown", markActive);
    window.addEventListener("keydown", markActive);

    // Accumulate activePlayTimeMs every second based on recent interaction
    const activeTimer = setInterval(() => {
      const sinceLast = Date.now() - lastInteractionRef.current;
      if (sinceLast < ENGAGEMENT_TIMEOUT_MS) {
        setState((prev) => ({
          ...prev,
          activePlayTimeMs: prev.activePlayTimeMs + 1000,
        }));
      }
    }, 1000);

    return () => {
      window.removeEventListener("pointerdown", markActive);
      window.removeEventListener("keydown", markActive);
      clearInterval(activeTimer);
    };
  }, []);

  // Game tick loop
  useEffect(() => {
    // Process offline progress on mount
    const offlineMs = Date.now() - stateRef.current.lastTickAt;
    if (offlineMs > 2000) {
      setState((prev) => {
        const next = structuredClone(prev);
        const now = Date.now();

        // Loop offline processing: when an action completes and a routine/queue
        // advances to a new action, apply remaining offline time to the new action.
        // Cap iterations to prevent infinite loops from edge cases.
        let totalCompletions = 0;
        for (let pass = 0; pass < 100; pass++) {
          const result = processTick(next, now);
          for (const c of result.completions) {
            try {
              processCompletionDiscoveries(next, c);
              processAmbientLore(next, c);
            } catch {
              // Don't let discovery/lore processing errors break offline progress
            }
          }
          totalCompletions += result.completions.length;

          // Routine advancement for offline progress
          if (next.activeRoutine) {
            if (result.completions.length > 0) {
              next.activeRoutine.completionsInStep += result.completions.length;
            }
            const routine = next.routines.find((r) => r.id === next.activeRoutine!.routineId);
            if (routine) {
              const step = routine.steps[next.activeRoutine.currentStep];
              if (step?.count > 0 && next.activeRoutine.completionsInStep >= step.count) {
                saveCurrentActionProgress(next);
                next.currentAction = null;
              }
            }
            if (!next.currentAction) {
              advanceRoutine(next);
            }
          }
          // Queue advancement for offline progress (only if no routine is active)
          if (!next.activeRoutine && !next.currentAction && next.actionQueue.length > 0) {
            advanceQueue(next);
          }

          // Credit remaining offline time to the newly started action
          if (next.currentAction && result.unusedMs > 0) {
            next.currentAction.startedAt -= result.unusedMs;
          }

          // If no action running, no completions happened, or no unused time, stop
          if (!next.currentAction || result.completions.length === 0 || result.unusedMs === 0) break;
        }

        if (totalCompletions > 0) checkMilestones(next);
        return next;
      });
    }

    const interval = setInterval(() => {
      setState((prev) => {
        const next = structuredClone(prev);
        const result = processTick(next, Date.now());
        for (const c of result.completions) {
          processCompletionDiscoveries(next, c);
          processAmbientLore(next, c);
        }

        // Routine advancement
        if (next.activeRoutine) {
          // Track completions for step counting
          if (result.completions.length > 0) {
            next.activeRoutine.completionsInStep += result.completions.length;
          }
          // Check if step should end due to completion count
          const routine = next.routines.find((r) => r.id === next.activeRoutine!.routineId);
          if (routine) {
            const step = routine.steps[next.activeRoutine.currentStep];
            if (step?.count > 0 && next.activeRoutine.completionsInStep >= step.count) {
              saveCurrentActionProgress(next);
              next.currentAction = null;
            }
          }
          // If no current action, advance to next step
          if (!next.currentAction) {
            advanceRoutine(next);
          }
        }
        // Queue advancement (only if no routine is active)
        if (!next.activeRoutine && !next.currentAction && next.actionQueue.length > 0) {
          advanceQueue(next);
        }

        if (result.completions.length > 0) checkMilestones(next);
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

  // Analytics: session tracking + heartbeat + mainland optionality
  useEffect(() => {
    trackSessionStart(stateRef.current);
    trackOptionalitySnapshot(stateRef.current);
    startHeartbeat(() => stateRef.current);
    const handleUnload = () => trackSessionEnd(stateRef.current);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      stopHeartbeat();
      window.removeEventListener("beforeunload", handleUnload);
    };
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
      next.activeRoutine = null; // manual action cancels any running routine
      next.actionQueue = []; // manual action clears the queue
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
        // Block if output resource storage is full (but allow if inputs free space in the same group)
        if (recipe.output && isRecipeOutputBlocked(prev, recipe.output.resourceId, inputs)) return prev;
        const next = structuredClone(prev);
        next.activeRoutine = null; // manual craft cancels any running routine
        next.actionQueue = []; // manual craft clears the queue
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
        next.activeRoutine = null; // manual expedition cancels any running routine
        next.actionQueue = []; // manual expedition clears the queue
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
      next.currentAction = null;
      next.activeRoutine = null; // also stop any running routine
      // If queue has items, let the next tick advance it (don't reset repetition count)
      // If queue is empty, this is a full stop — reset repetition
      if (next.actionQueue.length === 0) {
        resetRepetitiveCountOnManualActionChange(next, null);
      }
      return next;
    });
  }, []);

  const queueAction = useCallback((queued: QueuedAction) => {
    setState((prev) => {
      if (!isQueueUnlocked(prev)) return prev;
      const maxSize = getMaxQueueSize(prev);
      if (prev.actionQueue.length >= maxSize) return prev;
      const next = structuredClone(prev);
      next.actionQueue.push(queued);
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setState((prev) => {
      if (prev.actionQueue.length === 0) return prev;
      return { ...prev, actionQueue: [] };
    });
  }, []);

  const toggleQueueMode = useCallback(() => {
    setState((prev) => ({ ...prev, queueMode: !prev.queueMode }));
  }, []);

  const saveRoutine = useCallback((routine: Routine) => {
    setState((prev) => {
      const next = structuredClone(prev);
      const idx = next.routines.findIndex((r) => r.id === routine.id);
      if (idx >= 0) {
        next.routines[idx] = routine;
      } else {
        next.routines.push(routine);
      }
      return next;
    });
  }, []);

  const deleteRoutine = useCallback((routineId: string) => {
    setState((prev) => {
      const next = structuredClone(prev);
      next.routines = next.routines.filter((r) => r.id !== routineId);
      if (next.activeRoutine?.routineId === routineId) {
        next.activeRoutine = null;
      }
      return next;
    });
  }, []);

  const startRoutine = useCallback((routineId: string) => {
    setState((prev) => {
      const routine = prev.routines.find((r) => r.id === routineId);
      if (!routine || routine.steps.length === 0) return prev;
      const next = structuredClone(prev);
      // Start from step 0
      next.activeRoutine = { routineId, currentStep: 0, completionsInStep: 0 };
      // Try to start the first step; if it fails, try others
      const step = routine.steps[0];
      if (!tryStartRoutineStep(next, step)) {
        // Try advancing from step 0
        advanceRoutine(next);
        // If still no active routine after trying all steps, bail
        if (!next.activeRoutine) return prev;
      }
      trackRoutineStarted(next, routine);
      return next;
    });
  }, []);

  const stopRoutine = useCallback(() => {
    setState((prev) => {
      if (!prev.activeRoutine) return prev;
      const next = structuredClone(prev);
      next.activeRoutine = null;
      saveCurrentActionProgress(next);
      next.currentAction = null;
      trackRoutineStopped(next, "manual");
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
      if (station.requiredBiomes) {
        for (const biomeId of station.requiredBiomes) {
          if (!prev.discoveredBiomes.includes(biomeId)) return prev;
        }
      }
      // Skip deploy if the chart biome is already discovered
      if (station.chartBiome && prev.discoveredBiomes.includes(station.chartBiome)) return prev;
      // Check max deployed — use bipartite matching for shared building slots
      if (station.maxDeployedPerBuildings) {
        if (!canDeploySharedStation(station, prev.stations, prev)) return prev;
      } else {
        const maxDeployed = station.maxDeployed ?? 1;
        const currentCount = prev.stations.filter((s) => s.stationId === station.id).length;
        if (currentCount >= maxDeployed) return prev;
      }
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
      // Chart progress — advance toward biome discovery
      if (def.chartBiome && def.chartIncrement && !next.discoveredBiomes.includes(def.chartBiome)) {
        const prev = next.chartProgress[def.chartBiome] ?? 0;
        const progress = Math.min(prev + def.chartIncrement, 1);
        next.chartProgress[def.chartBiome] = progress;
        if (progress >= 1) {
          next.discoveredBiomes.push(def.chartBiome);
          const biomeName = def.chartBiome.replace(/_/g, " ");
          addDiscovery(next, "biome", `Your charts are complete — you've mapped the ${biomeName}!`, { biomeId: def.chartBiome });
        }
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

  const collectAllStations = useCallback(() => {
    setState((prev) => {
      const now = Date.now();
      // Find indices of ready stations (reverse order to handle splicing)
      const readyIndices: number[] = [];
      for (let i = prev.stations.length - 1; i >= 0; i--) {
        const placed = prev.stations[i];
        const def = getStationById(placed.stationId);
        if (def && now >= placed.deployedAt + def.durationMs) {
          readyIndices.push(i);
        }
      }
      if (readyIndices.length === 0) return prev;

      const next = structuredClone(prev);
      const RESOURCES = getResources();

      for (const index of readyIndices) {
        const placed = next.stations[index];
        const def = getStationById(placed.stationId)!;
        const skillLevel = next.skills[def.skillId].level;
        const newResources: string[] = [];
        const droppedAmounts = new Map<string, number>();

        for (const drop of def.yields) {
          let chance = drop.chance ?? 1;
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

        const skill = next.skills[def.skillId];
        skill.xp += def.xpGain;
        skill.level = levelFromXp(skill.xp);

        for (const resId of newResources) {
          const rdef = RESOURCES[resId];
          const name = rdef?.name ?? resId.replace(/_/g, " ");
          addDiscovery(next, "resource", `Found ${name} for the first time`);
        }

        // Chart progress — advance toward biome discovery
        if (def.chartBiome && def.chartIncrement && !next.discoveredBiomes.includes(def.chartBiome)) {
          const prevProgress = next.chartProgress[def.chartBiome] ?? 0;
          const progress = Math.min(prevProgress + def.chartIncrement, 1);
          next.chartProgress[def.chartBiome] = progress;
          if (progress >= 1) {
            next.discoveredBiomes.push(def.chartBiome);
            const biomeName = def.chartBiome.replace(/_/g, " ");
            addDiscovery(next, "biome", `Your charts are complete — you've mapped the ${biomeName}!`, { biomeId: def.chartBiome });
          }
        }

        next.stations.splice(index, 1);
        if (!def.setupInputs || def.setupInputs.length === 0) {
          next.stations.push({ stationId: def.id, deployedAt: Date.now() });
        }
      }

      return next;
    });
  }, []);

  const toggleResourceStash = useCallback((resourceId: string) => {
    setState((prev) => {
      const next = structuredClone(prev);
      const idx = next.stashedResources.indexOf(resourceId);
      if (idx >= 0) {
        next.stashedResources.splice(idx, 1);
      } else {
        next.stashedResources.push(resourceId);
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

  const unlockMainland = useCallback(() => {
    setState((prev) => {
      if (prev.mainlandUnlocked) return prev;
      return { ...prev, mainlandUnlocked: true, mainlandVersion: MAINLAND_VERSION };
    });
  }, []);

  const markPhaseSeen = useCallback((phaseId: string) => {
    setState((prev) => {
      if (prev.seenPhases.includes(phaseId)) return prev;
      const next = structuredClone(prev);
      // Also mark all lower-order phases as seen (in case player skipped them)
      const phases = getPhases();
      const target = phases.find((p) => p.id === phaseId);
      if (target) {
        for (const p of phases) {
          if (p.order <= target.order && !next.seenPhases.includes(p.id)) {
            next.seenPhases.push(p.id);
          }
        }
      } else {
        next.seenPhases.push(phaseId);
      }
      checkMilestones(next);
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

  const clearCombatLog = useCallback(() => {
    setState((prev) => {
      if (prev.combatLog.length === 0) return prev;
      trackCombatLogClear(prev.combatLog.length);
      return { ...prev, combatLog: [] };
    });
  }, []);

  const deleteCombatLogEntry = useCallback((id: number) => {
    setState((prev) => {
      const idx = prev.combatLog.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const next = structuredClone(prev);
      next.combatLog.splice(idx, 1);
      return next;
    });
  }, []);

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

  const CONDITION_ORDER: ItemCondition[] = ["broken", "damaged", "worn", "pristine"];

  const repairItem = useCallback((instanceId: string) => {
    setState((prev) => {
      const itemIdx = prev.equipmentInventory.findIndex((i) => i.instanceId === instanceId);
      if (itemIdx === -1) return prev;
      const item = prev.equipmentInventory[itemIdx];
      if (item.condition === "pristine") return prev;

      const def = getEquipmentItemById(item.defId);
      if (!def) return prev;

      // Find matching repair recipe by tag
      const repairRecipes = getRepairRecipes();
      const recipe = repairRecipes.find((r) =>
        r.targetTags.some((tag) => def.tags?.includes(tag))
      );
      if (!recipe) return prev;

      // Check smithing level
      const smithingSkill = prev.skills["smithing"];
      if (!smithingSkill || smithingSkill.level < recipe.requiredSkillLevel) return prev;

      // Check required buildings
      if (recipe.requiredBuildings?.some((b) => !hasBuilding(prev, b))) return prev;

      // Check materials
      for (const inp of recipe.inputs) {
        if ((prev.resources[inp.resourceId] ?? 0) < inp.amount) return prev;
      }

      const next = structuredClone(prev);

      // Consume materials
      for (const inp of recipe.inputs) {
        next.resources[inp.resourceId] = (next.resources[inp.resourceId] ?? 0) - inp.amount;
      }

      // Improve condition by one step
      const currentIdx = CONDITION_ORDER.indexOf(item.condition);
      const nextCondition = CONDITION_ORDER[currentIdx + 1];
      next.equipmentInventory[itemIdx] = { ...next.equipmentInventory[itemIdx], condition: nextCondition };

      // Grant smithing XP
      const skill = next.skills["smithing"];
      skill.xp += recipe.xpGain;
      skill.level = levelFromXp(skill.xp);

      // Track repair telemetry
      trackRepairItem(next, item.defId, item.condition, recipe.targetTags[0] ?? "unknown");
      // Count repairs for optionality metrics
      next.actionCompletionCounts["repair:total"] = (next.actionCompletionCounts["repair:total"] ?? 0) + 1;

      return next;
    });
  }, []);

  /** Condition multiplier for salvage yield: pristine=1, worn=0.75, damaged=0.5, broken=0.4 */
  const CONDITION_SALVAGE_MULT: Record<string, number> = {
    pristine: 1,
    worn: 0.75,
    damaged: 0.5,
    broken: 0.4,
  };

  const salvageItem = useCallback((instanceId: string) => {
    setState((prev) => {
      const itemIdx = prev.equipmentInventory.findIndex((i) => i.instanceId === instanceId);
      if (itemIdx === -1) return prev;
      const item = prev.equipmentInventory[itemIdx];

      // Cannot salvage equipped items
      if (Object.values(prev.loadout).includes(instanceId)) return prev;

      const def = getEquipmentItemById(item.defId);
      if (!def) return prev;

      // Find matching salvage table by tag
      const salvageTables = getSalvageTables();
      const table = salvageTables.find((t) =>
        t.targetTags.some((tag) => def.tags?.includes(tag))
      );
      if (!table) return prev;

      // Check smithing level
      const smithingSkill = prev.skills["smithing"];
      if (!smithingSkill || smithingSkill.level < table.requiredSkillLevel) return prev;

      const next = structuredClone(prev);

      // Calculate condition multiplier
      const condMult = CONDITION_SALVAGE_MULT[item.condition] ?? 0.5;

      // Grant base material outputs
      for (const output of table.outputs) {
        const chance = output.chance ?? 1;
        if (Math.random() > chance) continue;
        const amount = Math.max(1, Math.round(output.amount * condMult));
        next.resources[output.resourceId] = (next.resources[output.resourceId] ?? 0) + amount;
      }

      // Roll affix reagent outputs (one roll per affix on the item)
      if (table.affixReagentOutputs && item.affixes.length > 0) {
        for (const affix of item.affixes) {
          const affixDef = getAffixById(affix.affixId);
          if (!affixDef) continue;
          const reagentEntry = table.affixReagentOutputs.find((r) => r.affixFamily === affixDef.family);
          if (!reagentEntry) continue;
          if (Math.random() <= reagentEntry.chance) {
            next.resources[reagentEntry.resourceId] = (next.resources[reagentEntry.resourceId] ?? 0) + 1;
          }
        }
      }

      // Remove item from inventory
      next.equipmentInventory.splice(itemIdx, 1);

      // Grant smithing XP
      const skill = next.skills["smithing"];
      skill.xp += table.xpGain;
      skill.level = levelFromXp(skill.xp);

      // Track salvage telemetry
      trackSalvageItem(next, item.defId, item.condition, table.targetTags[0] ?? "unknown");
      // Count salvages for optionality metrics
      next.actionCompletionCounts["salvage:total"] = (next.actionCompletionCounts["salvage:total"] ?? 0) + 1;

      return next;
    });
  }, []);

  /** Equip or unequip an equipment item. Toggles: if already equipped, unequips; otherwise equips to its slot. */
  const equipItem = useCallback((instanceId: string) => {
    setState((prev) => {
      const item = prev.equipmentInventory.find((i) => i.instanceId === instanceId);
      if (!item) return prev;

      // Cannot equip broken items
      if (item.condition === "broken") return prev;

      const def = getEquipmentItemById(item.defId);
      if (!def) return prev;

      const next = structuredClone(prev);

      // If already equipped in its slot, unequip
      if (next.loadout[def.slot] === instanceId) {
        next.loadout[def.slot] = null;
        return next;
      }

      // Equip to the item's slot (replacing whatever was there)
      next.loadout[def.slot] = instanceId;
      return next;
    });
  }, []);

  /** Imbue an equipment item with a reagent — one stat bonus, permanent, one per item. */
  const imbueItem = useCallback((instanceId: string, reagentId: string) => {
    const reagentDef = IMBUING_REAGENTS.find((r) => r.reagentId === reagentId);
    if (!reagentDef) return;

    setState((prev) => {
      const itemIdx = prev.equipmentInventory.findIndex((i) => i.instanceId === instanceId);
      if (itemIdx === -1) return prev;
      const item = prev.equipmentInventory[itemIdx];

      // Cannot imbue if already imbued
      if (item.imbued) return prev;
      // Must have the reagent
      if ((prev.resources[reagentId] ?? 0) < 1) return prev;

      const next = structuredClone(prev);
      next.resources[reagentId] = (next.resources[reagentId] ?? 0) - 1;
      next.equipmentInventory[itemIdx] = {
        ...next.equipmentInventory[itemIdx],
        imbued: { reagentId: reagentDef.reagentId, stat: reagentDef.stat, value: reagentDef.value },
      };

      // Log the imbuement as a discovery
      const def = getEquipmentItemById(item.defId);
      const itemName = def?.name ?? item.defId;
      const RESOURCES = getResources();
      const reagentName = RESOURCES[reagentId]?.name ?? reagentId;
      next.discoveryLog.push({
        id: (next.discoveryLog.length > 0 ? next.discoveryLog[next.discoveryLog.length - 1].id : 0) + 1,
        type: "equipment",
        message: `Imbued ${itemName} with ${reagentName} — ${reagentDef.label} (${reagentDef.stat} +${reagentDef.value})`,
        timestamp: Date.now(),
      });

      return next;
    });
  }, []);

  /** Discard an equipment item permanently. Unequips first if equipped. */
  const discardItem = useCallback((instanceId: string) => {
    setState((prev) => {
      const itemIdx = prev.equipmentInventory.findIndex((i) => i.instanceId === instanceId);
      if (itemIdx === -1) return prev;

      const next = structuredClone(prev);

      // Unequip if currently equipped
      for (const slot of Object.keys(next.loadout)) {
        if (next.loadout[slot] === instanceId) {
          next.loadout[slot] = null;
        }
      }

      // Remove from inventory
      next.equipmentInventory.splice(itemIdx, 1);
      return next;
    });
  }, []);

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
    queueAction,
    clearQueue,
    toggleQueueMode,
    saveRoutine,
    deleteRoutine,
    startRoutine,
    stopRoutine,
    deployStation,
    collectStation,
    collectAllStations,
    markDiscoverySeen,
    markPhaseSeen,
    unlockMainland,
    toggleResourceStash,
    resetGame,
    exportSave,
    importSave,
    importSaveFromJson,
    clearCombatLog,
    deleteCombatLogEntry,
    repairItem,
    salvageItem,
    equipItem,
    discardItem,
    imbueItem,
  };
}
