import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { ActionPanel } from "./components/ActionPanel";
import { ChapterCard } from "./components/ChapterCard";
import { CraftingPanel } from "./components/CraftingPanel";
import { DevGraph } from "./components/DevGraph";
import { FeedbackBanner } from "./components/FeedbackBanner";
import { DevGraphDot } from "./components/DevGraphDot";
import { DevWiki } from "./components/DevWiki";
import { ExpeditionPanel } from "./components/ExpeditionPanel";
import { InventoryPanel } from "./components/InventoryPanel";
import { IslandBanner } from "./components/IslandBanner";
import { LogPanel } from "./components/LogPanel";
import { ModPanel } from "./components/ModPanel";
import { NotificationToast } from "./components/NotificationToast";
import { ResourcePanel } from "./components/ResourcePanel";
import { SearchPanel } from "./components/SearchPanel";
import { SettlementPanel } from "./components/SettlementPanel";
import { SkillsPanel } from "./components/SkillsPanel";
import { StationsPanel } from "./components/StationsPanel";
import { VictoryScreen } from "./components/VictoryScreen";
import { GameIcon } from "./components/GameIcon";
import { getActiveModId } from "./data/modding";
import { getCurrentPhase, PhaseInfo } from "./engine/phases";
import {
  GameTab,
  selectBuildActions,
  selectBuildRecipes,
  selectCraftRecipes,
  selectCurrentActionName,
  selectHasAnyResource,
  selectHasAnyXp,
  selectHasFoodAccess,
  selectGatherActions,
  selectActionStatusInfo,
  selectReadyStationCount,
  selectVisibleTabs,
} from "./engine/selectors";
import { useGame } from "./engine/useGame";
import { useUpdateChecker } from "./engine/useUpdateChecker";
import { getFullXpThreshold, getRepetitiveXpMultiplier } from "./engine/repetitiveXp";
import "./App.css";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modPanelOpen, setModPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLog, setShowLog] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideFlavorText, setHideFlavorText] = useState(
    () => localStorage.getItem("seabound_hideFlavorText") === "true"
  );
  const [pendingChapter, setPendingChapter] = useState<PhaseInfo | null>(null);
  const activeModId = getActiveModId();

  const handleModSwitch = useCallback(() => {
    // After mod switch, reload the game state for the new mod
    window.location.reload();
  }, []);

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

  // Split recipes by explicit panel metadata
  const craftRecipes = useMemo(
    () => selectCraftRecipes(game.availableRecipes),
    [game.availableRecipes]
  );
  const buildRecipes = useMemo(
    () => selectBuildRecipes(game.availableRecipes),
    [game.availableRecipes]
  );

  // Split actions by explicit panel metadata
  const gatherActions = useMemo(
    () => selectGatherActions(game.availableActions),
    [game.availableActions]
  );
  const buildActions = useMemo(
    () => selectBuildActions(game.availableActions),
    [game.availableActions]
  );

  // Progressive tab visibility
  const hasAnyXp = useMemo(() => selectHasAnyXp(game.state), [game.state]);
  const hasFoodAccess = useMemo(() => selectHasFoodAccess(game.state), [game.state]);
  const hasAnyResource = useMemo(() => selectHasAnyResource(game.state), [game.state]);

  // On mobile, inventory is a tab; on desktop it's always visible as sidebar
  const visibleTabs = useMemo(() => {
    return selectVisibleTabs({
      hasFoodAccess,
      hasAnyResource,
      hasAnyXp,
      craftRecipeCount: craftRecipes.length,
      buildRecipeCount: buildRecipes.length,
      buildActionCount: buildActions.length,
      buildingCount: game.state.buildings.length,
      availableStationCount: game.availableStations.length,
      deployedStationCount: game.state.stations.length,
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

  return (
    <div className={`app phase-${currentPhase.id}${hideFlavorText ? " hide-flavor-text" : ""}`}>
      {game.state.victory && <VictoryScreen state={game.state} />}
      {pendingChapter && !game.state.victory && (
        <ChapterCard phase={pendingChapter} onDismiss={dismissChapter} />
      )}
      {updateAvailable && (
        <div className="update-bar" onClick={() => window.location.reload()}>
          A new version is available — tap to refresh
        </div>
      )}
      <header className="header">
        <h1>SeaBound</h1>
        <div className="header-actions">
          <button
            className="search-toggle-btn"
            onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
          >
            Search
          </button>
          <button
            className={`log-toggle-btn${showLog ? " active" : ""}`}
            onClick={() => setShowLog((v) => !v)}
          >
            Journal
          </button>
          <div className="settings-wrapper">
            <button
              className="settings-btn"
              onClick={() => setSettingsOpen((o) => !o)}
            >
              Settings
            </button>
            {settingsOpen && (
              <div className="settings-menu">
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    game.exportSave();
                    setSettingsOpen(false);
                  }}
                >
                  Save to file
                </button>
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  Load from file
                </button>
                <label className="settings-menu-item toggle">
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
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    setModPanelOpen(true);
                    setSettingsOpen(false);
                  }}
                >
                  Mods{activeModId !== "base" ? ` (${activeModId})` : ""}
                </button>
                <button
                  className="settings-menu-item danger"
                  onClick={() => {
                    game.resetGame();
                    setSettingsOpen(false);
                  }}
                >
                  Reset
                </button>
              </div>
            )}
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
        </div>
      </header>

      <IslandBanner phase={currentPhase.id} />

      <div className="app-body">
        <div className="app-main">
          {/* Compact resource bar: visible on mobile, hidden on desktop */}
          <ResourcePanel state={game.state} />

          {game.state.currentAction && (
            <div className="current-action">
              <div className="current-action-info">
                <span className="current-action-name">{currentActionName}</span>
                <div className="current-action-buttons">
                  {actionStatus?.outputs && (
                    <button
                      className={`stop-when-full-btn${game.state.stopWhenFull ? " active" : ""}`}
                      onClick={game.toggleStopWhenFull}
                      title="Stop automatically when output storage is full"
                    >
                      Stop if full
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
              </div>
            </div>
          )}

          {readyStationCount > 0 ? (
            <div className="station-ready-banner" onClick={() => setTab("tend")}>
              {readyStationCount === 1
                ? "1 station ready to collect!"
                : `${readyStationCount} stations ready to collect!`}
            </div>
          ) : null}

          <nav className="tabs">
            {visibleTabs.map((t) => (
              <button
                key={t}
                className={`tab ${activeTab === t ? "active" : ""} ${t === "inventory" ? "mobile-only-tab" : ""}`}
                onClick={() => setTab(t)}
              >
                <GameIcon id={`tab_${t}`} size={22} /><span className="tab-label">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </button>
            ))}
          </nav>

          {showLog && (
            <div className="log-overlay" onClick={() => setShowLog(false)}>
              <div className="log-modal" onClick={(e) => e.stopPropagation()}>
                <div className="log-modal-header">
                  <span className="log-modal-title">Journal</span>
                  <button className="log-modal-close" onClick={() => setShowLog(false)}>✕</button>
                </div>
                <div className="log-modal-body">
                  <LogPanel entries={game.state.discoveryLog} />
                </div>
              </div>
            </div>
          )}

          <main className="panel">
            {activeTab === "gather" && (
              <ActionPanel
                actions={gatherActions}
                state={game.state}
                onStart={game.startAction}
                currentActionId={game.state.currentAction?.type === "gather" ? game.state.currentAction.actionId : null}
              />
            )}
            {activeTab === "inventory" && (
              <div className="mobile-only-panel">
                <InventoryPanel state={game.state} />
              </div>
            )}
            {activeTab === "craft" && (
              <CraftingPanel
                recipes={craftRecipes}
                state={game.state}
                onCraft={game.startCraft}
              />
            )}
            {activeTab === "tend" && (
              <StationsPanel
                availableStations={game.availableStations}
                lockedStations={game.lockedStations}
                state={game.state}
                onDeploy={game.deployStation}
                onCollect={game.collectStation}
              />
            )}
            {activeTab === "build" && (
              <SettlementPanel
                buildRecipes={buildRecipes}
                buildActions={buildActions}
                state={game.state}
                onBuild={game.startCraft}
                onStartAction={game.startAction}
              />
            )}
            {activeTab === "explore" && (
              <ExpeditionPanel
                expeditions={game.availableExpeditions}
                state={game.state}
                onStart={game.startExpedition}
              />
            )}
            {activeTab === "skills" && <SkillsPanel state={game.state} />}
          </main>
        </div>

        <NotificationToast
          discoveryLog={game.state.discoveryLog}
          lastSeenDiscoveryId={game.state.lastSeenDiscoveryId}
          onSeen={game.markDiscoverySeen}
        />

        {/* Desktop sidebar: always visible on wide screens */}
        {(hasAnyResource || hasAnyXp) && (
          <aside className="inventory-sidebar">
            {hasAnyXp && <SkillsPanel state={game.state} />}
            {hasAnyResource && <InventoryPanel state={game.state} />}
          </aside>
        )}
      </div>

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
          onStartAction={game.startAction}
          onStartCraft={game.startCraft}
          onDeployStation={game.deployStation}
          onStartExpedition={game.startExpedition}
          onJumpToTab={(t) => setTab(t as GameTab)}
        />
      )}

      <FeedbackBanner />
    </div>
  );
}
