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

  const playTime = state.totalPlayTimeMs;
  const hours = Math.floor(playTime / 3_600_000);
  const minutes = Math.floor((playTime % 3_600_000) / 60_000);
  const skillLevels = Object.values(state.skills).reduce(
    (sum, s) => sum + s.level,
    0
  );
  const biomesFound = state.discoveredBiomes.length;
  const buildingsBuilt = state.buildings.length;

  return (
    <div className={`victory-overlay${visible ? " visible" : ""}`}>
      <div className="victory-card">
        <div className="victory-title">You Escaped</div>
        <div className="victory-divider" />
        <div className="victory-message">
          From castaway to seafarer. You shaped stone, tamed fire, carved a
          canoe from a single log, and wove a sail from island fiber. The ocean
          that stranded you became your road home.
        </div>
        <div className="victory-stats">
          <div className="victory-stat">
            <span className="victory-stat-value">
              {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </span>
            <span className="victory-stat-label">Time survived</span>
          </div>
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
