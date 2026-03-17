import { ResourceDef } from "./types";

export const RESOURCES: Record<string, ResourceDef> = {
  // Phase 0 - Bare Hands (Beach)
  coconut: {
    id: "coconut",
    name: "Coconut",
    description: "A fallen coconut. Food and water source.",
    category: "food",
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
    size: "large",
  },
  flat_stone: {
    id: "flat_stone",
    name: "Flat Stone",
    description: "A flat beach stone. Useful for scraping and grinding.",
    category: "raw",
  },
  palm_frond: {
    id: "palm_frond",
    name: "Palm Frond",
    description: "A large palm leaf. Shade, weaving, bedding.",
    category: "raw",
    size: "large",
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

  shell_bead: {
    id: "shell_bead",
    name: "Shell Bead",
    description: "A polished shell bead. Decorative and tradeable.",
    category: "processed",
  },

  // Phase 1 - Bamboo Tier
  bamboo_cane: {
    id: "bamboo_cane",
    name: "Bamboo Cane",
    description: "A full bamboo cane. Versatile building and crafting material.",
    category: "raw",
    size: "large",
  },
  bamboo_splinter: {
    id: "bamboo_splinter",
    name: "Bamboo Splinter",
    description: "A split section of bamboo. Sharp and useful.",
    category: "processed",
  },
  rough_fiber: {
    id: "rough_fiber",
    name: "Rough Fiber",
    description: "Fibrous bark stripped from bamboo. Needs processing.",
    category: "raw",
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
  large_shell: {
    id: "large_shell",
    name: "Large Shell",
    description: "A big sturdy shell. Can be shaped into an adze.",
    category: "raw",
  },

  // Phase 1b - Fire
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
    size: "large",
  },
  // Weaving
  woven_basket: {
    id: "woven_basket",
    name: "Woven Basket",
    description: "A sturdy palm-frond basket. Stores small crafted items and tools.",
    category: "structure",
  },
  large_fish: {
    id: "large_fish",
    name: "Large Fish",
    description: "A sizable reef fish. Makes a hearty meal when cooked.",
    category: "food",
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
  cooked_large_fish: {
    id: "cooked_large_fish",
    name: "Cooked Large Fish",
    description: "A whole grilled fish. Very filling expedition fuel.",
    category: "food",
  },

  // Seeds
  wild_seed: {
    id: "wild_seed",
    name: "Wild Seed",
    description: "A small seed found in dry grass. The start of farming.",
    category: "raw",
  },

  // Phase 2 - Clay Tier
  clay: {
    id: "clay",
    name: "Clay",
    description: "Wet riverbank clay. Can be shaped and fired into useful items.",
    category: "raw",
  },
};
