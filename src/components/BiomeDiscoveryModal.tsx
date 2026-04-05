import { useEffect, useState } from "react";
import { getBiomes } from "../data/registry";

import beachBanner from "../../images/biome-beach/banner.webp";
import coconutGroveBanner from "../../images/biome-coconut-grove/banner.webp";
import rockyShoreBanner from "../../images/biome-rocky-shore/banner.webp";
import bambooGroveBanner from "../../images/biome-bamboo-grove/banner.webp";
import jungleInteriorBanner from "../../images/biome-jungle-interior/banner.webp";
import nearbyIslandBanner from "../../images/biome-nearby-island/banner.webp";

const BIOME_BANNERS: Record<string, string> = {
  beach: beachBanner,
  coconut_grove: coconutGroveBanner,
  rocky_shore: rockyShoreBanner,
  bamboo_grove: bambooGroveBanner,
  jungle_interior: jungleInteriorBanner,
  nearby_island: nearbyIslandBanner,
};

interface Props {
  biomeId: string;
  message: string;
  onDismiss: () => void;
}

export function BiomeDiscoveryModal({ biomeId, message, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const biomes = getBiomes();
  const biomeName = biomes[biomeId]?.name ?? biomeId.replace(/_/g, " ");
  const banner = BIOME_BANNERS[biomeId];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 600);
  };

  return (
    <div
      className={`biome-discovery-overlay${visible ? " visible" : ""}${exiting ? " exiting" : ""}`}
      onClick={dismiss}
    >
      <div className="biome-discovery-card">
        {banner && (
          <div className="biome-discovery-image-wrap">
            <img className="biome-discovery-image" src={banner} alt={biomeName} />
            <div className="biome-discovery-image-fade" />
          </div>
        )}
        <div className="biome-discovery-content">
          <div className="biome-discovery-label">New Biome Discovered</div>
          <div className="biome-discovery-name">{biomeName}</div>
          <div className="biome-discovery-divider" />
          <div className="biome-discovery-message">{message}</div>
          <div className="biome-discovery-tap">tap to continue</div>
        </div>
      </div>
    </div>
  );
}
