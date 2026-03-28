import { BuildingDef } from "./types";

export const BUILDINGS: Record<string, BuildingDef> = {
  camp_fire: {
    id: "camp_fire",
    name: "Camp Fire",
    description:
      "A crackling fire built from a bow drill. Provides cooking, fire-hardening, and warmth.",
    unlocks: "Cooking, fire-hardened tools, smoking (later)",
    storageBonus: [{ tag: "food", amount: 10 }],
  },
  stone_hearth: {
    id: "stone_hearth",
    name: "Stone Hearth",
    description:
      "A ring of stones keeps the fire burning steadily. No more kindling needed for cooking.",
    unlocks: "Removes dry grass kindling requirement from cooking recipes",
    storageBonus: [{ tag: "food", amount: 10 }],
  },
  palm_leaf_pile: {
    id: "palm_leaf_pile",
    name: "Palm Leaf Pile",
    description:
      "A heap of palm fronds to keep materials off the sand. Basic storage.",
    unlocks: "Organized storage for all materials",
    storageBonus: [{ amount: 10 }],
  },
  drying_rack: {
    id: "drying_rack",
    name: "Drying Rack",
    description:
      "A bamboo frame for drying fiber, fish, and hides in the sun.",
    unlocks: "Faster fiber drying, dried fish, cured hide",
    storageBonus: [{ tag: "dried", amount: 10 }],
  },
  fenced_perimeter: {
    id: "fenced_perimeter",
    name: "Fenced Perimeter",
    description:
      "A bamboo fence around camp. Keeps things organized and critters out.",
    unlocks: "More room for baskets and other bulky crafts",
  },
  firing_pit: {
    id: "firing_pit",
    name: "Firing Pit",
    description:
      "A stone-lined pit for firing clay at high temperatures. Enables basic pottery.",
    unlocks: "Fired clay pots, sealed jars",
  },
  kiln: {
    id: "kiln",
    name: "Kiln",
    description:
      "A proper enclosed kiln. Reaches higher temperatures for advanced pottery and eventually smelting.",
    unlocks: "Crucibles, bricks, advanced pottery",
  },
  fiber_loom: {
    id: "fiber_loom",
    name: "Fiber Loom",
    description:
      "A simple bamboo frame for braiding fibers into cordage more efficiently.",
    unlocks: "Braid cordage (also needs Weaving 5) — better fiber-to-cordage ratio",
  },
  raft: {
    id: "raft",
    name: "Log Raft",
    description:
      "A lashed-together log raft. Seaworthy enough to reach nearby islands.",
    unlocks: "Sail to Nearby Island expedition",
    vesselTier: 1,
  },
  dugout: {
    id: "dugout",
    name: "Dugout Canoe",
    description: "A proper canoe carved from a single log. Handles near-shore waters with ease.",
    unlocks: "Voyage by Dugout expedition",
    vesselTier: 2,
  },
  woven_basket: {
    id: "woven_basket",
    name: "Woven Basket",
    description: "A sturdy palm-frond basket. Each basket stores a few extra small items.",
    unlocks: "+1 storage per basket for small non-food items",
    storageBonus: [{ excludeTags: ["food", "large"], amount: 1 }],
    maxCount: 20,
  },
  cleared_plot: {
    id: "cleared_plot",
    name: "Cleared Plot",
    description: "A patch of ground cleared for planting. One crop slot.",
    unlocks: "Plant wild seeds",
    maxCount: 3,
  },
  tended_garden: {
    id: "tended_garden",
    name: "Tended Garden",
    description: "An irrigated, stone-bordered garden plot. Supports real crops.",
    unlocks: "Cultivate taro and other crops",
    maxCount: 3,
  },
  farm_plot: {
    id: "farm_plot",
    name: "Farm Plot",
    description: "A proper farm plot with drainage and enriched soil. Supports all crops.",
    unlocks: "Grow bananas, breadfruit, and advanced crops",
    maxCount: 3,
  },
  well: {
    id: "well",
    name: "Well",
    description: "A stone-lined well dug to the water table. Provides water for farming.",
    unlocks: "Watered farming — required for taro and later crops",
  },
};
