import { ResourceDef } from "./types";

export const RESOURCES: Record<string, ResourceDef> = {
  // Phase 0 - Bare Hands (Beach)
  coconut: {
    id: "coconut",
    name: "Coconut",
    description: "A fallen coconut. Food and water source.",
    category: "raw",
  },
  coconut_husk: {
    id: "coconut_husk",
    name: "Coconut Husk",
    description: "Fibrous outer shell. Useful as tinder and fiber.",
    category: "raw",
  },
  driftwood_branch: {
    id: "driftwood_branch",
    name: "Driftwood Branch",
    description: "Sun-bleached wood washed ashore.",
    category: "raw",
  },
  round_stone: {
    id: "round_stone",
    name: "Round Stone",
    description: "A smooth beach stone. Good as a hammerstone.",
    category: "raw",
  },
  flat_stone: {
    id: "flat_stone",
    name: "Flat Stone",
    description: "A flat beach stone. Useful for scraping and grinding.",
    category: "raw",
  },
  vine: {
    id: "vine",
    name: "Vine",
    description: "A tough, flexible vine. Natural lashing material.",
    category: "raw",
  },
  palm_frond: {
    id: "palm_frond",
    name: "Palm Frond",
    description: "A large palm leaf. Shade, weaving, bedding.",
    category: "raw",
  },
  small_fish: {
    id: "small_fish",
    name: "Small Fish",
    description: "A small tidal pool fish. Edible when cooked.",
    category: "food",
  },
  crab: {
    id: "crab",
    name: "Crab",
    description: "A small shore crab. Can be cooked.",
    category: "food",
  },
  shell: {
    id: "shell",
    name: "Shell",
    description: "A sturdy seashell. Tool and craft material.",
    category: "raw",
  },

  // Phase 1 - Bamboo Tier
  bamboo_cane: {
    id: "bamboo_cane",
    name: "Bamboo Cane",
    description: "A full bamboo cane. Versatile building and crafting material.",
    category: "raw",
  },
  bamboo_splinter: {
    id: "bamboo_splinter",
    name: "Bamboo Splinter",
    description: "A split section of bamboo. Sharp and useful.",
    category: "processed",
  },
  bamboo_strip: {
    id: "bamboo_strip",
    name: "Bamboo Strip",
    description: "Thin flexible bamboo strip. Good for weaving.",
    category: "processed",
  },
  rough_fiber: {
    id: "rough_fiber",
    name: "Rough Fiber",
    description: "Fibrous bark stripped from bamboo. Needs processing.",
    category: "raw",
  },
  rough_cordage: {
    id: "rough_cordage",
    name: "Rough Cordage",
    description: "Rolled fiber rope. Crude but functional.",
    category: "processed",
  },
  dried_fiber: {
    id: "dried_fiber",
    name: "Dried Fiber",
    description: "Sun-dried plant fiber, stronger and more pliable.",
    category: "processed",
  },
  cordage: {
    id: "cordage",
    name: "Cordage",
    description:
      "Twisted dried fiber rope. Essential for tools and construction.",
    category: "processed",
  },
  bamboo_knife: {
    id: "bamboo_knife",
    name: "Bamboo Knife",
    description: "A sharp bamboo blade. Unlocks new processing actions.",
    category: "tool",
  },
  shell_scraper: {
    id: "shell_scraper",
    name: "Shell Scraper",
    description: "A shell bound to stone. Good for scraping bark.",
    category: "tool",
  },
  large_shell: {
    id: "large_shell",
    name: "Large Shell",
    description: "A big sturdy shell. Can be shaped into an adze.",
    category: "raw",
  },

  // Phase 1b - Fire
  coconut_husk_fiber: {
    id: "coconut_husk_fiber",
    name: "Coconut Husk Fiber",
    description: "Fine dry tinder shredded from coconut husk.",
    category: "raw",
  },
  dry_grass: {
    id: "dry_grass",
    name: "Dry Grass",
    description: "Crisp, dry grass. Perfect tinder.",
    category: "raw",
  },
  bow_drill_kit: {
    id: "bow_drill_kit",
    name: "Bow Drill Kit",
    description: "A fire-starting kit. Spin to ignite.",
    category: "tool",
  },
  bamboo_spear: {
    id: "bamboo_spear",
    name: "Bamboo Spear",
    description: "A fire-hardened bamboo spear. Good for fishing.",
    category: "tool",
  },
  digging_stick: {
    id: "digging_stick",
    name: "Digging Stick",
    description: "A fire-hardened bamboo stick. Dig clay, till soil.",
    category: "tool",
  },

  // Cooked food
  cooked_fish: {
    id: "cooked_fish",
    name: "Cooked Fish",
    description: "Grilled fish. Nutritious expedition fuel.",
    category: "food",
  },
  cooked_crab: {
    id: "cooked_crab",
    name: "Cooked Crab",
    description: "Roasted crab. Tasty and filling.",
    category: "food",
  },
};
