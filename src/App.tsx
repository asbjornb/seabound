import { useRef, useMemo, useState, useEffect } from "react";
import { ActionPanel } from "./components/ActionPanel";
import { ChapterCard } from "./components/ChapterCard";
import { CraftingPanel } from "./components/CraftingPanel";
import { DevWiki } from "./components/DevWiki";
import { ExpeditionPanel } from "./components/ExpeditionPanel";
import { InventoryPanel } from "./components/InventoryPanel";
import { IslandBanner } from "./components/IslandBanner";
import { LogPanel } from "./components/LogPanel";
import { NotificationToast } from "./components/NotificationToast";
import { ResourcePanel } from "./components/ResourcePanel";
import { SettlementPanel } from "./components/SettlementPanel";
import { SkillsPanel } from "./components/SkillsPanel";
import { StationsPanel } from "./components/StationsPanel";
import { TAB_ICONS } from "./data/icons";
import { getCurrentPhase, PhaseInfo } from "./engine/phases";
import {
  GameTab,
  selectCampActions,
  selectCampRecipes,
  selectCraftRecipes,
  selectCurrentActionName,
  selectHasAnyResource,
  selectHasAnyXp,
  selectHasFoodAccess,
  selectGatherActions,
  selectReadyStationCount,
  selectVisibleTabs,
} from "./engine/selectors";
import { useGame } from "./engine/useGame";
import { useUpdateChecker } from "./engine/useUpdateChecker";
import { FULL_XP_ACTIONS, getRepetitiveXpMultiplier } from "./engine/repetitiveXp";
import "./App.css";

export default function App() {
  // Dev wiki: show at ?dev
  if (window.location.search.includes("dev")) {
    return <DevWiki />;
  }
  const game = useGame();
  const updateAvailable = useUpdateChecker();
  const [tab, setTab] = useState<GameTab>("gather");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLog, setShowLog] = useState(false);
  const [pendingChapter, setPendingChapter] = useState<PhaseInfo | null>(null);

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
  const campRecipes = useMemo(
    () => selectCampRecipes(game.availableRecipes),
    [game.availableRecipes]
  );

  // Split actions by explicit panel metadata
  const gatherActions = useMemo(
    () => selectGatherActions(game.availableActions),
    [game.availableActions]
  );
  const campActions = useMemo(
    () => selectCampActions(game.availableActions),
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
      campRecipeCount: campRecipes.length,
      campActionCount: campActions.length,
      buildingCount: game.state.buildings.length,
      availableStationCount: game.availableStations.length,
      deployedStationCount: game.state.stations.length,
    });
  }, [
    hasFoodAccess,
    hasAnyResource,
    hasAnyXp,
    craftRecipes.length,
    campRecipes.length,
    campActions.length,
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
  const repetitiveXpMultiplier = useMemo(
    () => getRepetitiveXpMultiplier(game.state.repetitiveActionCount),
    [game.state.repetitiveActionCount]
  );
  const repetitiveXpPercent = Math.round(repetitiveXpMultiplier * 100);
  const isRepetitionPenaltyActive = game.state.repetitiveActionCount >= FULL_XP_ACTIONS;

  return (
    <div className={`app phase-${currentPhase.id}`}>
      {pendingChapter && (
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
                <button className="stop-btn" onClick={game.stopAction}>
                  Stop
                </button>
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
            <div className="station-ready-banner" onClick={() => setTab("camp")}>
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
                {TAB_ICONS[t] ?? ""}{" "}{t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>

          {showLog && (
            <div className="log-drawer">
              <LogPanel entries={game.state.discoveryLog} />
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
            {activeTab === "camp" && (
              <>
                {(game.availableStations.length > 0 || game.state.stations.length > 0) && (
                  <StationsPanel
                    availableStations={game.availableStations}
                    state={game.state}
                    onDeploy={game.deployStation}
                    onCollect={game.collectStation}
                  />
                )}
                <SettlementPanel
                  campRecipes={campRecipes}
                  campActions={campActions}
                  state={game.state}
                  onBuild={game.startCraft}
                  onStartAction={game.startAction}
                />
              </>
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

        <NotificationToast discoveryLog={game.state.discoveryLog} />

        {/* Desktop sidebar: always visible on wide screens */}
        {hasAnyResource && (
          <aside className="inventory-sidebar">
            <InventoryPanel state={game.state} />
          </aside>
        )}
      </div>
    </div>
  );
}
