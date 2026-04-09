import { CombatLogEntry } from "../data/types";
import { CloseIcon } from "./CloseIcon";

const GRADE_LABELS: Record<string, { label: string; color: string }> = {
  success: { label: "Success", color: "#2ecc71" },
  partial: { label: "Partial Success", color: "#f0c040" },
  failure: { label: "Failure", color: "#e74c3c" },
};

export function CombatLogModal({
  entry,
  onClose,
}: {
  entry: CombatLogEntry;
  onClose: () => void;
}) {
  const grade = GRADE_LABELS[entry.grade] ?? { label: entry.grade, color: "var(--text)" };

  return (
    <div className="log-overlay" onClick={onClose}>
      <div className="log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal-header">
          <span className="log-modal-title">{entry.expeditionName}</span>
          <button className="log-modal-close" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="log-modal-body">
          {/* Grade */}
          <div className="combat-log-grade" style={{ color: grade.color }}>
            {grade.label}
          </div>

          {/* Outcome message */}
          {entry.outcomeMessage && (
            <div className="combat-log-outcome">{entry.outcomeMessage}</div>
          )}

          {/* Win rate */}
          {entry.estimatedWinRate != null && (
            <div className="combat-log-win-rate" style={{ color: "var(--text-secondary)", fontSize: "0.85em", marginBottom: 8 }}>
              Estimated win rate: {Math.round(entry.estimatedWinRate * 100)}%
            </div>
          )}

          {/* Stat checks */}
          {entry.checkResults.length > 0 && (
            <div className="combat-log-section">
              <div className="combat-log-section-title">Stat Checks</div>
              {entry.checkResults.map((check, i) => (
                <div key={i} className="combat-log-check">
                  <span className="combat-log-check-name">
                    {check.stat.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                    {check.critted && <span style={{ color: "#f0c040" }} title="Critical hit boosted this check"> ★</span>}
                  </span>
                  <span
                    className="combat-log-check-result"
                    style={{ color: check.passed ? "#2ecc71" : "#e74c3c" }}
                  >
                    {Math.round(check.playerValue)} / {check.threshold}
                    {check.passChance != null && <span style={{ opacity: 0.7 }}> ({Math.round(check.passChance * 100)}%)</span>}
                    {check.passed ? " ✓" : " ✗"}
                  </span>
                </div>
              ))}
              <div className="combat-log-pass-ratio">
                {Math.round(entry.passRatio * 100)}% passed
              </div>
            </div>
          )}

          {/* Drops */}
          {entry.drops.length > 0 && (
            <div className="combat-log-section">
              <div className="combat-log-section-title">Loot</div>
              {entry.drops.map((drop, i) => (
                <div key={i} className="combat-log-drop">
                  {drop.amount}x {drop.name}
                </div>
              ))}
            </div>
          )}

          {/* Loot Drops (rare) */}
          {entry.lootDrops && entry.lootDrops.length > 0 && (
            <div className="combat-log-section">
              <div className="combat-log-section-title">Rare Loot</div>
              {entry.lootDrops.map((loot, i) => {
                const color = loot.rarity === "legendary" ? "#f39c12" : loot.rarity === "epic" ? "#9b59b6" : loot.rarity === "rare" ? "#3498db" : "#2ecc71";
                return (
                  <div key={i} className="combat-log-drop" style={{ color }}>
                    {loot.amount}x {loot.name} <span style={{ fontSize: "0.8em", opacity: 0.8 }}>({loot.rarity})</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Equipment */}
          {entry.equipmentDropped && entry.equipmentDropped.length > 0 && (
            <div className="combat-log-section">
              <div className="combat-log-section-title">Equipment Found</div>
              {entry.equipmentDropped.map((eq, i) => (
                <div key={i} className="combat-log-drop">
                  {eq.name}
                  {eq.condition === "broken" && (
                    <span style={{ color: "#e74c3c" }}> (broken)</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* XP */}
          {entry.xpGain > 0 && (
            <div className="combat-log-section">
              <div className="combat-log-xp">+{entry.xpGain} XP</div>
            </div>
          )}

          {/* Failure insights */}
          {entry.failureInsights.length > 0 && (
            <div className="combat-log-section">
              <div className="combat-log-section-title">Insights</div>
              {entry.failureInsights.map((insight, i) => (
                <div key={i} className="combat-log-insight">
                  {insight}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
