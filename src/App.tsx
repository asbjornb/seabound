import { useState } from "react";
import { ActionPanel } from "./components/ActionPanel";
import { CraftingPanel } from "./components/CraftingPanel";
import { ExpeditionPanel } from "./components/ExpeditionPanel";
import { LogPanel } from "./components/LogPanel";
import { ResourcePanel } from "./components/ResourcePanel";
import { SettlementPanel } from "./components/SettlementPanel";
import { SkillsPanel } from "./components/SkillsPanel";
import { useGame } from "./engine/useGame";
import "./App.css";

type Tab = "gather" | "craft" | "camp" | "explore" | "skills" | "log";

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState<Tab>("gather");

  // Split recipes: building recipes go to Camp tab, others stay in Craft
  const craftRecipes = game.availableRecipes.filter((r) => !r.buildingOutput);
  const buildingRecipes = game.availableRecipes.filter((r) => !!r.buildingOutput);

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
      <header className="header">
        <h1>SeaBound</h1>
        <button className="reset-btn" onClick={game.resetGame}>
          Reset
        </button>
      </header>

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
        {(["gather", "craft", "camp", "explore", "skills", "log"] as Tab[]).map(
          (t) => (
            <button
              key={t}
              className={`tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          )
        )}
      </nav>

      <main className="panel">
        {tab === "gather" && (
          <ActionPanel
            actions={game.availableActions}
            state={game.state}
            onStart={game.startAction}
            busy={!!game.state.currentAction}
          />
        )}
        {tab === "craft" && (
          <CraftingPanel
            recipes={craftRecipes}
            state={game.state}
            onCraft={game.startCraft}
            busy={!!game.state.currentAction}
          />
        )}
        {tab === "camp" && (
          <SettlementPanel
            buildingRecipes={buildingRecipes}
            state={game.state}
            onBuild={game.startCraft}
            busy={!!game.state.currentAction}
          />
        )}
        {tab === "explore" && (
          <ExpeditionPanel
            expeditions={game.availableExpeditions}
            state={game.state}
            onStart={game.startExpedition}
            busy={!!game.state.currentAction}
          />
        )}
        {tab === "skills" && <SkillsPanel state={game.state} />}
        {tab === "log" && <LogPanel logs={game.logs} />}
      </main>
    </div>
  );
}
