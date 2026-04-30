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
    unlocks: "+5 max woven baskets, +5 storage for large items",
    maxCountBonuses: [{ buildingId: "woven_basket", amount: 5 }],
    storageBonus: [{ tag: "large", amount: 5 }],
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
  weaving_frame: {
    id: "weaving_frame",
    name: "Weaving Frame",
    description:
      "A large bamboo frame staked into the ground for weaving broad pandanus mats. Much wider than the cordage loom.",
    unlocks: "Sew sail — weave pandanus strips into an ocean-going sail",
  },
  raft: {
    id: "raft",
    name: "Bamboo Raft",
    description:
      "A lashed-together bamboo raft. Seaworthy enough to reach nearby islands.",
    unlocks: "Sail to Nearby Island expedition",
    vesselTier: 1,
  },
  dugout: {
    id: "dugout",
    name: "Dugout Canoe",
    description: "A proper canoe carved from a single log. Handles near-shore waters with ease.",
    unlocks: "Sail to Far Island expedition",
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
    maxCountGroup: "farmland",
  },
  tended_garden: {
    id: "tended_garden",
    name: "Tended Garden",
    description: "An irrigated, stone-bordered garden plot. Supports real crops.",
    unlocks: "Cultivate taro and other crops",
    maxCount: 3,
    maxCountGroup: "farmland",
  },
  farm_plot: {
    id: "farm_plot",
    name: "Farm Plot",
    description: "A proper farm plot with drainage and enriched soil. Supports all crops.",
    unlocks: "Grow bananas, breadfruit, and advanced crops",
    maxCount: 3,
    maxCountGroup: "farmland",
  },
  pandanus_grove: {
    id: "pandanus_grove",
    name: "Pandanus Grove",
    description: "An established grove of pandanus plants. Auto-regrows — just tap to harvest.",
    unlocks: "Harvest pandanus leaves without replanting",
  },
  log_rack: {
    id: "log_rack",
    name: "Log Rack",
    description:
      "A sturdy A-frame rack for leaning logs and lumber against. Keeps them dry and off the ground.",
    unlocks: "+10 storage for large items",
    storageBonus: [{ tag: "large", amount: 10 }],
  },
  clay_storage_jar: {
    id: "clay_storage_jar",
    name: "Clay Storage Jar",
    description:
      "A sealed clay jar for keeping provisions fresh. Critters can't get in.",
    unlocks: "+1 food storage per jar",
    storageBonus: [{ tag: "food", amount: 1 }],
    maxCount: 5,
  },
  storage_shelf: {
    id: "storage_shelf",
    name: "Storage Shelf",
    description:
      "A bamboo shelf lined with clay pots and jars. Keeps supplies tidy and off the ground.",
    unlocks: "Extra storage for small non-food items, +1 action queue slot",
    storageBonus: [{ excludeTags: ["food", "large"], amount: 5 }],
  },
  charcoal_kiln: {
    id: "charcoal_kiln",
    name: "Charcoal Kiln",
    description:
      "A clay-sealed mound for slow-burning logs into charcoal. An ancient fuel upgrade.",
    unlocks: "Charcoal station — bulk fuel from large logs; charcoal replaces driftwood in fire recipes",
    storageBonus: [{ tag: "charcoal", amount: 20 }],
  },
  clay_tablet: {
    id: "clay_tablet",
    name: "Clay Tablet",
    description:
      "A small fired clay slab etched with task marks. Helps you plan what to do next.",
    unlocks: "+1 action queue slot — queue an extra action",
  },
  charcoal_board: {
    id: "charcoal_board",
    name: "Charcoal Board",
    description:
      "A flat piece of driftwood with charcoal-scrawled plans. Writing things down helps you stay organized.",
    unlocks: "+1 action queue slot — plan your work ahead",
  },
  soaking_pit: {
    id: "soaking_pit",
    name: "Soaking Pit",
    description:
      "A clay-lined pit filled with water for retting pandanus fiber. Softens leaves with no active work.",
    unlocks: "Soak pandanus leaves (passive station) — more strips per leaf",
    storageBonus: [{ tag: "pandanus", amount: 5 }],
  },
  pottery_wheel: {
    id: "pottery_wheel",
    name: "Pottery Wheel",
    description:
      "A hand-spun stone wheel for shaping clay. Pots take half the time to form.",
    unlocks: "Wheel-throw pots — halves shaping time",
  },
  sleeping_mat: {
    id: "sleeping_mat",
    name: "Sleeping Mat",
    description:
      "A layered bed of palm fronds and dry grass. Beats sleeping on sand.",
    unlocks: "Comfort — slows morale decay by 20%",
    comfortDecayReduction: 0.2,
  },
  hammock: {
    id: "hammock",
    name: "Hammock",
    description:
      "A woven fiber hammock strung between trees. Proper rest at last.",
    unlocks: "Comfort — slows morale decay by 35%",
    comfortDecayReduction: 0.35,
  },
  thatched_hut: {
    id: "thatched_hut",
    name: "Thatched Hut",
    description:
      "A sturdy shelter with bamboo frame and palm-thatch roof. Shade, warmth, and real comfort.",
    unlocks: "Comfort — slows morale decay by 50%, +5 food storage",
    comfortDecayReduction: 0.5,
    storageBonus: [{ tag: "food", amount: 5 }],
  },
  well: {
    id: "well",
    name: "Well",
    description: "A stone-lined well dug to the water table. Provides fresh water for expeditions and farming.",
    unlocks: "Fresh water for expeditions — also required for taro and later crops",
  },
  outrigger_canoe: {
    id: "outrigger_canoe",
    name: "Outrigger Canoe",
    description:
      "A dugout canoe fitted with a bamboo outrigger and woven sail. Built to cross open ocean.",
    unlocks: "Oceanic Voyage expedition — the way home; +2 action queue slots",
    vesselTier: 3,
  },
  rock_pool_cache: {
    id: "rock_pool_cache",
    name: "Rock Pool Cache",
    description:
      "A stone-walled tidal pool that keeps your catch alive and fresh. An ancient trick.",
    unlocks: "+3 storage for fish, crabs, and shells",
    storageBonus: [{ tag: "tidal", amount: 3 }],
  },
  stone_tidal_weir: {
    id: "stone_tidal_weir",
    name: "Stone Tidal Weir",
    description:
      "A crescent of stacked stones in the shallows. Fish wash in at high tide and can't escape.",
    unlocks: "Harvest tidal weir station — bulk passive fishing",
  },

  // Mainland buildings
  cartographers_table: {
    id: "cartographers_table",
    name: "Cartographer's Table",
    description:
      "A sturdy bamboo table spread with charcoal-marked charts. Better maps mean faster expeditions for any navigator.",
    unlocks: "Charting stations (discover mining biomes without combat), 10% faster navigation expeditions",
    expeditionSpeedBonus: { skillId: "navigation", multiplier: 0.9 },
  },
  bloomery: {
    id: "bloomery",
    name: "Bloomery",
    description:
      "A clay-walled shaft furnace fed by bellows. Hot enough to reduce iron ore into workable bloom.",
    unlocks: "Iron smelting — smelt iron ore into iron bloom",
  },
};
