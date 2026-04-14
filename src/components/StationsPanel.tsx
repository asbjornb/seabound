import { type MouseEvent, useCallback, useLayoutEffect, useRef } from "react";
import { getStationInputAmount } from "../data/milestones";
import { getBiomes, getBuildings, getResources, getSkills, getStationById } from "../data/registry";
import type { GameState, StationDef } from "../data/types";
import { canDeploySharedStation, getBuildingCount, getResource, getSharedSlotInfo } from "../engine/gameState";
import type { FlyupItem } from "./CollectFlyup";

interface Props {
  availableStations: StationDef[];
  lockedStations: StationDef[];
  state: GameState;
  onDeploy: (station: StationDef) => void;
  onCollect: (index: number) => void;
  onCollectAll: () => void;
  onFlyup?: (items: FlyupItem[]) => void;
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
  onCollectAll,
  onFlyup,
}: Props) {
  const now = Date.now();
  const RESOURCES = getResources();
  const BUILDINGS = getBuildings();
  const SKILLS = getSkills();
  const BIOMES = getBiomes();

  const handleCollect = useCallback(
    (index: number, e: MouseEvent) => {
      const placed = state.stations[index];
      const def = placed && getStationById(placed.stationId);
      if (def && onFlyup) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;
        let flyupId = Date.now();
        const items = def.yields
          .filter((d) => (d.chance ?? 1) > 0)
          .map((d) => ({
            id: flyupId++,
            text: `+${d.amount} ${RESOURCES[d.resourceId]?.name ?? d.resourceId}`,
            x,
            y,
          }));
        onFlyup(items);
      }
      onCollect(index);
    },
    [state.stations, onCollect, onFlyup, RESOURCES]
  );

  // Active stations with their defs (exclude chart stations whose biome is already discovered)
  const activeStations = state.stations
    .map((placed, index) => {
      const def = getStationById(placed.stationId);
      const readyAt = placed.deployedAt + (def?.durationMs ?? 0);
      const isReady = now >= readyAt;
      const remaining = readyAt - now;
      const progress = def
        ? Math.min(1, (now - placed.deployedAt) / def.durationMs)
        : 1;
      return { placed, def, index, isReady, remaining, progress };
    })
    .filter(({ def }) => {
      if (!def?.chartBiome) return true;
      return !state.discoveredBiomes.includes(def.chartBiome);
    });

  // Ready stations first, then by remaining time ascending
  const sortedActiveStations = [...activeStations].sort((a, b) => {
    if (a.isReady !== b.isReady) return a.isReady ? -1 : 1;
    return a.remaining - b.remaining;
  });

  const readyCount = activeStations.filter((s) => s.isReady).length;

  // Scroll compensation: when a new station is deployed, the active section
  // grows above the deploy buttons. Adjust the scroll container so the deploy
  // buttons stay in the same viewport position.
  const deployRef = useRef<HTMLDivElement>(null);
  const prevStationCount = useRef(state.stations.length);
  const prevDeployOffsetTop = useRef<number | null>(null);

  // Snapshot the deploy section's offsetTop before each paint
  if (deployRef.current) {
    prevDeployOffsetTop.current = deployRef.current.offsetTop;
  }

  useLayoutEffect(() => {
    const prev = prevStationCount.current;
    prevStationCount.current = state.stations.length;
    if (state.stations.length > prev && deployRef.current && prevDeployOffsetTop.current != null) {
      const scrollContainer = deployRef.current.closest(".panel") as HTMLElement | null;
      if (scrollContainer) {
        const delta = deployRef.current.offsetTop - prevDeployOffsetTop.current;
        if (delta > 0) {
          scrollContainer.scrollTop += delta;
        }
      }
    }
  }, [state.stations.length]);

  return (
    <div>
      {/* Active / ready stations */}
      {activeStations.length > 0 && (
        <>
          <div className="section-title">
            Active{readyCount > 0 && ` — ${readyCount} ready!`}
            {readyCount > 1 && (
              <button className="collect-all-btn" onClick={onCollectAll}>
                Collect all
              </button>
            )}
          </div>
          {sortedActiveStations.map(({ def, index, isReady, remaining, progress }) => {
            if (!def) return null;
            return (
              <div
                key={index}
                className={`station-card ${isReady ? "station-ready" : ""}`}
                onClick={(e) => isReady && handleCollect(index, e)}
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
                {def.chartBiome && !state.discoveredBiomes.includes(def.chartBiome) && (
                  <div style={{ fontStyle: "italic", color: "#f0c040", fontSize: "0.9em", marginTop: 2 }}>
                    Discovering: {BIOMES[def.chartBiome]?.name ?? def.chartBiome} — {Math.round((state.chartProgress[def.chartBiome] ?? 0) * 100)}%
                    {isReady && ` → ${Math.min(100, Math.round(((state.chartProgress[def.chartBiome] ?? 0) + (def.chartIncrement ?? 0)) * 100))}%`}
                  </div>
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
        <div ref={deployRef}>
          <div className="section-title">Deploy</div>
          {(() => {
            const chartStations = availableStations.filter((s) => s.chartBiome);
            const undiscovered = chartStations.filter(
              (s) => !state.discoveredBiomes.includes(s.chartBiome!)
            ).length;
            if (undiscovered > 0) {
              return (
                <div className="action-desc" style={{ fontStyle: "italic", color: "#f0c040", marginBottom: 8 }}>
                  {undiscovered} undiscovered {undiscovered === 1 ? "area" : "areas"} remaining to chart
                </div>
              );
            }
            return null;
          })()}
          {availableStations.map((station) => {
            // Use bipartite matching to check if this station can actually be deployed
            const canDeploy = station.maxDeployedPerBuildings
              ? canDeploySharedStation(station, state.stations, state)
              : (state.stations.filter((s) => s.stationId === station.id).length < (station.maxDeployed ?? 1));
            // Hide stations when all slots are filled
            if (!canDeploy) return null;
            const { used: currentCount, total: maxDeployed } = getSharedSlotInfo(station, state.stations, state);

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
                {station.chartBiome && !state.discoveredBiomes.includes(station.chartBiome) && (
                  <div className="chart-progress-info">
                    <span style={{ fontStyle: "italic", color: "#f0c040" }}>
                      Discovering: {BIOMES[station.chartBiome]?.name ?? station.chartBiome} — {Math.round((state.chartProgress[station.chartBiome] ?? 0) * 100)}%
                    </span>
                    <div className="progress-bar station-progress" style={{ marginTop: 4 }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${(state.chartProgress[station.chartBiome] ?? 0) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
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
        </div>
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
