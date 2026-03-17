import { BuildingDef } from "./types";

export const BUILDINGS: Record<string, BuildingDef> = {
  camp_fire: {
    id: "camp_fire",
    name: "Camp Fire",
    description:
      "A crackling fire built from a bow drill. Provides cooking, fire-hardening, and warmth.",
    unlocks: "Cooking, fire-hardened tools, smoking (later)",
    storageBonus: [{ category: "food", amount: 10 }],
  },
  palm_leaf_pile: {
    id: "palm_leaf_pile",
    name: "Palm Leaf Pile",
    description:
      "A heap of palm fronds to keep materials off the sand. Basic storage.",
    unlocks: "Organized storage for raw materials",
    storageBonus: [{ category: "raw", amount: 20 }],
  },
  drying_rack: {
    id: "drying_rack",
    name: "Drying Rack",
    description:
      "A bamboo frame for drying fiber, fish, and hides in the sun.",
    unlocks: "Faster fiber drying, dried fish, cured hide",
    storageBonus: [{ category: "processed", amount: 20 }],
  },
  fenced_perimeter: {
    id: "fenced_perimeter",
    name: "Fenced Perimeter",
    description:
      "A bamboo fence around camp. Keeps things organized and critters out.",
    unlocks: "More room for baskets and other bulky crafts",
    storageBonus: [{ category: "structure", amount: 10 }],
  },
  firing_pit: {
    id: "firing_pit",
    name: "Firing Pit",
    description:
      "A stone-lined pit for firing clay at high temperatures. Enables basic pottery.",
    unlocks: "Fired clay pots, sealed jars",
    storageBonus: [{ category: "processed", amount: 10 }],
  },
  kiln: {
    id: "kiln",
    name: "Kiln",
    description:
      "A proper enclosed kiln. Reaches higher temperatures for advanced pottery and eventually smelting.",
    unlocks: "Crucibles, bricks, advanced pottery",
    storageBonus: [{ category: "processed", amount: 15 }],
  },
};
