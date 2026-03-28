import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { AccordionSection } from "./components/AccordionSection";
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
import { ModalOverlay } from "./components/ModalOverlay";
import { NotificationToast } from "./components/NotificationToast";
import { ResourcePanel } from "./components/ResourcePanel";
import { SettlementPanel } from "./components/SettlementPanel";
import { SkillsPanel } from "./components/SkillsPanel";
import { StationsPanel } from "./components/StationsPanel";
import { GameIcon } from "./components/GameIcon";
import { getCurrentPhase, PhaseInfo } from "./engine/phases";
import {
  AccordionSection as AccordionSectionId,
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
  selectVisibleSections,
} from "./engine/selectors";
import { useGame } from "./engine/useGame";
import { useUpdateChecker } from "./engine/useUpdateChecker";
import { FULL_XP_ACTIONS, getRepetitiveXpMultiplier } from "./engine/repetitiveXp";
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
  const [expandedSections, setExpandedSections] = useState<Set<AccordionSectionId>>(
    () => new Set(["gather"])
  );
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLog, setShowLog] = useState(false);
  const buildRef = useRef<HTMLElement>(null);

  const toggleSection = useCallback((s: AccordionSectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }, []);
  const [hideFlavorText, setHideFlavorText] = useState(
    () => localStorage.getItem("seabound_hideFlavorText") === "true"
  );
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

  const visibleSections = useMemo(() => {
    return selectVisibleSections({
      hasFoodAccess,
      craftRecipeCount: craftRecipes.length,
      buildRecipeCount: buildRecipes.length,
      buildActionCount: buildActions.length,
      buildingCount: game.state.buildings.length,
      availableStationCount: game.availableStations.length,
      deployedStationCount: game.state.stations.length,
    });
  }, [
    hasFoodAccess,
    craftRecipes.length,
    buildRecipes.length,
    buildActions.length,
    game.state.buildings.length,
    game.availableStations.length,
    game.state.stations.length,
  ]);

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
  const repetitiveXpMultiplier = useMemo(
    () => getRepetitiveXpMultiplier(game.state.repetitiveActionCount),
    [game.state.repetitiveActionCount]
  );
  const repetitiveXpPercent = Math.round(repetitiveXpMultiplier * 100);
  const isRepetitionPenaltyActive = game.state.repetitiveActionCount >= FULL_XP_ACTIONS;

  return (
    <div className={`app phase-${currentPhase.id}${hideFlavorText ? " hide-flavor-text" : ""}`}>
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
                      className={`stop-when-full-btn${game.state.currentAction?.stopWhenFull ? " active" : ""}`}
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
            <div className="station-ready-banner" onClick={() => {
              setExpandedSections((prev) => new Set(prev).add("build"));
              buildRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}>
              {readyStationCount === 1
                ? "1 station ready to collect!"
                : `${readyStationCount} stations ready to collect!`}
            </div>
          ) : null}

          {(hasAnyXp || hasAnyResource) && (
            <div className="modal-triggers">
              {hasAnyXp && (
                <button className="modal-trigger-btn" onClick={() => setSkillsOpen(true)}>
                  <GameIcon id="tab_skills" size={18} /> Skills
                </button>
              )}
              {hasAnyResource && (
                <button className="modal-trigger-btn mobile-only-btn" onClick={() => setInventoryOpen(true)}>
                  <GameIcon id="tab_inventory" size={18} /> Inventory
                </button>
              )}
            </div>
          )}

          {showLog && (
            <div className="log-drawer">
              <LogPanel entries={game.state.discoveryLog} />
            </div>
          )}

          <main className="accordion-panels">
            {visibleSections.includes("gather") && (
              <AccordionSection
                name="Gather"
                icon={<GameIcon id="tab_gather" size={18} />}
                expanded={expandedSections.has("gather")}
                onToggle={() => toggleSection("gather")}
                summary={!expandedSections.has("gather") && currentActionName && game.state.currentAction?.type === "gather" ? currentActionName : undefined}
              >
                <ActionPanel
                  actions={gatherActions}
                  state={game.state}
                  onStart={game.startAction}
                  currentActionId={game.state.currentAction?.type === "gather" ? game.state.currentAction.actionId : null}
                />
              </AccordionSection>
            )}
            {visibleSections.includes("craft") && (
              <AccordionSection
                name="Craft"
                icon={<GameIcon id="tab_craft" size={18} />}
                expanded={expandedSections.has("craft")}
                onToggle={() => toggleSection("craft")}
                summary={!expandedSections.has("craft") ? `${craftRecipes.length} recipe${craftRecipes.length !== 1 ? "s" : ""}` : undefined}
              >
                <CraftingPanel
                  recipes={craftRecipes}
                  state={game.state}
                  onCraft={game.startCraft}
                />
              </AccordionSection>
            )}
            {visibleSections.includes("build") && (
              <AccordionSection
                name="Build"
                icon={<GameIcon id="tab_build" size={18} />}
                expanded={expandedSections.has("build")}
                onToggle={() => toggleSection("build")}
                summary={!expandedSections.has("build") && readyStationCount > 0 ? `${readyStationCount} station${readyStationCount !== 1 ? "s" : ""} ready!` : undefined}
                ref={buildRef}
              >
                {(game.availableStations.length > 0 || game.state.stations.length > 0) && (
                  <StationsPanel
                    availableStations={game.availableStations}
                    state={game.state}
                    onDeploy={game.deployStation}
                    onCollect={game.collectStation}
                  />
                )}
                <SettlementPanel
                  buildRecipes={buildRecipes}
                  buildActions={buildActions}
                  state={game.state}
                  onBuild={game.startCraft}
                  onStartAction={game.startAction}
                />
              </AccordionSection>
            )}
            {visibleSections.includes("explore") && (
              <AccordionSection
                name="Explore"
                icon={<GameIcon id="tab_explore" size={18} />}
                expanded={expandedSections.has("explore")}
                onToggle={() => toggleSection("explore")}
                summary={!expandedSections.has("explore") ? `${game.availableExpeditions.length} expedition${game.availableExpeditions.length !== 1 ? "s" : ""}` : undefined}
              >
                <ExpeditionPanel
                  expeditions={game.availableExpeditions}
                  state={game.state}
                  onStart={game.startExpedition}
                />
              </AccordionSection>
            )}
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

      {skillsOpen && (
        <ModalOverlay onClose={() => setSkillsOpen(false)} title="Skills" icon={<GameIcon id="tab_skills" size={18} />}>
          <SkillsPanel state={game.state} />
        </ModalOverlay>
      )}
      {inventoryOpen && (
        <ModalOverlay onClose={() => setInventoryOpen(false)} title="Inventory" icon={<GameIcon id="tab_inventory" size={18} />} className="mobile-only-modal">
          <InventoryPanel state={game.state} />
        </ModalOverlay>
      )}

      <FeedbackBanner />
    </div>
  );
}
