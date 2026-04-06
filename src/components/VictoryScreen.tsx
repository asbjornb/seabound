import { useEffect, useState } from "react";
import { GameState } from "../data/types";

interface Props {
  state: GameState;
  onContinue: () => void;
  onUnlockMainland: () => void;
}

export function VictoryScreen({ state, onContinue, onUnlockMainland }: Props) {
  const [visible, setVisible] = useState(false);
  const [showMainlandWarning, setShowMainlandWarning] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const skillLevels = Object.values(state.skills).reduce(
    (sum, s) => sum + s.level,
    0
  );
  const biomesFound = state.discoveredBiomes.length;
  const buildingsBuilt = state.buildings.length;

  function handleContinue() {
    if (state.mainlandUnlocked) {
      // Already unlocked, just dismiss
      onContinue();
    } else {
      // Show warning modal first
      setShowMainlandWarning(true);
    }
  }

  function handleConfirmMainland() {
    onUnlockMainland();
    onContinue();
  }

  return (
    <div className={`victory-overlay${visible ? " visible" : ""}`}>
      {showMainlandWarning ? (
        <div className="victory-card">
          <div className="victory-title" style={{ fontSize: "1.3rem" }}>Explore the Mainland?</div>
          <div className="victory-divider" />
          <div className="victory-message">
            Mainland content is <strong>experimental</strong>. Features are
            incomplete and your mainland progress may be reset or deleted in
            future updates.
          </div>
          <div className="victory-message" style={{ marginTop: "0.5rem", fontSize: "0.85rem", opacity: 0.8 }}>
            Your island progression is safe and unaffected.
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "center" }}>
            <button
              className="victory-continue"
              style={{ background: "var(--bg-surface, #2a3a2a)" }}
              onClick={() => setShowMainlandWarning(false)}
            >
              Go Back
            </button>
            <button className="victory-continue" onClick={handleConfirmMainland}>
              Unlock Mainland
            </button>
          </div>
        </div>
      ) : (
        <div className="victory-card">
          <img src="/icons/ui_victory.png" alt="" className="victory-image" width={200} height={200} />
          <div className="victory-title">The Seas Are Yours</div>
          <div className="victory-divider" />
          <div className="victory-message">
            You shaped stone, tamed fire, carved a canoe from a single log, and
            wove a sail from island fiber. The open ocean is no longer a barrier
            — it's a road.
          </div>
          <div className="victory-stats">
            <div className="victory-stat">
              <span className="victory-stat-value">{skillLevels}</span>
              <span className="victory-stat-label">Total skill levels</span>
            </div>
            <div className="victory-stat">
              <span className="victory-stat-value">{biomesFound}</span>
              <span className="victory-stat-label">Biomes discovered</span>
            </div>
            <div className="victory-stat">
              <span className="victory-stat-value">{buildingsBuilt}</span>
              <span className="victory-stat-label">Buildings built</span>
            </div>
          </div>
          <div className="victory-thanks">
            Thanks for playing SeaBound.
          </div>
          <button className="victory-continue" onClick={handleContinue}>
            {state.mainlandUnlocked ? "Continue Playing" : "Keep Playing"}
          </button>
        </div>
      )}
    </div>
  );
}
