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
  const hpPercent = entry.playerHpStart > 0 ? Math.round((entry.playerHpEnd / entry.playerHpStart) * 100) : 0;

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
            {entry.totalStages != null && (
              <span style={{ fontWeight: 400, fontSize: "0.85em", marginLeft: 8 }}>
                ({entry.stagesCleared ?? 0}/{entry.totalStages} stages cleared)
              </span>
            )}
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

          {/* Combat summary */}
          {entry.enemyName && (
            <div className="combat-log-section">
              <div className="combat-log-section-title">Combat vs {entry.enemyName}</div>

              {/* HP bars */}
              <div style={{ marginBottom: 6 }}>
                <div className="combat-log-check">
                  <span className="combat-log-check-name">Your HP</span>
                  <span className="combat-log-check-result" style={{ color: entry.playerHpEnd > 0 ? "#2ecc71" : "#e74c3c" }}>
                    {entry.playerHpEnd} / {entry.playerHpStart} ({hpPercent}%)
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, overflow: "hidden", background: "rgba(255,255,255,0.1)", marginBottom: 4 }}>
                  <div style={{
                    width: `${hpPercent}%`,
                    height: "100%",
                    background: hpPercent > 50 ? "#2ecc71" : hpPercent > 0 ? "#f0c040" : "#e74c3c",
                  }} />
                </div>
                <div className="combat-log-check">
                  <span className="combat-log-check-name">Enemy HP</span>
                  <span className="combat-log-check-result" style={{ color: entry.enemyHpEnd <= 0 ? "#2ecc71" : "#e74c3c" }}>
                    {entry.enemyHpEnd <= 0 ? "Defeated" : `${entry.enemyHpEnd} / ${entry.enemyHpStart}`}
                  </span>
                </div>
              </div>

              {/* Combat stats */}
              <div className="combat-log-check">
                <span className="combat-log-check-name">Rounds fought</span>
                <span className="combat-log-check-result">{entry.roundsFought}</span>
              </div>
              <div className="combat-log-check">
                <span className="combat-log-check-name">Damage dealt</span>
                <span className="combat-log-check-result" style={{ color: "#2ecc71" }}>{entry.totalDamageDealt}</span>
              </div>
              <div className="combat-log-check">
                <span className="combat-log-check-name">Damage taken</span>
                <span className="combat-log-check-result" style={{ color: entry.totalDamageTaken > 0 ? "#e74c3c" : "#2ecc71" }}>{entry.totalDamageTaken}</span>
              </div>
              {entry.critsLanded > 0 && (
                <div className="combat-log-check">
                  <span className="combat-log-check-name">Critical hits <span style={{ color: "#f0c040" }}>★</span></span>
                  <span className="combat-log-check-result" style={{ color: "#f0c040" }}>{entry.critsLanded}</span>
                </div>
              )}
              {entry.dodges > 0 && (
                <div className="combat-log-check">
                  <span className="combat-log-check-name">Dodges</span>
                  <span className="combat-log-check-result" style={{ color: "#8bc34a" }}>{entry.dodges}</span>
                </div>
              )}
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
