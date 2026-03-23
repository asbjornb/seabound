import { ResourceDef } from "./types";

export const RESOURCES: Record<string, ResourceDef> = {
  // Phase 0 - Bare Hands (Beach)
  coconut: {
    id: "coconut",
    name: "Coconut",
    description: "A fallen coconut. Food and water source.",
    tags: ["food"],
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
  },
  crab: {
    id: "crab",
    name: "Crab",
    description: "A small shore crab. Can be cooked.",
    tags: ["food"],
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
  },
  cooked_fish: {
    id: "cooked_fish",
    name: "Cooked Fish",
    description: "Grilled fish. Nutritious expedition fuel.",
    tags: ["food"],
  },
  cooked_crab: {
    id: "cooked_crab",
    name: "Cooked Crab",
    description: "Roasted crab. Tasty and filling.",
    tags: ["food"],
  },
  cooked_large_fish: {
    id: "cooked_large_fish",
    name: "Cooked Large Fish",
    description: "A whole grilled fish. Very filling expedition fuel.",
    tags: ["food"],
  },

  // Seeds
  wild_seed: {
    id: "wild_seed",
    name: "Wild Seed",
    description: "A small seed found in dry grass. The start of farming.",
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
  },
  sealed_clay_jar: {
    id: "sealed_clay_jar",
    name: "Sealed Clay Jar",
    description:
      "An airtight clay jar. Preserves food for long expeditions and stores seeds.",
  },
};
