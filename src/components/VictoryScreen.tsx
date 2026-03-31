import { useEffect, useState } from "react";
import { GameState } from "../data/types";

interface Props {
  state: GameState;
}

export function VictoryScreen({ state }: Props) {
  const [visible, setVisible] = useState(false);

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

  return (
    <div className={`victory-overlay${visible ? " visible" : ""}`}>
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
      </div>
    </div>
  );
}
