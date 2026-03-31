import { getPhases } from "../data/registry";

import bareHandsBanner from "../../images/phase-0-bare-hands/banner.webp";
import bambooBanner from "../../images/phase-1-bamboo/banner.webp";
import fireBanner from "../../images/phase-2-fire/banner.webp";
import stoneBanner from "../../images/phase-3-stone-clay/banner.webp";
import maritimeBanner from "../../images/phase-4-maritime/banner.webp";
import voyageBanner from "../../images/phase-5-voyage/banner.webp";

interface Props {
  phase: string;
}

/** Base-game banner images keyed by phase id. Mod phases without a banner get a fallback. */
const BASE_PHASE_BANNERS: Record<string, string> = {
  bare_hands: bareHandsBanner,
  bamboo: bambooBanner,
  fire: fireBanner,
  stone: stoneBanner,
  maritime: maritimeBanner,
  voyage: voyageBanner,
};

export function IslandBanner({ phase }: Props) {
  const phases = getPhases();
  const phaseDef = phases.find((p) => p.id === phase);
  const label = phaseDef?.name ?? phase.replace(/_/g, " ");
  const banner = BASE_PHASE_BANNERS[phase];

  if (!banner) {
    // Mod phase without a banner — show a simple colored bar
    return (
      <div className={`island-banner phase-${phase}`}>
        <div className="island-banner-scrim" />
        <div className="island-phase-label">{label}</div>
      </div>
    );
  }

  return (
    <div className={`island-banner phase-${phase}`}>
      <img className="island-banner-image" src={banner} alt={`${label} progression banner`} />
      <div className="island-banner-scrim" />
      <div className="island-phase-label">{label}</div>
    </div>
  );
}
