import { ResourceDef } from "./types";

export const RESOURCES: Record<string, ResourceDef> = {
  // Phase 0 - Bare Hands (Beach)
  coconut: {
    id: "coconut",
    name: "Coconut",
    description: "A fallen coconut. Food and water source.",
    tags: ["food"],
    foodValue: 1,
  },
  coconut_husk: {
    id: "coconut_husk",
    name: "Coconut Husk",
    description: "Fibrous outer shell. Useful as tinder and fiber.",
  },
  driftwood_branch: {
    id: "driftwood_branch",
    name: "Driftwood Branch",
    description: "Sun-bleached wood washed ashore.",
    tags: ["large"],
  },
  flat_stone: {
    id: "flat_stone",
    name: "Flat Stone",
    description: "A flat beach stone. Useful for scraping and grinding.",
  },
  palm_frond: {
    id: "palm_frond",
    name: "Palm Frond",
    description: "A large palm leaf. Shade, weaving, bedding.",
    tags: ["large"],
  },
  small_fish: {
    id: "small_fish",
    name: "Small Fish",
    description: "A small tidal pool fish. Edible when cooked.",
    tags: ["food"],
    foodValue: 1,
  },
  crab: {
    id: "crab",
    name: "Crab",
    description: "A small shore crab. Can be cooked.",
    tags: ["food"],
    foodValue: 1,
  },
  shell: {
    id: "shell",
    name: "Shell",
    description: "A sturdy seashell. Tool and craft material.",
  },

  // Phase 1 - Bamboo Tier
  bamboo_cane: {
    id: "bamboo_cane",
    name: "Bamboo Cane",
    description: "A full bamboo cane. Versatile building and crafting material.",
    tags: ["large"],
  },
  bamboo_splinter: {
    id: "bamboo_splinter",
    name: "Bamboo Splinter",
    description: "A split section of bamboo. Sharp and useful.",
  },
  rough_fiber: {
    id: "rough_fiber",
    name: "Rough Fiber",
    description: "Fibrous bark stripped from bamboo. Needs processing.",
  },
  dried_fiber: {
    id: "dried_fiber",
    name: "Dried Fiber",
    description: "Sun-dried plant fiber, stronger and more pliable.",
    tags: ["dried"],
  },
  cordage: {
    id: "cordage",
    name: "Cordage",
    description:
      "Twisted dried fiber rope. Essential for tools and construction.",
    tags: ["dried"],
  },
  large_shell: {
    id: "large_shell",
    name: "Large Shell",
    description: "A big sturdy shell. Can be shaped into an adze.",
  },

  // Phase 1b - Fire
  dry_grass: {
    id: "dry_grass",
    name: "Dry Grass",
    description: "Crisp, dry grass. Perfect tinder.",
  },

  // Food
  large_fish: {
    id: "large_fish",
    name: "Large Fish",
    description: "A sizable reef fish. Makes a hearty meal when cooked.",
    tags: ["food"],
    foodValue: 2,
  },
  cooked_fish: {
    id: "cooked_fish",
    name: "Cooked Fish",
    description: "Grilled fish. Nutritious expedition fuel.",
    tags: ["food"],
    foodValue: 2,
  },
  cooked_crab: {
    id: "cooked_crab",
    name: "Cooked Crab",
    description: "Roasted crab. Tasty and filling.",
    tags: ["food"],
    foodValue: 2,
  },
  cooked_large_fish: {
    id: "cooked_large_fish",
    name: "Cooked Large Fish",
    description: "A whole grilled fish. Very filling expedition fuel.",
    tags: ["food"],
    foodValue: 4,
  },

  // Seeds & Farming
  wild_seed: {
    id: "wild_seed",
    name: "Wild Seed",
    description: "A small seed found in dry grass. The start of farming.",
  },
  root_vegetable: {
    id: "root_vegetable",
    name: "Root Vegetable",
    description: "A knobby tuber dug up from wild planting. Edible raw, better cooked.",
    tags: ["food"],
    foodValue: 1,
  },
  cooked_root_vegetable: {
    id: "cooked_root_vegetable",
    name: "Cooked Root Vegetable",
    description: "A fire-roasted tuber. Filling and surprisingly tasty.",
    tags: ["food"],
    foodValue: 2,
  },
  taro_corm: {
    id: "taro_corm",
    name: "Taro Corm",
    description: "A starchy root cutting ready for planting. The staple crop of island life.",
  },
  taro_root: {
    id: "taro_root",
    name: "Taro Root",
    description: "A starchy, nutritious root. Must be cooked — raw taro is toxic.",
  },
  cooked_taro: {
    id: "cooked_taro",
    name: "Cooked Taro",
    description: "Boiled taro — starchy, filling, and the backbone of island meals.",
    tags: ["food"],
    foodValue: 3,
  },
  banana_shoot: {
    id: "banana_shoot",
    name: "Banana Shoot",
    description: "A banana plant cutting ready to establish in rich soil.",
  },
  banana: {
    id: "banana",
    name: "Banana",
    description: "A ripe banana. Sweet, filling, and needs no cooking.",
    tags: ["food"],
    foodValue: 2,
  },
  breadfruit_cutting: {
    id: "breadfruit_cutting",
    name: "Breadfruit Cutting",
    description: "A breadfruit tree cutting. Needs rich soil and patient tending.",
  },
  breadfruit: {
    id: "breadfruit",
    name: "Breadfruit",
    description: "A large starchy fruit. Roast it for a hearty, filling meal.",
  },
  roasted_breadfruit: {
    id: "roasted_breadfruit",
    name: "Roasted Breadfruit",
    description: "Thick slices of fire-roasted breadfruit. Extremely filling.",
    tags: ["food"],
    foodValue: 4,
  },
  voyage_provisions: {
    id: "voyage_provisions",
    name: "Voyage Provisions",
    description: "Sealed jars of preserved food. Required for long ocean voyages.",
  },

  // Pandanus Fiber Chain
  pandanus_cutting: {
    id: "pandanus_cutting",
    name: "Pandanus Cutting",
    description: "A pandanus plant cutting from a far island. Ready to plant in rich soil.",
    tags: ["pandanus"],
  },
  pandanus_leaves: {
    id: "pandanus_leaves",
    name: "Pandanus Leaves",
    description: "Long, tough leaves from a pandanus plant. Need drying before use.",
    tags: ["pandanus"],
  },
  dried_pandanus_leaf: {
    id: "dried_pandanus_leaf",
    name: "Dried Pandanus Leaf",
    description: "A sun-dried pandanus leaf. Ready to be cut into strips.",
    tags: ["dried", "pandanus"],
  },
  pandanus_strip: {
    id: "pandanus_strip",
    name: "Pandanus Strip",
    description: "A thin, flexible strip of dried pandanus. Versatile crafting fiber.",
    tags: ["pandanus"],
  },
  rope: {
    id: "rope",
    name: "Rope",
    description: "Strong braided rope made from pandanus strips. Essential for boats and heavy construction.",
  },
  sail: {
    id: "sail",
    name: "Sail",
    description: "A woven pandanus sail. Opens the horizon to distant waters.",
    tags: ["large"],
  },

  retted_pandanus: {
    id: "retted_pandanus",
    name: "Retted Pandanus",
    description: "Water-soaked pandanus fiber. Softened and easy to split into many fine strips.",
    tags: ["pandanus"],
  },

  // Obsidian
  obsidian: {
    id: "obsidian",
    name: "Obsidian",
    description:
      "Sharp, glassy volcanic stone. Excellent for knapping into blades.",
  },

  // Stone Tools
  chert: {
    id: "chert",
    name: "Chert",
    description: "A hard, fine-grained stone. Perfect for knapping into sharp edges.",
  },
  stone_flake: {
    id: "stone_flake",
    name: "Stone Flake",
    description: "A sharp flake struck from chert. Can be refined further.",
  },
  stone_blade: {
    id: "stone_blade",
    name: "Stone Blade",
    description: "A carefully knapped stone blade. Sharp and versatile.",
  },

  // Fuel
  charcoal: {
    id: "charcoal",
    name: "Charcoal",
    description: "Dense black fuel that burns hot and long. Made from slow-burning large logs.",
    tags: ["fuel"],
  },

  // Timber
  large_log: {
    id: "large_log",
    name: "Large Log",
    description: "A felled tree trunk. Heavy and unwieldy, but essential for large construction.",
    tags: ["large"],
  },
  charred_log: {
    id: "charred_log",
    name: "Charred Log",
    description: "A log with its interior burned out. Ready to be scraped into a hull.",
    tags: ["large"],
  },
  shaped_hull: {
    id: "shaped_hull",
    name: "Shaped Hull",
    description: "A scraped-out log hull. Almost a canoe — just needs assembly.",
    tags: ["large"],
  },

  // Water
  fresh_water: {
    id: "fresh_water",
    name: "Fresh Water",
    description: "Clean water collected from a jungle stream. Essential for long voyages.",
    waterValue: 1,
    storageCapGroup: "clay_pot",
  },

  // Phase 2 - Clay Tier
  clay: {
    id: "clay",
    name: "Clay",
    description: "Wet riverbank clay. Can be shaped and fired into useful items.",
  },
  shaped_clay_pot: {
    id: "shaped_clay_pot",
    name: "Shaped Clay Pot",
    description: "A hand-shaped clay pot. Fragile until fired.",
  },
  fired_clay_pot: {
    id: "fired_clay_pot",
    name: "Fired Clay Pot",
    description: "A hardened clay pot. Stores liquids and dry goods.",
    storageCapGroup: "clay_pot",
  },
  sealed_clay_jar: {
    id: "sealed_clay_jar",
    name: "Sealed Clay Jar",
    description:
      "An airtight clay jar. Preserves food for long expeditions and stores seeds.",
  },
};
