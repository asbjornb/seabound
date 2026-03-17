import { useRef, useMemo, useState } from "react";
import { ActionPanel } from "./components/ActionPanel";
import { CraftingPanel } from "./components/CraftingPanel";
import { DevWiki } from "./components/DevWiki";
import { ExpeditionPanel } from "./components/ExpeditionPanel";
import { InventoryPanel } from "./components/InventoryPanel";
import { LogPanel } from "./components/LogPanel";
import { ResourcePanel } from "./components/ResourcePanel";
import { SettlementPanel } from "./components/SettlementPanel";
import { SkillsPanel } from "./components/SkillsPanel";
import { TAB_ICONS } from "./data/icons";
import { SkillId } from "./data/types";
import { getTotalFood } from "./engine/gameState";
import { useGame } from "./engine/useGame";
import { useUpdateChecker } from "./engine/useUpdateChecker";
import "./App.css";

type Tab = "gather" | "inventory" | "craft" | "camp" | "explore" | "skills";

export default function App() {
  // Dev wiki: show at ?dev
  if (window.location.search.includes("dev")) {
    return <DevWiki />;
  }
  const game = useGame();
  const updateAvailable = useUpdateChecker();
  const [tab, setTab] = useState<Tab>("gather");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLog, setShowLog] = useState(false);

  // Split recipes: building recipes + camp maintenance go to Camp tab, others stay in Craft
  const campRecipeIds = new Set(["maintain_camp"]);
  const craftRecipes = game.availableRecipes.filter((r) => !r.buildingOutput && !campRecipeIds.has(r.id));
  const campRecipes = game.availableRecipes.filter((r) => !!r.buildingOutput || campRecipeIds.has(r.id));

  // Split actions: construction actions go to Camp tab, others stay in Gather
  const gatherActions = game.availableActions.filter((a) => a.skillId !== "construction");
  const campActions = game.availableActions.filter((a) => a.skillId === "construction");

  // Progressive tab visibility
  const hasAnyXp = useMemo(
    () =>
      (Object.keys(game.state.skills) as SkillId[]).some(
        (id) => game.state.skills[id].xp > 0
      ),
    [game.state.skills]
  );
  const hasFood =
    getTotalFood(game.state) >= 1 ||
    game.state.discoveredBiomes.length > 1; // already explored

  const hasAnyResource = Object.values(game.state.resources).some((v) => v > 0);

  // On mobile, inventory is a tab; on desktop it's always visible as sidebar
  const visibleTabs = useMemo(() => {
    const tabs: Tab[] = ["gather"];
    if (hasFood) tabs.push("explore");
    if (craftRecipes.length > 0) tabs.push("craft");
    if (campRecipes.length > 0 || campActions.length > 0 || game.state.buildings.length > 0) tabs.push("camp");
    if (hasAnyResource) tabs.push("inventory");
    if (hasAnyXp) tabs.push("skills");
    return tabs;
  }, [hasAnyResource, hasFood, craftRecipes.length, campRecipes.length, campActions.length, game.state.buildings.length, hasAnyXp]);

  // Fall back to gather if current tab isn't visible
  const activeTab = visibleTabs.includes(tab) ? tab : "gather";

  const currentActionName = (() => {
    if (!game.state.currentAction) return null;
    const { type, actionId, recipeId, expeditionId } = game.state.currentAction;
    if (type === "gather") {
      return game.availableActions.find((a) => a.id === actionId)?.name;
    }
    if (type === "craft") {
      // Check both craft and building recipes
      const allRecipes = game.availableRecipes;
      return allRecipes.find((r) => r.id === recipeId)?.name;
    }
    if (type === "expedition") {
      return game.availableExpeditions.find((e) => e.id === expeditionId)?.name;
    }
    return null;
  })();

  return (
    <div className="app">
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
            </div>
          )}

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
              <SettlementPanel
                campRecipes={campRecipes}
                campActions={campActions}
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
