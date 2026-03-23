import { ToolDef } from "./types";

export const TOOLS: Record<string, ToolDef> = {
  // Phase 1 - Bamboo Tier
  bamboo_knife: {
    id: "bamboo_knife",
    name: "Bamboo Knife",
    description: "A sharp bamboo blade. Unlocks new processing actions.",
  },

  // Phase 1b - Fire
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

  // Stone Tools
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

  // Obsidian
  obsidian_blade: {
    id: "obsidian_blade",
    name: "Obsidian Blade",
    description:
      "A razor-sharp knapped obsidian blade. The finest cutting tool before metal.",
    toolFor: {
      actionIds: ["harvest_bamboo", "fell_large_tree"],
      recipeIds: ["split_bamboo_cane", "scrape_hull", "shred_coconut_husk"],
      multiplier: 0.85,
    },
  },

  // Fishing Tools
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

  // Maritime
  raft: {
    id: "raft",
    name: "Log Raft",
    description:
      "A lashed-together log raft. Seaworthy enough to reach nearby islands.",
    tags: ["vessel"],
  },
  dugout: {
    id: "dugout",
    name: "Dugout Canoe",
    description: "A proper canoe carved from a single log. Handles near-shore waters with ease.",
    tags: ["vessel"],
  },

  // Phase 2 - Clay Tier
  crucible: {
    id: "crucible",
    name: "Crucible",
    description:
      "A thick-walled clay vessel that withstands extreme heat. Required for smelting ore.",
  },
};
