import { getBiomes } from "../data/registry";

import beachBanner from "../../images/biome-beach/banner.webp";
import coconutGroveBanner from "../../images/biome-coconut-grove/banner.webp";
import rockyShoreBanner from "../../images/biome-rocky-shore/banner.webp";
import bambooGroveBanner from "../../images/biome-bamboo-grove/banner.webp";
import jungleInteriorBanner from "../../images/biome-jungle-interior/banner.webp";
import nearbyIslandBanner from "../../images/biome-nearby-island/banner.webp";

interface Props {
  biomeId: string;
  isCollapsed: boolean;
  actionCount: number;
  onToggle: () => void;
}

const BASE_BIOME_BANNERS: Record<string, string> = {
  beach: beachBanner,
  coconut_grove: coconutGroveBanner,
  rocky_shore: rockyShoreBanner,
  bamboo_grove: bambooGroveBanner,
  jungle_interior: jungleInteriorBanner,
  nearby_island: nearbyIslandBanner,
};

export function BiomeBanner({ biomeId, isCollapsed, actionCount, onToggle }: Props) {
  const biomes = getBiomes();
  const label = biomes[biomeId]?.name ?? biomeId.replace(/_/g, " ");
  const banner = BASE_BIOME_BANNERS[biomeId];

  if (!banner) {
    // Mod biome without a banner — fall back to plain header
    return (
      <div className="biome-banner biome-banner--plain" onClick={onToggle}>
        <span className={`collapse-arrow ${isCollapsed ? "collapsed" : ""}`}>&#9662;</span>
        <span className="biome-banner-label">{label}</span>
        <span className="section-count">{actionCount}</span>
      </div>
    );
  }

  return (
    <div className="biome-banner" onClick={onToggle}>
      <img className="biome-banner-image" src={banner} alt={`${label} biome`} />
      <div className="biome-banner-scrim" />
      <span className={`collapse-arrow biome-banner-arrow ${isCollapsed ? "collapsed" : ""}`}>&#9662;</span>
      <span className="biome-banner-label">{label}</span>
      <span className="biome-banner-count">{actionCount}</span>
    </div>
  );
}
