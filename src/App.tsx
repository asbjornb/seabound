import { useState } from "react";
import { ActionPanel } from "./components/ActionPanel";
import { CraftingPanel } from "./components/CraftingPanel";
import { LogPanel } from "./components/LogPanel";
import { ResourcePanel } from "./components/ResourcePanel";
import { SkillsPanel } from "./components/SkillsPanel";
import { useGame } from "./engine/useGame";
import "./App.css";

type Tab = "gather" | "craft" | "skills" | "log";

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState<Tab>("gather");

  return (
    <div className="app">
      <header className="header">
        <h1>Hearthrise</h1>
        <button className="reset-btn" onClick={game.resetGame}>
          Reset
        </button>
      </header>

      <ResourcePanel state={game.state} />

      {game.state.currentAction && (
        <div className="current-action">
          <div className="current-action-info">
            <span className="current-action-name">
              {game.state.currentAction.type === "gather"
                ? game.availableActions.find(
                    (a) => a.id === game.state.currentAction!.actionId
                  )?.name
                : game.availableRecipes.find(
                    (r) => r.id === game.state.currentAction!.recipeId
                  )?.name}
            </span>
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
            {((game.actionDuration / 1000) * (1 - game.actionProgress)).toFixed(
              1
            )}
            s
          </span>
        </div>
      )}

      <nav className="tabs">
        {(["gather", "craft", "skills", "log"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "gather"
              ? "Gather"
              : t === "craft"
                ? "Craft"
                : t === "skills"
                  ? "Skills"
                  : "Log"}
          </button>
        ))}
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
            recipes={game.availableRecipes}
            state={game.state}
            onCraft={game.startCraft}
            busy={!!game.state.currentAction}
          />
        )}
        {tab === "skills" && <SkillsPanel state={game.state} />}
        {tab === "log" && <LogPanel logs={game.logs} />}
      </main>
    </div>
  );
}
