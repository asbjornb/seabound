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
    utility: "storage",
    size: "large",
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

  // Maritime
  raft: {
    id: "raft",
    name: "Log Raft",
    description:
      "A lashed-together log raft. Seaworthy enough to reach nearby islands.",
    category: "structure",
    size: "large",
  },

  // Obsidian
  obsidian: {
    id: "obsidian",
    name: "Obsidian",
    description:
      "Sharp, glassy volcanic stone. Excellent for knapping into blades.",
    category: "raw",
  },
  obsidian_blade: {
    id: "obsidian_blade",
    name: "Obsidian Blade",
    description:
      "A razor-sharp knapped obsidian blade. The finest cutting tool before metal.",
    category: "tool",
    toolFor: {
      actionIds: ["harvest_bamboo", "fell_large_tree"],
      recipeIds: ["split_bamboo_cane", "scrape_hull", "shred_coconut_husk"],
      multiplier: 0.85,
    },
  },

  // Stone Tools
  chert: {
    id: "chert",
    name: "Chert",
    description: "A hard, fine-grained stone. Perfect for knapping into sharp edges.",
    category: "raw",
  },
  stone_flake: {
    id: "stone_flake",
    name: "Stone Flake",
    description: "A sharp flake struck from chert. Can be refined further.",
    category: "processed",
  },
  stone_blade: {
    id: "stone_blade",
    name: "Stone Blade",
    description: "A carefully knapped stone blade. Sharp and versatile.",
    category: "processed",
  },
  hammerstone: {
    id: "hammerstone",
    name: "Hammerstone",
    description: "A heavy stone shaped for striking. Essential for knapping.",
    category: "tool",
  },
  shell_adze: {
    id: "shell_adze",
    name: "Shell Adze",
    description: "A large shell lashed to a handle. Excellent for scraping and shaping wood.",
    category: "tool",
  },
  stone_axe: {
    id: "stone_axe",
    name: "Stone Axe",
    description: "A ground stone blade hafted with cordage. Can fell large trees.",
    category: "tool",
  },

  // Timber
  large_log: {
    id: "large_log",
    name: "Large Log",
    description: "A felled tree trunk. Heavy and unwieldy, but essential for large construction.",
    category: "raw",
    size: "large",
  },
  charred_log: {
    id: "charred_log",
    name: "Charred Log",
    description: "A log with its interior burned out. Ready to be scraped into a hull.",
    category: "raw",
    size: "large",
  },
  shaped_hull: {
    id: "shaped_hull",
    name: "Shaped Hull",
    description: "A scraped-out log hull. Almost a canoe — just needs assembly.",
    category: "processed",
    size: "large",
  },

  // Maritime - Dugout
  dugout: {
    id: "dugout",
    name: "Dugout Canoe",
    description: "A proper canoe carved from a single log. Handles near-shore waters with ease.",
    category: "structure",
    size: "large",
  },

  // Water
  fresh_water: {
    id: "fresh_water",
    name: "Fresh Water",
    description: "Clean water collected from a jungle stream. Essential for long voyages.",
    category: "processed",
  },

  // Seeds
  wild_seed: {
    id: "wild_seed",
    name: "Wild Seed",
    description: "A small seed found in dry grass. The start of farming.",
    category: "raw",
  },

  // Fishing Tools
  gorge_hook: {
    id: "gorge_hook",
    name: "Gorge Hook",
    description:
      "A carved shell hook tied to cordage. Set a line and wait for a bite.",
    category: "tool",
  },
  basket_trap: {
    id: "basket_trap",
    name: "Basket Trap",
    description:
      "A woven bamboo fish trap. Submerge it and collect the catch later.",
    category: "tool",
    size: "large",
  },

  // Phase 2 - Clay Tier
  clay: {
    id: "clay",
    name: "Clay",
    description: "Wet riverbank clay. Can be shaped and fired into useful items.",
    category: "raw",
  },
  shaped_clay_pot: {
    id: "shaped_clay_pot",
    name: "Shaped Clay Pot",
    description: "A hand-shaped clay pot. Fragile until fired.",
    category: "processed",
  },
  fired_clay_pot: {
    id: "fired_clay_pot",
    name: "Fired Clay Pot",
    description: "A hardened clay pot. Stores liquids and dry goods.",
    category: "processed",
  },
  sealed_clay_jar: {
    id: "sealed_clay_jar",
    name: "Sealed Clay Jar",
    description:
      "An airtight clay jar. Preserves food for long expeditions and stores seeds.",
    category: "processed",
  },
  crucible: {
    id: "crucible",
    name: "Crucible",
    description:
      "A thick-walled clay vessel that withstands extreme heat. Required for smelting ore.",
    category: "tool",
  },
};
