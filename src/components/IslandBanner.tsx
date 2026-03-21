import { GamePhase } from "../engine/phases";
import { BuildingId } from "../data/types";

interface Props {
  phase: GamePhase;
  buildings: BuildingId[];
}

export function IslandBanner({ phase, buildings }: Props) {
  const phaseIndex = ["bare_hands", "bamboo", "fire", "stone", "maritime"].indexOf(phase);

  return (
    <div className={`island-banner phase-${phase}`}>
      {/* Sky */}
      <div className="island-sky" />

      {/* Sun/moon based on phase */}
      <div className={`island-sun phase-sun-${phaseIndex}`} />

      {/* Water */}
      <div className="island-water">
        <div className="island-wave wave-1" />
        <div className="island-wave wave-2" />
      </div>

      {/* Island ground */}
      <div className="island-ground" />

      {/* Beach */}
      <div className="island-beach" />

      {/* Palm tree - always present */}
      <div className="island-palm">
        <div className="palm-trunk" />
        <div className="palm-fronds" />
      </div>

      {/* Phase-dependent elements */}
      {phaseIndex >= 1 && (
        <div className="island-bamboo">
          <div className="bamboo-stalk s1" />
          <div className="bamboo-stalk s2" />
          <div className="bamboo-stalk s3" />
        </div>
      )}

      {phaseIndex >= 2 && (
        <div className="island-fire">
          <div className="fire-base" />
          <div className="fire-flame f1" />
          <div className="fire-flame f2" />
          <div className="fire-flame f3" />
          {buildings.includes("camp_fire") && <div className="fire-smoke" />}
        </div>
      )}

      {phaseIndex >= 3 && (
        <div className="island-stones">
          <div className="stone s1" />
          <div className="stone s2" />
        </div>
      )}

      {buildings.includes("drying_rack") && phaseIndex >= 1 && (
        <div className="island-rack" />
      )}

      {phaseIndex >= 3 && buildings.includes("kiln") && (
        <div className="island-kiln" />
      )}

      {phaseIndex >= 4 && (
        <div className="island-raft">
          <div className="raft-body" />
          <div className="raft-mast" />
        </div>
      )}

      {/* Phase label */}
      <div className="island-phase-label">{
        ["Bare Hands", "Bamboo", "Fire", "Stone & Clay", "Maritime"][phaseIndex]
      }</div>
    </div>
  );
}
