import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { ActionPanel } from "./components/ActionPanel";
import { BiomeDiscoveryModal } from "./components/BiomeDiscoveryModal";
import { ChapterCard } from "./components/ChapterCard";
import { CloseIcon } from "./components/CloseIcon";
import { CollectFlyup, type FlyupItem } from "./components/CollectFlyup";
import { CraftingPanel } from "./components/CraftingPanel";
import { DevGraph } from "./components/DevGraph";

import { FeedbackBanner } from "./components/FeedbackBanner";
import { FeedbackQuestion } from "./components/FeedbackQuestion";
import { DevGraphDot } from "./components/DevGraphDot";
import { DevWiki } from "./components/DevWiki";
import { ExpeditionPanel } from "./components/ExpeditionPanel";
import { InventoryPanel } from "./components/InventoryPanel";
import { IslandBanner } from "./components/IslandBanner";
import { LogPanel } from "./components/LogPanel";
import { ModPanel } from "./components/ModPanel";
import { NotificationToast } from "./components/NotificationToast";
import { ResourcePanel } from "./components/ResourcePanel";
import { RoutinesPanel } from "./components/RoutinesPanel";
import { SearchPanel } from "./components/SearchPanel";
import { SettlementPanel } from "./components/SettlementPanel";
import { SkillsPanel } from "./components/SkillsPanel";
import { StationsPanel } from "./components/StationsPanel";
import { VictoryScreen } from "./components/VictoryScreen";
import { WhatsNew, ChangelogModal } from "./components/WhatsNew";
import { GameIcon } from "./components/GameIcon";
import { ItemLookupWithBrowse, useOpenBrowse } from "./components/ItemLookup";
import { getActiveModId } from "./data/modding";
import { isQueueUnlocked, getMaxQueueSize } from "./data/queue";
import { isRoutinesUnlocked } from "./data/routines";
import { CombatLogModal } from "./components/CombatLogModal";
import { trackCombatLogOpen } from "./lib/analytics-events";
import { CombatLogEntry, DiscoveryEntry, QueuedAction, Routine, RoutineStep } from "./data/types";
import { getCurrentPhase, PhaseInfo } from "./engine/phases";
import {
  GameScreen,
  GameTab,
  selectActionsByScreen,
  selectBuildActions,
  selectBuildRecipes,
  selectCraftRecipes,
  selectCurrentActionName,
  selectCurrentSkillInfo,
  selectExpeditionsByScreen,
  selectHasAnyResource,
  selectHasAnyXp,
  selectHasFoodAccess,
  selectGatherActions,
  selectActionStatusInfo,
  selectReadyStationCount,
  selectRecipesByScreen,
  selectUndiscoveredBiomeCount,
  selectVisibleTabs,
} from "./engine/selectors";
import { getActionById, getExpeditionById, getRecipeById } from "./data/registry";
import { useGame } from "./engine/useGame";
import { useUpdateChecker } from "./engine/useUpdateChecker";
import { getFullXpThreshold, getRepetitiveXpMultiplier } from "./engine/repetitiveXp";
import "./App.css";

function getQueuedActionName(q: QueuedAction, routines: Routine[]): string {
  if (q.actionType === "gather") {
    return getActionById(q.actionId)?.name ?? q.actionId;
  }
  if (q.actionType === "expedition") {
    return getExpeditionById(q.actionId)?.name ?? q.actionId;
  }
  if (q.actionType === "routine") {
    return routines.find((r) => r.id === q.actionId)?.name ?? q.actionId;
  }
  return getRecipeById(q.actionId)?.name ?? q.actionId;
}

function getQueuedActionIcon(q: QueuedAction, routines: Routine[]): string {
  if (q.actionType === "gather") {
    const action = getActionById(q.actionId);
    if (action && action.drops.length > 0) return action.drops[0].resourceId;
  } else if (q.actionType === "craft") {
    const recipe = getRecipeById(q.actionId);
    if (recipe) {
      if (recipe.output) return recipe.output.resourceId;
      if (recipe.toolOutput) return recipe.toolOutput;
      if (recipe.buildingOutput) return recipe.buildingOutput;
    }
  } else if (q.actionType === "expedition") {
    return q.actionId;
  } else if (q.actionType === "routine") {
    const routine = routines.find((r) => r.id === q.actionId);
    if (routine && routine.steps.length > 0) {
      return getQueuedActionIcon({ actionId: routine.steps[0].actionId, actionType: routine.steps[0].actionType }, routines);
    }
    return "tab_routines";
  }
  return q.actionId;
}

function getStepIcon(step: RoutineStep): string {
  if (step.actionType === "gather") {
    const action = getActionById(step.actionId);
    if (action && action.drops.length > 0) return action.drops[0].resourceId;
    return "biome_beach";
  }
  const recipe = getRecipeById(step.actionId);
  if (recipe) {
    if (recipe.output) return recipe.output.resourceId;
    if (recipe.toolOutput) return recipe.toolOutput;
    if (recipe.buildingOutput) return recipe.buildingOutput;
    return recipe.id;
  }
  return "tab_craft";
}

function GuideHeaderButton() {
  const openBrowse = useOpenBrowse();
  return (
    <button className="btn-ghost" onClick={openBrowse}>
      Guide
    </button>
  );
}

export default function App() {
  // Dev tools: ?dev for wiki, ?dev=graph for progression graph
  if (window.location.search.includes("dev")) {
    const params = new URLSearchParams(window.location.search);
    const devPage = params.get("dev");
    if (devPage === "graph") return <DevGraph />;
    if (devPage === "dot") return <DevGraphDot />;
    return <DevWiki />;
  }
  const game = useGame();
  const updateAvailable = useUpdateChecker();
  const [tab, setTab] = useState<GameTab>("gather");
  const [screen, setScreen] = useState<GameScreen>("island");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modPanelOpen, setModPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLog, setShowLog] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideFlavorText, setHideFlavorText] = useState(
    () => localStorage.getItem("seabound_hideFlavorText") === "true"
  );
  const [pendingChapter, setPendingChapter] = useState<PhaseInfo | null>(null);
  const [biomeDiscoveryQueue, setBiomeDiscoveryQueue] = useState<DiscoveryEntry[]>([]);
  const [victoryDismissed, setVictoryDismissed] = useState(
    () => localStorage.getItem("seabound_victoryDismissed") === "true"
  );
  const activeModId = getActiveModId();
  const [migrateBannerDismissed, setMigrateBannerDismissed] = useState(false);
  const [flyups, setFlyups] = useState<FlyupItem[]>([]);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [pendingCombatLog, setPendingCombatLog] = useState<CombatLogEntry | null>(null);
  const lastSeenCombatLogIdRef = useRef(game.state.combatLog.length > 0 ? game.state.combatLog[0].id : -1);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [tabTransition, setTabTransition] = useState(false);
  const [highlightedResources, setHighlightedResources] = useState<Set<string>>(new Set());
  const isOldDomain = window.location.hostname === "seabound.pages.dev";
  const queueMode = game.state.queueMode;

  // Close "more" menu on outside click
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreMenuOpen]);

  // Handle incoming migration from old domain
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#migrate=")) return;
    try {
      const encoded = hash.slice("#migrate=".length);
      const json = decodeURIComponent(atob(encoded));
      const loaded = game.importSaveFromJson(json);
      if (loaded) {
        window.history.replaceState(null, "", window.location.pathname);
        alert("Save migrated successfully! Welcome to seabound.dev");
      }
    } catch {
      // invalid migration data — ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlyup = useCallback((items: FlyupItem[]) => {
    setFlyups((prev) => [...prev, ...items]);
  }, []);

  const handleFlyupDone = useCallback((id: number) => {
    setFlyups((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleTabSwitch = useCallback((newTab: GameTab) => {
    setTabTransition(true);
    setTab(newTab);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTabTransition(false));
    });
  }, []);

  const handleScreenSwitch = useCallback((newScreen: GameScreen) => {
    setScreen(newScreen);
    setTab("gather"); // Reset to gather when switching screens
    setTabTransition(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTabTransition(false));
    });
  }, []);

  const handleMigrate = useCallback(() => {
    const data = JSON.stringify(game.state);
    const encoded = btoa(encodeURIComponent(data));
    window.open(`https://seabound.dev/#migrate=${encoded}`, "_blank");
  }, [game.state]);

  const handleModSwitch = useCallback(() => {
    // After mod switch, reload the game state for the new mod
    window.location.reload();
  }, []);

  // Show combat log modal when a new mainland expedition completes
  useEffect(() => {
    if (game.state.combatLog.length === 0) return;
    const newest = game.state.combatLog[0];
    if (newest.id > lastSeenCombatLogIdRef.current) {
      lastSeenCombatLogIdRef.current = newest.id;
      setPendingCombatLog(newest);
      trackCombatLogOpen();
    }
  }, [game.state.combatLog]);

  // Phase detection
  const currentPhase = useMemo(() => getCurrentPhase(game.state), [game.state]);

  // Show chapter card when entering a new phase
  useEffect(() => {
    if (!game.state.seenPhases.includes(currentPhase.id)) {
      setPendingChapter(currentPhase);
    }
  }, [currentPhase, game.state.seenPhases]);

  const dismissChapter = () => {
    if (pendingChapter) {
      game.markPhaseSeen(pendingChapter.id);
      setPendingChapter(null);
    }
  };

  // Biome discovery modal queue
  const handleBiomeDiscovery = useCallback((entry: DiscoveryEntry) => {
    setBiomeDiscoveryQueue((prev) => [...prev, entry]);
  }, []);

  const dismissBiomeDiscovery = useCallback(() => {
    setBiomeDiscoveryQueue((prev) => prev.slice(1));
  }, []);

  const pendingBiome = biomeDiscoveryQueue[0] ?? null;

  // Filter content by active screen, then split by panel
  const screenActions = useMemo(
    () => selectActionsByScreen(game.availableActions, screen),
    [game.availableActions, screen]
  );
  const screenRecipes = useMemo(
    () => selectRecipesByScreen(game.availableRecipes, screen),
    [game.availableRecipes, screen]
  );
  const screenExpeditions = useMemo(
    () => selectExpeditionsByScreen(game.availableExpeditions, screen),
    [game.availableExpeditions, screen]
  );

  // Split by panel metadata
  const craftRecipes = useMemo(
    () => selectCraftRecipes(screenRecipes),
    [screenRecipes]
  );
  const buildRecipes = useMemo(
    () => selectBuildRecipes(screenRecipes),
    [screenRecipes]
  );
  const gatherActions = useMemo(
    () => selectGatherActions(screenActions),
    [screenActions]
  );
  const buildActions = useMemo(
    () => selectBuildActions(screenActions),
    [screenActions]
  );

  // Progressive tab visibility
  const hasAnyXp = useMemo(() => selectHasAnyXp(game.state), [game.state]);
  const hasFoodAccess = useMemo(() => selectHasFoodAccess(game.state), [game.state]);
  const hasAnyResource = useMemo(() => selectHasAnyResource(game.state), [game.state]);

  // On mobile, inventory is a tab; on desktop it's always visible as sidebar
  const queueUnlocked = useMemo(
    () => isQueueUnlocked(game.state),
    [game.state]
  );
  const maxQueueSize = useMemo(
    () => getMaxQueueSize(game.state),
    [game.state]
  );
  const routinesUnlocked = useMemo(
    () => isRoutinesUnlocked(game.state),
    [game.state]
  );

  const visibleTabs = useMemo(() => {
    return selectVisibleTabs({
      hasFoodAccess,
      hasAnyResource,
      hasAnyXp,
      craftRecipeCount: craftRecipes.length,
      buildRecipeCount: buildRecipes.length,
      buildActionCount: buildActions.length,
      buildingCount: game.state.buildings.length,
      availableStationCount: screen === "mainland" ? 0 : game.availableStations.length,
      deployedStationCount: screen === "mainland" ? 0 : game.state.stations.length,
      routinesUnlocked: screen === "mainland" ? false : routinesUnlocked,
      screen,
    });
  }, [
    hasFoodAccess,
    hasAnyResource,
    hasAnyXp,
    craftRecipes.length,
    buildRecipes.length,
    buildActions.length,
    game.state.buildings.length,
    game.availableStations.length,
    game.state.stations.length,
    routinesUnlocked,
    screen,
  ]);

  // Fall back to gather if current tab isn't visible
  const activeTab = visibleTabs.includes(tab) ? tab : "gather";

  const currentActionName = useMemo(
    () => selectCurrentActionName(game.state),
    [game.state]
  );
  const readyStationCount = useMemo(
    () => selectReadyStationCount(game.state),
    [game.state]
  );
  const actionStatus = useMemo(
    () => selectActionStatusInfo(game.state),
    [game.state]
  );
  const fullXpThreshold = useMemo(
    () => getFullXpThreshold(game.state),
    [game.state]
  );
  const repetitiveXpMultiplier = useMemo(
    () => getRepetitiveXpMultiplier(game.state.repetitiveActionCount, fullXpThreshold),
    [game.state.repetitiveActionCount, fullXpThreshold]
  );
  const repetitiveXpPercent = Math.round(repetitiveXpMultiplier * 100);
  const isRepetitionPenaltyActive = game.state.repetitiveActionCount >= fullXpThreshold;
  const currentSkillInfo = useMemo(
    () => selectCurrentSkillInfo(game.state),
    [game.state]
  );
  const undiscoveredBiomes = useMemo(
    () => selectUndiscoveredBiomeCount(game.state, game.state.currentAction?.expeditionId),
    [game.state]
  );

  // Queue-aware action callbacks: when queue mode is on and an action is running,
  // clicking an action queues it instead of immediately switching
  const handleStartAction = useCallback((action: Parameters<typeof game.startAction>[0]) => {
    if (queueMode && game.state.currentAction && game.state.actionQueue.length < maxQueueSize) {
      game.queueAction({ actionId: action.id, actionType: "gather" });
    } else {
      game.startAction(action);
    }
  }, [queueMode, game.state.currentAction, game.state.actionQueue.length, maxQueueSize, game.startAction, game.queueAction]);

  const handleStartCraft = useCallback((recipe: Parameters<typeof game.startCraft>[0]) => {
    if (queueMode && game.state.currentAction && game.state.actionQueue.length < maxQueueSize) {
      game.queueAction({ actionId: recipe.id, actionType: "craft" });
    } else {
      game.startCraft(recipe);
    }
  }, [queueMode, game.state.currentAction, game.state.actionQueue.length, maxQueueSize, game.startCraft, game.queueAction]);

  const handleStartExpedition = useCallback((expedition: Parameters<typeof game.startExpedition>[0]) => {
    if (queueMode && game.state.currentAction && game.state.actionQueue.length < maxQueueSize) {
      game.queueAction({ actionId: expedition.id, actionType: "expedition" });
    } else {
      game.startExpedition(expedition);
    }
  }, [queueMode, game.state.currentAction, game.state.actionQueue.length, maxQueueSize, game.startExpedition, game.queueAction]);

  const handleStartRoutine = useCallback((routineId: string) => {
    if (queueMode && game.state.currentAction && game.state.actionQueue.length < maxQueueSize) {
      game.queueAction({ actionId: routineId, actionType: "routine" });
    } else {
      game.startRoutine(routineId);
    }
  }, [queueMode, game.state.currentAction, game.state.actionQueue.length, maxQueueSize, game.startRoutine, game.queueAction]);

  return (
    <ItemLookupWithBrowse state={game.state}>
    <div className={`app phase-${currentPhase.id}${hideFlavorText ? " hide-flavor-text" : ""}`}>
      {game.state.victory && !victoryDismissed && (
        <VictoryScreen state={game.state} onContinue={() => { setVictoryDismissed(true); localStorage.setItem("seabound_victoryDismissed", "true"); }} onUnlockMainland={game.unlockMainland} />
      )}
      {pendingChapter && !game.state.victory && (
        <ChapterCard phase={pendingChapter} onDismiss={dismissChapter} />
      )}
      {pendingBiome && !pendingChapter && !game.state.victory && (
        <BiomeDiscoveryModal
          biomeId={pendingBiome.biomeId!}
          message={pendingBiome.message}
          onDismiss={dismissBiomeDiscovery}
        />
      )}
      <FeedbackQuestion
        hasPlayedEnough={game.state.completedRecipes.includes("build_raft")}
        hasModalOpen={!!pendingChapter || !!pendingBiome || settingsOpen || modPanelOpen || searchOpen || showLog || !!pendingCombatLog}
        phaseName={currentPhase.name}
        discoveredBiomes={game.state.discoveredBiomes}
        totalPlayTimeMs={game.state.totalPlayTimeMs}
        activeTab={activeTab}
      />
      {updateAvailable && (
        <div className="update-bar" onClick={() => window.location.reload()}>
          A new version is available — tap to refresh
        </div>
      )}
      {isOldDomain && !migrateBannerDismissed && (
        <div className="migrate-bar">
          <span>We've moved to <strong>seabound.dev</strong>!</span>
          <button className="migrate-btn" onClick={handleMigrate}>Move my save</button>
          <button className="migrate-dismiss" onClick={() => setMigrateBannerDismissed(true)}><CloseIcon size={12} /></button>
        </div>
      )}
      <WhatsNew />
      <header className="header">
        <h1>SeaBound</h1>
        <div className="header-actions">
          <GuideHeaderButton />
          <button
            className={`btn-ghost${showLog ? " active" : ""}`}
            onClick={() => setShowLog((v) => !v)}
          >
            Journal
          </button>
          <button
            className="btn-ghost"
            onClick={() => setSettingsOpen((o) => !o)}
          >
            Settings
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                game.importSave(file);
                e.target.value = "";
              }
              setSettingsOpen(false);
            }}
          />
        </div>
      </header>

      {screen === "island" && <IslandBanner phase={currentPhase.id} />}

      {game.state.mainlandUnlocked && (
        <nav className="screen-switcher">
          <button
            className={`screen-btn${screen === "island" ? " active" : ""}`}
            onClick={() => handleScreenSwitch("island")}
          >
            <GameIcon id="tab_explore" size={18} />
            Island
          </button>
          <button
            className={`screen-btn${screen === "mainland" ? " active" : ""}`}
            onClick={() => handleScreenSwitch("mainland")}
          >
            <GameIcon id="coastal_cliffs" size={18} />
            Mainland
          </button>
        </nav>
      )}

      <div className="app-body">
        {/* Desktop left sidebar: skills */}
        {hasAnyXp && (
          <aside className="inventory-sidebar sidebar-left">
            <SkillsPanel state={game.state} />
          </aside>
        )}

        {/* Desktop right sidebar: inventory (rendered before app-main in DOM, ordered via CSS) */}
        {hasAnyResource && (
          <aside className="inventory-sidebar sidebar-right">
            <InventoryPanel state={game.state} highlightedResources={highlightedResources} onRepairItem={game.repairItem} onSalvageItem={game.salvageItem} onEquipItem={game.equipItem} onDiscardItem={game.discardItem} />
          </aside>
        )}

        <div className="app-main">
          {/* Compact resource bar: visible on mobile, hidden on desktop */}
          <ResourcePanel state={game.state} />

          {game.state.currentAction && (
            <div className="current-action">
              <div className="current-action-info">
                <span className="current-action-name">{currentActionName}</span>
                <div className="current-action-buttons">
                  {queueUnlocked && (
                    <button
                      className={`queue-toggle${queueMode ? " active" : ""}`}
                      onClick={() => game.toggleQueueMode()}
                      title="When active, clicking an action queues it instead of switching"
                    >
                      Queue {queueMode ? "On" : "Off"}
                    </button>
                  )}
                  <button className="stop-btn" onClick={game.stopAction}>
                    Stop
                  </button>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${game.actionProgress * 100}%` }}
                />
              </div>
              <span className="progress-time">
                {(
                  (game.actionDuration / 1000) *
                  (1 - game.actionProgress)
                ).toFixed(1)}
                s
              </span>
              {actionStatus && (
                <div className="action-status-row">
                  {actionStatus.inputs && actionStatus.inputs.map((inp) => (
                    <span key={inp.name} className="action-status-tag">
                      {inp.name} {inp.have}
                    </span>
                  ))}
                  {actionStatus.craftsRemaining !== undefined && (
                    <span className={`action-status-tag${actionStatus.craftsRemaining <= 1 ? " warning" : ""}`}>
                      {actionStatus.craftsRemaining}x left
                    </span>
                  )}
                  {actionStatus.outputs && actionStatus.outputs.map((out) => (
                    <span
                      key={out.name}
                      className={`action-status-tag${out.amount >= out.limit ? " full" : ""}`}
                    >
                      {out.name} {out.amount}/{out.limit}
                    </span>
                  ))}
                </div>
              )}
              <div
                className={`repetition-status${isRepetitionPenaltyActive ? " penalty" : ""}`}
                title="Manual action switch resets repetition to 0."
              >
                Repetition {game.state.repetitiveActionCount} • XP {repetitiveXpPercent}%
                {isRepetitionPenaltyActive ? " (malus active)" : ""}
                {currentSkillInfo && (
                  <span className="current-skill-hint">
                    {" "}• {currentSkillInfo.skillName} {currentSkillInfo.level} ({Math.floor(currentSkillInfo.progress * 100)}%)
                  </span>
                )}
                {game.state.currentAction?.type === "expedition" && undiscoveredBiomes > 0 && (
                  <span className="current-skill-hint">
                    {" "}• {undiscoveredBiomes} {undiscoveredBiomes === 1 ? "biome" : "biomes"} left
                  </span>
                )}
              </div>
              {game.state.actionQueue.length > 0 && (
                <div className="action-queue-row">
                  <span className="queue-label">Next:</span>
                  <div className="queued-actions">
                    {game.state.actionQueue.map((q, i) => {
                      if (q.actionType === "routine") {
                        const routine = game.state.routines.find((r) => r.id === q.actionId);
                        return (
                          <span key={i} className="queued-action-tag queued-routine-tag">
                            <span className="queued-routine-label">{routine?.name ?? q.actionId}</span>
                            <span className="queued-routine-steps">
                              {routine?.steps.map((step, idx) => (
                                <span key={idx} className="queued-routine-step">
                                  <GameIcon id={getStepIcon(step)} size={12} />
                                  {idx < (routine?.steps.length ?? 0) - 1 && <span className="queued-routine-arrow">{"\u2192"}</span>}
                                </span>
                              ))}
                            </span>
                          </span>
                        );
                      }
                      return (
                        <span key={i} className="queued-action-tag">
                          <GameIcon id={getQueuedActionIcon(q, game.state.routines)} size={14} />
                          {getQueuedActionName(q, game.state.routines)}
                        </span>
                      );
                    })}
                    <button className="queue-clear-btn" onClick={game.clearQueue} title="Clear queue">
                      ✕
                    </button>
                  </div>
                </div>
              )}
              {queueMode && game.state.actionQueue.length === 0 && (
                <div className="action-queue-row">
                  <span className="queue-hint">Click an action to queue it next ({game.state.actionQueue.length}/{maxQueueSize})</span>
                </div>
              )}
            </div>
          )}

          {readyStationCount > 0 && screen === "island" ? (
            <div className="station-ready-banner" onClick={() => setTab("tend")}>
              {readyStationCount === 1
                ? "1 station ready to collect!"
                : `${readyStationCount} stations ready to collect!`}
            </div>
          ) : null}

          <div className="tabs-row">
            <nav className="tabs">
              {visibleTabs.filter((t) => t !== "inventory" && t !== "skills").map((t) => (
                <button
                  key={t}
                  className={`tab ${activeTab === t ? "active" : ""}`}
                  onClick={() => handleTabSwitch(t)}
                >
                  <span className="tab-icon-wrapper">
                    <GameIcon id={`tab_${t}`} size={22} />
                    {t === "tend" && readyStationCount > 0 && (
                      <span className="tab-badge">{readyStationCount}</span>
                    )}
                  </span>
                  <span className="tab-label">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                </button>
              ))}
              {/* Desktop: show skills tab inline (inventory is in sidebar on desktop) */}
              {visibleTabs.includes("skills") && (
                <button
                  className={`tab desktop-only-tab ${activeTab === "skills" ? "active" : ""}`}
                  onClick={() => handleTabSwitch("skills")}
                >
                  <GameIcon id="tab_skills" size={22} /><span className="tab-label">Skills</span>
                </button>
              )}
              {/* Mobile: show overflow tabs behind "More" menu (hidden on desktop via CSS) */}
              {visibleTabs.some((t) => t === "inventory" || t === "skills") && (
                <div className="tab-more-wrapper" ref={moreMenuRef}>
                  <button
                    className={`tab tab-more ${(activeTab === "inventory" || activeTab === "skills") ? "active" : ""}`}
                    onClick={() => setMoreMenuOpen((o) => !o)}
                  >
                    <span className="tab-more-icon">⋯</span><span className="tab-label">More</span>
                  </button>
                  {moreMenuOpen && (
                    <div className="tab-more-menu">
                      {visibleTabs.filter((t) => t === "inventory" || t === "skills").map((t) => (
                        <button
                          key={t}
                          className={`tab-more-item ${activeTab === t ? "active" : ""}`}
                          onClick={() => { handleTabSwitch(t); setMoreMenuOpen(false); }}
                        >
                          <GameIcon id={`tab_${t}`} size={20} />{t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>
            <button
              className="search-toggle-btn"
              onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
              title="Search actions, recipes, resources..."
            >
              🔍
            </button>
          </div>

          {showLog && (
            <div className="log-overlay" onClick={() => setShowLog(false)}>
              <div className="log-modal" onClick={(e) => e.stopPropagation()}>
                <div className="log-modal-header">
                  <span className="log-modal-title">Journal</span>
                  <button className="log-modal-close" onClick={() => setShowLog(false)}><CloseIcon size={16} /></button>
                </div>
                <div className="log-modal-body">
                  <LogPanel entries={game.state.discoveryLog} />
                  {game.state.combatLog.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span className="combat-log-section-title" style={{ border: "none", margin: 0, padding: 0 }}>
                          Combat Logs ({game.state.combatLog.length})
                        </span>
                        <button className="combat-log-clear-btn" onClick={() => game.clearCombatLog()}>
                          Clear All
                        </button>
                      </div>
                      {game.state.combatLog.map((entry) => {
                        const gradeColor = entry.grade === "success" ? "#2ecc71" : entry.grade === "partial" ? "#f0c040" : "#e74c3c";
                        return (
                          <div
                            key={entry.id}
                            className="log-entry log-expedition"
                            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onClick={() => { setShowLog(false); setPendingCombatLog(entry); trackCombatLogOpen(); }}
                          >
                            <div>
                              <span className="log-time">
                                {new Date(entry.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </span>
                              <span style={{ color: gradeColor, fontWeight: 600, marginRight: 6 }}>
                                {entry.grade === "success" ? "✓" : entry.grade === "partial" ? "◐" : "✗"}
                              </span>
                              {entry.expeditionName}
                            </div>
                            <button
                              className="combat-log-clear-btn"
                              onClick={(e) => { e.stopPropagation(); game.deleteCombatLogEntry(entry.id); }}
                              title="Delete this log"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {pendingCombatLog && (
            <CombatLogModal entry={pendingCombatLog} onClose={() => setPendingCombatLog(null)} />
          )}

          <main className={`panel${tabTransition ? " panel-enter" : ""}`}>
            {activeTab === "gather" && (
              <ActionPanel
                actions={gatherActions}
                state={game.state}
                onStart={handleStartAction}
                currentActionId={game.state.currentAction?.type === "gather" ? game.state.currentAction.actionId : null}
                queueMode={queueMode && !!game.state.currentAction}
              />
            )}
            {activeTab === "inventory" && (
              <div className="mobile-only-panel">
                <InventoryPanel state={game.state} onRepairItem={game.repairItem} onSalvageItem={game.salvageItem} onEquipItem={game.equipItem} onDiscardItem={game.discardItem} />
              </div>
            )}
            {activeTab === "craft" && (
              <CraftingPanel
                recipes={craftRecipes}
                state={game.state}
                onCraft={handleStartCraft}
                onHighlightResources={setHighlightedResources}
                queueMode={queueMode && !!game.state.currentAction}
              />
            )}
            {activeTab === "tend" && (
              <StationsPanel
                availableStations={game.availableStations}
                lockedStations={game.lockedStations}
                state={game.state}
                onDeploy={game.deployStation}
                onCollect={game.collectStation}
                onCollectAll={game.collectAllStations}
                onFlyup={handleFlyup}
              />
            )}
            {activeTab === "build" && (
              <SettlementPanel
                buildRecipes={buildRecipes}
                buildActions={buildActions}
                state={game.state}
                onBuild={handleStartCraft}
                onStartAction={handleStartAction}
                onHighlightResources={setHighlightedResources}
              />
            )}
            {activeTab === "explore" && (
              <ExpeditionPanel
                expeditions={screenExpeditions}
                state={game.state}
                onStart={handleStartExpedition}
              />
            )}
            {activeTab === "routines" && (
              <RoutinesPanel
                state={game.state}
                availableActions={game.availableActions}
                availableRecipes={game.availableRecipes}
                onSaveRoutine={game.saveRoutine}
                onDeleteRoutine={game.deleteRoutine}
                onStartRoutine={handleStartRoutine}
                onStopRoutine={game.stopRoutine}
              />
            )}
            {activeTab === "skills" && <SkillsPanel state={game.state} />}
          </main>
        </div>

        <NotificationToast
          discoveryLog={game.state.discoveryLog}
          lastSeenDiscoveryId={game.state.lastSeenDiscoveryId}
          onSeen={game.markDiscoverySeen}
          onBiomeDiscovery={handleBiomeDiscovery}
        />

      </div>

      {changelogOpen && (
        <ChangelogModal onClose={() => setChangelogOpen(false)} />
      )}

      {modPanelOpen && (
        <ModPanel
          onClose={() => setModPanelOpen(false)}
          onModSwitch={handleModSwitch}
        />
      )}

      {searchOpen && (
        <SearchPanel
          query={searchQuery}
          onChangeQuery={setSearchQuery}
          onClose={() => setSearchOpen(false)}
          actions={game.availableActions}
          recipes={game.availableRecipes}
          stations={game.availableStations}
          expeditions={game.availableExpeditions}
          onStartAction={handleStartAction}
          onStartCraft={handleStartCraft}
          onDeployStation={game.deployStation}
          onStartExpedition={handleStartExpedition}
          onJumpToTab={(t) => setTab(t as GameTab)}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>Settings</h2>
              <button className="modal-close-btn" onClick={() => setSettingsOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="settings-modal-body">
              <div className="settings-section">
                <div className="settings-section-title">Save Data</div>
                <div className="settings-section-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      game.exportSave();
                    }}
                  >
                    Save to file
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Load from file
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Display</div>
                <label className="settings-toggle">
                  <span>Hide flavor text</span>
                  <input
                    type="checkbox"
                    checked={hideFlavorText}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setHideFlavorText(v);
                      localStorage.setItem("seabound_hideFlavorText", String(v));
                    }}
                  />
                </label>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">About</div>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setChangelogOpen(true);
                    setSettingsOpen(false);
                  }}
                >
                  Changelog
                </button>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Mods</div>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setModPanelOpen(true);
                    setSettingsOpen(false);
                  }}
                >
                  Manage Mods{activeModId !== "base" ? ` (${activeModId})` : ""}
                </button>
              </div>

              <div className="settings-section settings-danger-zone">
                <div className="settings-section-title">Danger Zone</div>
                <p className="settings-danger-desc">
                  This will permanently erase all progress. This cannot be undone.
                </p>
                <button
                  className="btn-danger"
                  onClick={() => {
                    setResetConfirmOpen(true);
                    setResetInput("");
                  }}
                >
                  Reset All Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="reset-overlay" onClick={() => setResetConfirmOpen(false)}>
          <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>Confirm Reset</h2>
              <button className="modal-close-btn" onClick={() => setResetConfirmOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="reset-modal-body">
              <p className="reset-warning">
                This will permanently delete all your progress, resources, skills, and buildings. There is no undo.
              </p>
              <label className="reset-label">
                Type <strong>RESET</strong> to confirm:
              </label>
              <input
                type="text"
                className="reset-input"
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value)}
                placeholder="RESET"
                autoFocus
              />
              <div className="reset-actions">
                <button
                  className="btn-ghost"
                  onClick={() => setResetConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  disabled={resetInput !== "RESET"}
                  onClick={() => {
                    game.resetGame();
                    localStorage.removeItem("seabound_victoryDismissed");
                    setVictoryDismissed(false);
                    setResetConfirmOpen(false);
                    setSettingsOpen(false);
                  }}
                >
                  Permanently Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CollectFlyup items={flyups} onDone={handleFlyupDone} />

      <FeedbackBanner />
    </div>
    </ItemLookupWithBrowse>
  );
}
