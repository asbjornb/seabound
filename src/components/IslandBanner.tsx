import { GamePhase } from "../engine/phases";

import bareHandsBanner from "../../images/phase-0-bare-hands/banner.webp";
import bambooBanner from "../../images/phase-1-bamboo/banner.webp";
import fireBanner from "../../images/phase-2-fire/banner.webp";
import stoneBanner from "../../images/phase-3-stone-clay/banner.webp";
import maritimeBanner from "../../images/phase-4-maritime/banner.webp";

interface Props {
  phase: GamePhase;
}

const PHASE_BANNERS: Record<GamePhase, string> = {
  bare_hands: bareHandsBanner,
  bamboo: bambooBanner,
  fire: fireBanner,
  stone: stoneBanner,
  maritime: maritimeBanner,
};

const PHASE_LABELS: Record<GamePhase, string> = {
  bare_hands: "Bare Hands",
  bamboo: "Bamboo",
  fire: "Fire",
  stone: "Stone & Clay",
  maritime: "Maritime",
};

export function IslandBanner({ phase }: Props) {
  return (
    <div className={`island-banner phase-${phase}`}>
      <img className="island-banner-image" src={PHASE_BANNERS[phase]} alt={`${PHASE_LABELS[phase]} progression banner`} />
      <div className="island-banner-scrim" />
      <div className="island-phase-label">{PHASE_LABELS[phase]}</div>
    </div>
  );
}
