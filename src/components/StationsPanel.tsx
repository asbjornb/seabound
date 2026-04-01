import { getStationInputAmount } from "../data/milestones";
import { getBuildings, getResources, getSkills, getStationById } from "../data/registry";
import type { GameState, StationDef } from "../data/types";
import { getBuildingCount, getResource } from "../engine/gameState";

interface Props {
  availableStations: StationDef[];
  lockedStations: StationDef[];
  state: GameState;
  onDeploy: (station: StationDef) => void;
  onCollect: (index: number) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function StationsPanel({
  availableStations,
  lockedStations,
  state,
  onDeploy,
  onCollect,
}: Props) {
  const now = Date.now();
  const RESOURCES = getResources();
  const BUILDINGS = getBuildings();
  const SKILLS = getSkills();

  // Active stations with their defs
  const activeStations = state.stations.map((placed, index) => {
    const def = getStationById(placed.stationId);
    const readyAt = placed.deployedAt + (def?.durationMs ?? 0);
    const isReady = now >= readyAt;
    const remaining = readyAt - now;
    const progress = def
      ? Math.min(1, (now - placed.deployedAt) / def.durationMs)
      : 1;
    return { placed, def, index, isReady, remaining, progress };
  });

  const readyCount = activeStations.filter((s) => s.isReady).length;

  return (
    <div>
      {/* Active / ready stations */}
      {activeStations.length > 0 && (
        <>
          <div className="section-title">
            Active{readyCount > 0 && ` — ${readyCount} ready!`}
          </div>
          {activeStations.map(({ def, index, isReady, remaining, progress }) => {
            if (!def) return null;
            return (
              <div
                key={index}
                className={`station-card ${isReady ? "station-ready" : ""}`}
                onClick={() => isReady && onCollect(index)}
              >
                <div className="action-card-header">
                  <span className="action-name">{def.name}</span>
                  <span className="action-time">
                    {isReady ? "Ready!" : formatTime(remaining)}
                  </span>
                </div>
                {!isReady && (
                  <div className="progress-bar station-progress">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
                {isReady && (
                  <div className="station-collect-hint">Tap to collect</div>
                )}
                <div className="action-drops">
                  Yields:{" "}
                  {def.yields
                    .filter((d) => (d.chance ?? 1) > 0)
                    .map((d, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        {d.amount}x{" "}
                        {RESOURCES[d.resourceId]?.name ?? d.resourceId}
                        {d.chance != null && d.chance < 1
                          ? ` (${Math.round(d.chance * 100)}%)`
                          : ""}
                      </span>
                    ))}
                </div>
                <div className="action-xp">
                  +{def.xpGain} {def.skillId} XP
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Available stations to deploy */}
      {availableStations.length > 0 && (
        <>
          <div className="section-title">Deploy</div>
          {availableStations.map((station) => {
            let maxDeployed = station.maxDeployed ?? 1;
            if (station.maxDeployedPerBuildings) {
              maxDeployed = station.maxDeployedPerBuildings.reduce(
                (sum, bid) => sum + getBuildingCount(state, bid), 0
              );
            }
            const currentCount = state.stations.filter(
              (s) => s.stationId === station.id
            ).length;
            // Hide stations when all slots are filled
            if (currentCount >= maxDeployed) return null;

            const skillLevel = state.skills[station.skillId]?.level ?? 0;
            const effectiveInputs = station.setupInputs?.map((inp) => ({
              ...inp,
              amount: getStationInputAmount(station.skillId, skillLevel, station.id, inp.resourceId, inp.amount),
            }));
            const canAffordInputs =
              !effectiveInputs ||
              effectiveInputs.every(
                (inp) => getResource(state, inp.resourceId) >= inp.amount
              );

            const disabled = !canAffordInputs;

            return (
              <div
                key={station.id}
                className={`action-card ${disabled ? "disabled" : ""}`}
                onClick={() => !disabled && onDeploy(station)}
              >
                <div className="action-card-header">
                  <span className="action-name">{station.name}</span>
                  <span className="action-time">
                    {formatTime(station.durationMs)}
                    {maxDeployed > 1 &&
                      ` (${currentCount}/${maxDeployed})`}
                  </span>
                </div>
                <div className="action-desc">{station.description}</div>
                {station.maxDeployedPerBuildings && (
                  <div className="station-building-info">
                    Uses:{" "}
                    {station.maxDeployedPerBuildings.map((bid, i) => {
                      const count = getBuildingCount(state, bid);
                      return (
                        <span key={bid}>
                          {i > 0 && ", "}
                          {BUILDINGS[bid]?.name ?? bid}
                          {count > 0 && ` (${count})`}
                        </span>
                      );
                    })}
                  </div>
                )}
                {effectiveInputs && (
                  <div className="recipe-inputs">
                    Needs:{" "}
                    {effectiveInputs.map((inp, i) => {
                      const have = getResource(state, inp.resourceId);
                      const enough = have >= inp.amount;
                      return (
                        <span key={i}>
                          {i > 0 && ", "}
                          <span className={enough ? "has" : "missing"}>
                            {inp.amount}x{" "}
                            {RESOURCES[inp.resourceId]?.name ?? inp.resourceId}{" "}
                            ({have})
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="action-drops">
                  Yields:{" "}
                  {station.yields
                    .filter((d) => (d.chance ?? 1) > 0)
                    .map((d, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        {d.amount}x{" "}
                        {RESOURCES[d.resourceId]?.name ?? d.resourceId}
                        {d.chance != null && d.chance < 1
                          ? ` (${Math.round(d.chance * 100)}%)`
                          : ""}
                      </span>
                    ))}
                </div>
                <div className="action-xp">
                  +{station.xpGain} {station.skillId} XP
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Locked stations — player has the seed/cutting but not the skill level */}
      {lockedStations.length > 0 && (
        <>
          <div className="section-title">Locked</div>
          {lockedStations.map((station) => {
            const skillName = SKILLS[station.skillId]?.name ?? station.skillId;
            return (
              <div key={station.id} className="action-card disabled locked-station">
                <div className="action-card-header">
                  <span className="action-name">{station.name}</span>
                  <span className="action-time locked-level">
                    {skillName} Lv {station.requiredSkillLevel}
                  </span>
                </div>
                <div className="action-desc">{station.description}</div>
                <div className="action-drops">
                  Yields:{" "}
                  {station.yields
                    .filter((d) => (d.chance ?? 1) > 0)
                    .map((d, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        {d.amount}x{" "}
                        {RESOURCES[d.resourceId]?.name ?? d.resourceId}
                        {d.chance != null && d.chance < 1
                          ? ` (${Math.round(d.chance * 100)}%)`
                          : ""}
                      </span>
                    ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {availableStations.length === 0 && lockedStations.length === 0 && activeStations.length === 0 && (
        <div className="empty-message">
          No stations available yet. Craft traps and tools to unlock passive gathering!
        </div>
      )}
    </div>
  );
}
