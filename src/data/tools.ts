import { ToolDef } from "./types";

export const TOOLS: Record<string, ToolDef> = {
  bamboo_knife: {
    id: "bamboo_knife",
    name: "Bamboo Knife",
    description: "A sharp bamboo blade. Speeds up cutting tasks and yields extra fiber.",
    speedBonus: {
      recipeIds: ["shred_coconut_husk", "split_bamboo_cane"],
      multiplier: 0.90,
    },
    outputBonus: {
      recipeIds: ["shred_coconut_husk"],
      chance: 0.30,
    },
  },
  bow_drill_kit: {
    id: "bow_drill_kit",
    name: "Bow Drill Kit",
    description: "A fire-starting kit. Spin to ignite.",
  },
  bamboo_spear: {
    id: "bamboo_spear",
    name: "Bamboo Spear",
    description: "A fire-hardened bamboo spear. Good for fishing.",
  },
  hammerstone: {
    id: "hammerstone",
    name: "Hammerstone",
    description: "A heavy stone shaped for striking. Essential for knapping.",
  },
  shell_adze: {
    id: "shell_adze",
    name: "Shell Adze",
    description: "A large shell lashed to a handle. Excellent for scraping and shaping wood.",
  },
  stone_axe: {
    id: "stone_axe",
    name: "Stone Axe",
    description: "A ground stone blade hafted with cordage. Can fell large trees.",
  },
  obsidian_blade: {
    id: "obsidian_blade",
    name: "Obsidian Blade",
    description:
      "A razor-sharp knapped obsidian blade. The finest cutting tool before metal.",
    speedBonus: {
      actionIds: ["harvest_bamboo", "fell_large_tree"],
      recipeIds: ["split_bamboo_cane", "scrape_hull", "shred_coconut_husk"],
      multiplier: 0.85,
    },
  },
  gorge_hook: {
    id: "gorge_hook",
    name: "Gorge Hook",
    description:
      "A carved shell hook tied to cordage. Set a line and wait for a bite.",
  },
  basket_trap: {
    id: "basket_trap",
    name: "Basket Trap",
    description:
      "A woven bamboo fish trap. Submerge it and collect the catch later.",
  },
  crucible: {
    id: "crucible",
    name: "Crucible",
    description:
      "A thick-walled clay vessel that withstands extreme heat. Required for smelting ore.",
  },
  digging_stick: {
    id: "digging_stick",
    name: "Digging Stick",
    description: "A fire-hardened bamboo digging stick. Essential for farming.",
  },

  // ── Island Woodworking Tools ──

  wooden_pulley: {
    id: "wooden_pulley",
    name: "Wooden Pulley",
    description:
      "A carved hardwood wheel on a bamboo axle. Makes hauling and hoisting much easier during construction.",
    speedBonus: {
      recipeIds: [
        "build_stone_hearth", "build_palm_leaf_pile", "build_rock_pool_cache",
        "build_sleeping_mat", "build_hammock", "build_thatched_hut",
        "build_drying_rack", "build_fenced_perimeter", "build_log_rack",
        "build_fiber_loom", "build_weaving_frame", "build_firing_pit",
        "build_kiln", "build_pottery_wheel", "build_charcoal_kiln",
        "build_soaking_pit", "build_stone_tidal_weir", "build_cleared_plot",
        "build_well", "upgrade_tended_garden", "upgrade_farm_plot",
        "build_pandanus_grove", "build_storage_shelf", "build_cartographers_table",
        "build_bloomery",
      ],
      multiplier: 0.85,
    },
  },
  log_sled: {
    id: "log_sled",
    name: "Log Sled",
    description:
      "Two runners lashed to crossbeams. Dragging logs is faster than carrying them — but felling still takes the real effort.",
    speedBonus: {
      actionIds: ["fell_large_tree"],
      multiplier: 0.90,
    },
  },

  // ── Metal Survival Tools ──

  copper_knife: {
    id: "copper_knife",
    name: "Copper Knife",
    description:
      "A hammered copper blade with a wrapped grip. Holds a cleaner edge than bamboo — fiber and plant processing go noticeably faster.",
    speedBonus: {
      recipeIds: [
        "shred_coconut_husk", "cut_pandanus_strips", "split_bamboo_cane",
        "dry_pandanus_leaf", "split_retted_pandanus",
      ],
      multiplier: 0.80,
    },
  },
  bronze_axe: {
    id: "bronze_axe",
    name: "Bronze Axe",
    description:
      "A cast bronze axe head on a hardwood haft. Bites deep into wood where stone just chips away.",
    speedBonus: {
      actionIds: ["fell_large_tree", "harvest_bamboo"],
      recipeIds: ["char_log_interior", "scrape_hull"],
      multiplier: 0.75,
    },
  },
  iron_pickaxe: {
    id: "iron_pickaxe",
    name: "Iron Pickaxe",
    description:
      "A forged iron pick on a sturdy haft. The first tool hard enough to properly break rock.",
    speedBonus: {
      actionIds: ["prospect_copper", "prospect_tin", "mine_iron"],
      multiplier: 0.80,
    },
  },
  steel_pickaxe: {
    id: "steel_pickaxe",
    name: "Steel Pickaxe",
    description:
      "A tempered steel pick that rings when it strikes stone. Shatters ore veins that iron barely dents.",
    speedBonus: {
      actionIds: ["prospect_copper", "prospect_tin", "mine_iron"],
      multiplier: 0.85,
    },
  },
  steel_knife: {
    id: "steel_knife",
    name: "Steel Knife",
    description:
      "A razor-edged steel blade. Slices through fiber, bark, and hide like nothing before it.",
    speedBonus: {
      recipeIds: [
        "shred_coconut_husk", "cut_pandanus_strips", "split_bamboo_cane",
        "dry_pandanus_leaf", "split_retted_pandanus", "cure_raw_hide",
      ],
      multiplier: 0.80,
    },
  },
};
