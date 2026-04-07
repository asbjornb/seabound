import { BiomeDef } from "./types";

export const BIOMES: Record<string, BiomeDef> = {
  beach: {
    id: "beach",
    name: "Beach",
    order: 0,
    startingBiome: true,
  },
  coconut_grove: {
    id: "coconut_grove",
    name: "Coconut Grove",
    order: 1,
  },
  rocky_shore: {
    id: "rocky_shore",
    name: "Rocky Shore",
    order: 2,
  },
  bamboo_grove: {
    id: "bamboo_grove",
    name: "Bamboo Grove",
    order: 3,
  },
  jungle_interior: {
    id: "jungle_interior",
    name: "Jungle Interior",
    order: 4,
  },
  nearby_island: {
    id: "nearby_island",
    name: "Nearby Island",
    order: 5,
  },

  // Mainland biomes
  coastal_cliffs: {
    id: "coastal_cliffs",
    name: "Coastal Cliffs",
    description: "Eroded sea cliffs with exposed mineral veins. Copper and tin gleam in the rock face.",
    order: 10,
  },
  inland_hills: {
    id: "inland_hills",
    name: "Inland Hills",
    description: "Rolling hills of red earth. Iron-rich deposits lie just beneath the surface.",
    order: 11,
  },
};
