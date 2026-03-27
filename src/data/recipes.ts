import { RecipeDef } from "./types";

export const RECIPES: RecipeDef[] = [
  // ═══════════════════════════════════════
  // PHASE 0 — Bare Hands
  // ═══════════════════════════════════════
  {
    id: "shred_coconut_husk",
    name: "Shred Coconut Husk",
    description: "Pull apart coconut husk by hand into rough fiber.",
    skillId: "crafting",
    panel: "craft",
    inputs: [{ resourceId: "coconut_husk", amount: 1 }],
    output: { resourceId: "rough_fiber", amount: 1 },
    durationMs: 5000,
    repeatable: true,
    xpGain: 6,
  },

  {
    id: "craft_shell_beads",
    name: "Shell Beads",
    description: "Chip and polish shells into decorative beads. Boosts morale.",
    skillId: "crafting",
    panel: "craft",
    inputs: [{ resourceId: "shell", amount: 3 }],
    durationMs: 4000,
    repeatable: true,
    xpGain: 5,
    moraleGain: 2,
  },

  // ═══════════════════════════════════════
  // PHASE 1 — Bamboo Tier: First Tools
  // ═══════════════════════════════════════
  {
    id: "split_bamboo_cane",
    name: "Split Bamboo Cane",
    description: "Split a bamboo cane into sharp splinters.",
    skillId: "woodworking",
    panel: "craft",
    inputs: [{ resourceId: "bamboo_cane", amount: 1 }],
    output: { resourceId: "bamboo_splinter", amount: 2 },
    durationMs: 3000,
    repeatable: true,
    xpGain: 8,
  },
  {
    id: "craft_bamboo_knife",
    name: "Bamboo Knife",
    description:
      "Split and sharpen a bamboo splinter into a cutting blade. The natural fracture makes the edge.",
    skillId: "crafting",
    panel: "craft",
    inputs: [{ resourceId: "bamboo_splinter", amount: 1 }],
    toolOutput: "bamboo_knife",
    durationMs: 3000,
    oneTimeCraft: true,
    xpGain: 8,
  },
  // ═══════════════════════════════════════
  // Fiber & Cordage Chain
  // ═══════════════════════════════════════
  {
    id: "dry_fiber",
    name: "Dry Fiber",
    description: "Hang rough fibers on the drying rack to cure in the sun.",
    skillId: "crafting",
    panel: "craft",
    inputs: [{ resourceId: "rough_fiber", amount: 2 }],
    output: { resourceId: "dried_fiber", amount: 1 },
    durationMs: 5000,
    requiredBuildings: ["drying_rack"],
    repeatable: true,
    xpGain: 10,
  },
  {
    id: "twist_cordage",
    name: "Twist Cordage",
    description: "Twist dried fibers into strong cordage.",
    skillId: "weaving",
    panel: "craft",
    inputs: [{ resourceId: "dried_fiber", amount: 2 }],
    output: { resourceId: "cordage", amount: 1 },
    durationMs: 4000,
    repeatable: true,
    xpGain: 10,
  },
  {
    id: "braid_cordage",
    name: "Braid Cordage",
    description: "Braid fibers on the loom into strong, even cordage.",
    skillId: "weaving",
    panel: "craft",
    inputs: [{ resourceId: "dried_fiber", amount: 2 }],
    output: { resourceId: "cordage", amount: 2 },
    durationMs: 8000,
    requiredBuildings: ["fiber_loom"],
    requiredSkillLevel: 5,
    repeatable: true,
    xpGain: 15,
  },

  // ═══════════════════════════════════════
  // PHASE 1b — Fire Chain
  // ═══════════════════════════════════════
  {
    id: "craft_bow_drill",
    name: "Bow Drill Kit",
    description: "Assemble a friction fire-starting kit.",
    skillId: "crafting",
    panel: "craft",
    inputs: [
      { resourceId: "bamboo_cane", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1 },
      { resourceId: "cordage", amount: 1 },
      { resourceId: "flat_stone", amount: 1 },
    ],
    toolOutput: "bow_drill_kit",
    durationMs: 6000,
    oneTimeCraft: true,
    xpGain: 15,
  },

  // ═══════════════════════════════════════
  // Weaving
  // ═══════════════════════════════════════
  {
    id: "weave_basket",
    name: "Weave Basket",
    description: "Weave palm fronds and cordage into a storage basket. Each basket holds a few extra small items.",
    skillId: "weaving",
    panel: "craft",
    inputs: [
      { resourceId: "palm_frond", amount: 5 },
      { resourceId: "cordage", amount: 3 },
    ],
    buildingOutput: "woven_basket",
    durationMs: 10000,
    repeatable: true,
    xpGain: 15,
  },

  // ═══════════════════════════════════════
  // Construction — Camp Maintenance
  // ═══════════════════════════════════════
  {
    id: "maintain_camp",
    name: "Maintain Camp",
    description:
      "Shore up shelters, re-tie lashings, and patch leaky spots around camp.",
    skillId: "construction",
    panel: "build",
    inputs: [
      { resourceId: "cordage", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1 },
    ],
    durationMs: 30000,
    repeatable: true,
    xpGain: 8,
    moraleGain: 5,
  },

  // ═══════════════════════════════════════
  // Fishing Tools
  // ═══════════════════════════════════════
  {
    id: "craft_gorge_hook",
    name: "Gorge Hook",
    description:
      "Carve a shell into a gorge hook and tie it to cordage. A proper fishing line.",
    skillId: "crafting",
    panel: "craft",
    inputs: [
      { resourceId: "shell", amount: 2 },
      { resourceId: "cordage", amount: 2 },
    ],
    requiredItems: ["stone_flake"],
    toolOutput: "gorge_hook",
    durationMs: 6000,
    requiredSkillLevel: 6,
    oneTimeCraft: true,
    xpGain: 20,
  },
  {
    id: "craft_basket_trap",
    name: "Basket Trap",
    description:
      "Split bamboo razor-thin with an obsidian blade and weave it into a funnel-shaped fish trap.",
    skillId: "weaving",
    panel: "craft",
    inputs: [
      { resourceId: "bamboo_splinter", amount: 4 },
      { resourceId: "cordage", amount: 3 },
    ],
    toolOutput: "basket_trap",
    durationMs: 10000,
    requiredSkillLevel: 6,
    requiredSkills: [{ skillId: "fishing", level: 8 }],
    requiredTools: ["obsidian_blade"],
    oneTimeCraft: true,
    xpGain: 35,
  },

  // ═══════════════════════════════════════
  // Settlement Building Recipes
  // ═══════════════════════════════════════
  {
    id: "build_camp_fire",
    name: "Light Camp Fire",
    description:
      "Use the bow drill kit with tinder to start a fire. A permanent settlement building.",
    skillId: "crafting",
    panel: "build",
    inputs: [
      { resourceId: "coconut_husk", amount: 2 },
      { resourceId: "dry_grass", amount: 2 },
      { resourceId: "driftwood_branch", amount: 3 },
    ],
    buildingOutput: "camp_fire",
    durationMs: 8000,
    requiredTools: ["bow_drill_kit"],
    xpGain: 20,
  },
  {
    id: "build_stone_hearth",
    name: "Stone Hearth",
    description:
      "Line the fire with stones and clay mortar. Holds heat so well it no longer needs kindling.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 14,
    inputs: [
      { resourceId: "flat_stone", amount: 8 },
      { resourceId: "clay", amount: 4 },
      { resourceId: "cordage", amount: 2 },
    ],
    buildingOutput: "stone_hearth",
    requiredBuildings: ["camp_fire", "firing_pit"],
    durationMs: 12000,
    xpGain: 30,
  },
  {
    id: "build_palm_leaf_pile",
    name: "Palm Leaf Pile",
    description:
      "Heap palm fronds together to keep materials off the wet sand.",
    skillId: "construction",
    panel: "build",
    inputs: [
      { resourceId: "palm_frond", amount: 8 },
      { resourceId: "driftwood_branch", amount: 2 },
    ],
    buildingOutput: "palm_leaf_pile",
    durationMs: 5000,
    xpGain: 15,
  },
  {
    id: "build_drying_rack",
    name: "Drying Rack",
    description:
      "Build a bamboo frame for drying fiber, fish, and hides in the sun.",
    skillId: "crafting",
    panel: "build",
    inputs: [
      { resourceId: "bamboo_cane", amount: 4 },
      { resourceId: "palm_frond", amount: 4 },
    ],
    buildingOutput: "drying_rack",
    durationMs: 8000,
    xpGain: 25,
  },

  {
    id: "build_fenced_perimeter",
    name: "Fenced Perimeter",
    description:
      "Build a bamboo fence around camp. More space to store baskets and bulky crafts.",
    skillId: "construction",
    panel: "build",
    inputs: [
      { resourceId: "bamboo_cane", amount: 6 },
      { resourceId: "cordage", amount: 4 },
      { resourceId: "driftwood_branch", amount: 3 },
    ],
    buildingOutput: "fenced_perimeter",
    durationMs: 10000,
    requiredSkillLevel: 2,
    xpGain: 25,
  },

  {
    id: "build_fiber_loom",
    name: "Fiber Loom",
    description:
      "Lash together a simple bamboo frame for braiding fibers into cordage.",
    skillId: "weaving",
    panel: "build",
    inputs: [
      { resourceId: "bamboo_cane", amount: 4 },
      { resourceId: "cordage", amount: 3 },
      { resourceId: "palm_frond", amount: 2 },
    ],
    buildingOutput: "fiber_loom",
    requiredSkillLevel: 4,
    durationMs: 10000,
    xpGain: 30,
  },

  // ═══════════════════════════════════════
  // Maritime — Raft
  // ═══════════════════════════════════════
  {
    id: "build_raft",
    name: "Lash Log Raft",
    description:
      "Lash driftwood logs and bamboo together into a raft. Enough to reach nearby islands.",
    skillId: "construction",
    panel: "craft",
    requiredSkillLevel: 5,
    inputs: [
      { resourceId: "driftwood_branch", amount: 6 },
      { resourceId: "cordage", amount: 8 },
      { resourceId: "bamboo_cane", amount: 4 },
    ],
    buildingOutput: "raft",
    durationMs: 20000,
    oneTimeCraft: true,
    xpGain: 50,
  },

  // ═══════════════════════════════════════
  // Stone Tools — Knapping Chain
  // ═══════════════════════════════════════
  {
    id: "craft_hammerstone",
    name: "Hammerstone",
    description: "Shape a heavy stone for striking. The foundation of knapping.",
    skillId: "crafting",
    panel: "craft",
    inputs: [{ resourceId: "flat_stone", amount: 2 }],
    toolOutput: "hammerstone",
    durationMs: 5000,
    oneTimeCraft: true,
    xpGain: 15,
  },
  {
    id: "strike_stone_flake",
    name: "Strike Stone Flake",
    description:
      "Strike chert with the hammerstone to produce sharp flakes.",
    skillId: "crafting",
    panel: "craft",
    requiredTools: ["hammerstone"],
    inputs: [{ resourceId: "chert", amount: 1 }],
    output: { resourceId: "stone_flake", amount: 2 },
    durationMs: 4000,
    repeatable: true,
    xpGain: 12,
  },
  {
    id: "knap_stone_blade",
    name: "Knap Stone Blade",
    description:
      "Carefully pressure-flake stone flakes into a sharp, usable blade.",
    skillId: "crafting",
    panel: "craft",
    requiredTools: ["hammerstone"],
    inputs: [{ resourceId: "stone_flake", amount: 2 }],
    output: { resourceId: "stone_blade", amount: 1 },
    durationMs: 6000,
    repeatable: true,
    xpGain: 18,
  },
  {
    id: "craft_shell_adze",
    name: "Shell Adze",
    description:
      "Lash a large shell to a driftwood handle. Perfect for scraping and shaping wood.",
    skillId: "crafting",
    panel: "craft",
    inputs: [
      { resourceId: "large_shell", amount: 1 },
      { resourceId: "cordage", amount: 2 },
      { resourceId: "driftwood_branch", amount: 1 },
    ],
    toolOutput: "shell_adze",
    durationMs: 6000,
    oneTimeCraft: true,
    xpGain: 20,
  },
  {
    id: "craft_stone_axe",
    name: "Stone Axe",
    description:
      "Haft a stone blade with cordage to create an axe. Can fell large trees.",
    skillId: "crafting",
    panel: "craft",
    inputs: [
      { resourceId: "stone_blade", amount: 2 },
      { resourceId: "driftwood_branch", amount: 2 },
      { resourceId: "cordage", amount: 3 },
    ],
    toolOutput: "stone_axe",
    durationMs: 10000,
    oneTimeCraft: true,
    xpGain: 35,
  },

  // ═══════════════════════════════════════
  // Maritime — Dugout Canoe (multi-step)
  // ═══════════════════════════════════════
  {
    id: "char_log_interior",
    name: "Char Log Interior",
    description:
      "Burn out the interior of a large log using controlled fire. The first step toward a dugout canoe.",
    skillId: "woodworking",
    panel: "craft",
    requiredBuildings: ["camp_fire"],
    inputs: [
      { resourceId: "large_log", amount: 1 },
      { resourceId: "dry_grass", amount: 4 },
      { resourceId: "coconut_husk", amount: 4 },
      { resourceId: "driftwood_branch", amount: 4 },
    ],
    output: { resourceId: "charred_log", amount: 1 },
    durationMs: 15000,
    xpGain: 40,
  },
  {
    id: "scrape_hull",
    name: "Scrape Hull",
    description:
      "Use the shell adze to scrape out the charred wood, shaping the canoe hull.",
    skillId: "woodworking",
    panel: "craft",
    requiredTools: ["shell_adze"],
    inputs: [{ resourceId: "charred_log", amount: 1 }],
    output: { resourceId: "shaped_hull", amount: 1 },
    durationMs: 12000,
    xpGain: 40,
  },
  {
    id: "assemble_dugout",
    name: "Assemble Dugout Canoe",
    description:
      "Fit crossbeams and seal the hull. A proper canoe for near-shore waters.",
    skillId: "construction",
    panel: "craft",
    requiredSkillLevel: 8,
    inputs: [
      { resourceId: "shaped_hull", amount: 1 },
      { resourceId: "cordage", amount: 6 },
      { resourceId: "bamboo_cane", amount: 4 },
    ],
    buildingOutput: "dugout",
    durationMs: 20000,
    oneTimeCraft: true,
    xpGain: 60,
  },

  // ═══════════════════════════════════════
  // Obsidian Tools
  // ═══════════════════════════════════════
  {
    id: "knap_obsidian_blade",
    name: "Obsidian Blade",
    description:
      "Carefully knap obsidian into a razor-sharp blade. The best cutting tool before metal.",
    skillId: "crafting",
    panel: "craft",
    requiredItems: ["obsidian"],
    inputs: [
      { resourceId: "obsidian", amount: 2 },
      { resourceId: "flat_stone", amount: 1 },
    ],
    toolOutput: "obsidian_blade",
    durationMs: 8000,
    oneTimeCraft: true,
    xpGain: 25,
  },

  // ═══════════════════════════════════════
  // Fire-dependent recipes (require camp_fire building)
  // ═══════════════════════════════════════
  {
    id: "craft_bamboo_spear",
    name: "Bamboo Spear",
    description: "Whittle a bamboo tip with your knife, then fire-harden it into a spear.",
    skillId: "crafting",
    panel: "craft",
    inputs: [{ resourceId: "bamboo_cane", amount: 2 }],
    toolOutput: "bamboo_spear",
    requiredTools: ["bamboo_knife"],
    requiredBuildings: ["camp_fire"],
    durationMs: 5000,
    oneTimeCraft: true,
    xpGain: 12,
  },
  // ═══════════════════════════════════════
  // Cooking (requires camp_fire building)
  // ═══════════════════════════════════════
  {
    id: "cook_fish",
    name: "Cook Fish",
    description: "Grill fish over the campfire using driftwood as fuel.",
    skillId: "cooking",
    panel: "craft",
    inputs: [
      { resourceId: "small_fish", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1 },
      { resourceId: "dry_grass", amount: 1, removedByBuilding: "stone_hearth" },
    ],
    output: { resourceId: "cooked_fish", amount: 1 },
    requiredBuildings: ["camp_fire"],
    durationMs: 3000,
    repeatable: true,
    xpGain: 5,
  },
  {
    id: "cook_large_fish",
    name: "Cook Large Fish",
    description: "Grill a large fish over the campfire. Needs extra fuel.",
    skillId: "cooking",
    panel: "craft",
    requiredSkillLevel: 4,
    inputs: [
      { resourceId: "large_fish", amount: 1 },
      { resourceId: "driftwood_branch", amount: 2 },
      { resourceId: "dry_grass", amount: 1, removedByBuilding: "stone_hearth" },
    ],
    output: { resourceId: "cooked_large_fish", amount: 1 },
    requiredBuildings: ["camp_fire"],
    durationMs: 5000,
    repeatable: true,
    xpGain: 10,
  },
  {
    id: "cook_crab",
    name: "Cook Crab",
    description: "Roast crab over the fire using driftwood as fuel.",
    skillId: "cooking",
    panel: "craft",
    requiredSkillLevel: 2,
    inputs: [
      { resourceId: "crab", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1 },
      { resourceId: "dry_grass", amount: 1, removedByBuilding: "stone_hearth" },
    ],
    output: { resourceId: "cooked_crab", amount: 1 },
    requiredBuildings: ["camp_fire"],
    durationMs: 3000,
    repeatable: true,
    xpGain: 5,
  },

  // ═══════════════════════════════════════
  // PHASE 2 — Clay & Pottery
  // ═══════════════════════════════════════

  // Building: Firing Pit (requires clay → progression-gated)
  {
    id: "build_firing_pit",
    name: "Firing Pit",
    description:
      "Dig a pit and line it with stones. Reaches temperatures high enough to fire clay.",
    skillId: "construction",
    panel: "build",
    inputs: [
      { resourceId: "flat_stone", amount: 6 },
      { resourceId: "driftwood_branch", amount: 4 },
      { resourceId: "clay", amount: 3 },
    ],
    buildingOutput: "firing_pit",
    durationMs: 12000,
    xpGain: 35,
  },

  // Building: Kiln (Construction 25 + Crafting 20)
  {
    id: "build_kiln",
    name: "Kiln",
    description:
      "Build an enclosed clay kiln over the firing pit. Much higher temperatures for advanced pottery.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 10,
    inputs: [
      { resourceId: "clay", amount: 10 },
      { resourceId: "flat_stone", amount: 8 },
      { resourceId: "driftwood_branch", amount: 6 },
      { resourceId: "cordage", amount: 4 },
    ],
    buildingOutput: "kiln",
    requiredBuildings: ["firing_pit"],
    durationMs: 20000,
    xpGain: 60,
  },

  // Shape Clay Pot (unlocks when clay is found)
  {
    id: "shape_clay_pot",
    name: "Shape Clay Pot",
    description: "Hand-shape wet clay into a pot. Must be fired to harden.",
    skillId: "crafting",
    panel: "craft",
    requiredItems: ["clay"],
    inputs: [{ resourceId: "clay", amount: 3 }],
    output: { resourceId: "shaped_clay_pot", amount: 1 },
    durationMs: 6000,
    repeatable: true,
    xpGain: 15,
  },

  // Fire Clay Pot (requires firing pit → progression-gated)
  {
    id: "fire_clay_pot",
    name: "Fire Clay Pot",
    description: "Fire a shaped pot in the firing pit to harden it.",
    skillId: "crafting",
    panel: "craft",
    inputs: [
      { resourceId: "shaped_clay_pot", amount: 1 },
      { resourceId: "driftwood_branch", amount: 2 },
    ],
    output: { resourceId: "fired_clay_pot", amount: 1 },
    requiredBuildings: ["firing_pit"],
    durationMs: 8000,
    repeatable: true,
    xpGain: 20,
  },

  // Sealed Clay Jar (Cooking 12, requires firing pit)
  {
    id: "seal_clay_jar",
    name: "Sealed Clay Jar",
    description:
      "Coat a fired pot with clay slip and re-fire to create an airtight seal. Preserves food for long voyages.",
    skillId: "cooking",
    panel: "craft",
    requiredSkillLevel: 12,
    inputs: [
      { resourceId: "fired_clay_pot", amount: 1 },
      { resourceId: "clay", amount: 2 },
      { resourceId: "driftwood_branch", amount: 2 },
    ],
    output: { resourceId: "sealed_clay_jar", amount: 1 },
    requiredBuildings: ["firing_pit"],
    durationMs: 10000,
    repeatable: true,
    xpGain: 30,
  },

  // ═══════════════════════════════════════
  // Farming — Digging Stick & Plots
  // ═══════════════════════════════════════
  {
    id: "craft_digging_stick",
    name: "Digging Stick",
    description: "Fire-harden a bamboo tip into a sturdy digging tool. Essential for farming.",
    skillId: "crafting",
    panel: "craft",
    inputs: [
      { resourceId: "bamboo_cane", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1 },
    ],
    toolOutput: "digging_stick",
    requiredBuildings: ["camp_fire"],
    durationMs: 5000,
    oneTimeCraft: true,
    xpGain: 12,
  },
  {
    id: "build_cleared_plot",
    name: "Cleared Plot",
    description: "Clear a patch of ground and border it with stones. One crop slot.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 3,
    inputs: [
      { resourceId: "flat_stone", amount: 3 },
      { resourceId: "driftwood_branch", amount: 2 },
      { resourceId: "cordage", amount: 2 },
    ],
    requiredTools: ["digging_stick"],
    buildingOutput: "cleared_plot",
    durationMs: 10000,
    repeatable: true,
    xpGain: 20,
  },
  {
    id: "build_well",
    name: "Well",
    description: "Dig a stone-lined well to the water table. Provides water for farming.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 6,
    inputs: [
      { resourceId: "flat_stone", amount: 6 },
      { resourceId: "clay", amount: 4 },
      { resourceId: "cordage", amount: 3 },
    ],
    requiredTools: ["digging_stick"],
    buildingOutput: "well",
    durationMs: 15000,
    xpGain: 30,
  },
  {
    id: "upgrade_tended_garden",
    name: "Tended Garden",
    description: "Upgrade a cleared plot with irrigation and stone borders for better crops.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 7,
    inputs: [
      { resourceId: "flat_stone", amount: 4 },
      { resourceId: "bamboo_cane", amount: 4 },
      { resourceId: "cordage", amount: 3 },
      { resourceId: "clay", amount: 2 },
    ],
    requiredTools: ["digging_stick"],
    requiredBuildings: ["cleared_plot", "well"],
    buildingOutput: "tended_garden",
    replacesBuilding: "cleared_plot",
    durationMs: 12000,
    repeatable: true,
    xpGain: 35,
  },
  {
    id: "upgrade_farm_plot",
    name: "Farm Plot",
    description: "Upgrade a tended garden with drainage and enriched soil for the best crops.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 10,
    inputs: [
      { resourceId: "flat_stone", amount: 6 },
      { resourceId: "clay", amount: 6 },
      { resourceId: "bamboo_cane", amount: 4 },
      { resourceId: "cordage", amount: 4 },
    ],
    requiredTools: ["digging_stick"],
    requiredBuildings: ["tended_garden", "firing_pit"],
    buildingOutput: "farm_plot",
    replacesBuilding: "tended_garden",
    durationMs: 18000,
    repeatable: true,
    xpGain: 50,
  },

  // ═══════════════════════════════════════
  // Farming — Cooking Recipes
  // ═══════════════════════════════════════
  {
    id: "cook_root_vegetable",
    name: "Cook Root Vegetable",
    description: "Roast a root vegetable over the fire for a filling meal.",
    skillId: "cooking",
    panel: "craft",
    requiredSkillLevel: 3,
    inputs: [
      { resourceId: "root_vegetable", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1 },
      { resourceId: "dry_grass", amount: 1, removedByBuilding: "stone_hearth" },
    ],
    output: { resourceId: "cooked_root_vegetable", amount: 1 },
    requiredBuildings: ["camp_fire"],
    durationMs: 3000,
    repeatable: true,
    xpGain: 8,
  },
  {
    id: "cook_taro",
    name: "Cook Taro",
    description: "Boil taro root until soft and safe to eat. A hearty staple.",
    skillId: "cooking",
    panel: "craft",
    requiredSkillLevel: 5,
    inputs: [
      { resourceId: "taro_root", amount: 2 },
      { resourceId: "driftwood_branch", amount: 1 },
    ],
    output: { resourceId: "cooked_taro", amount: 2 },
    requiredBuildings: ["camp_fire"],
    durationMs: 5000,
    repeatable: true,
    xpGain: 12,
  },
  {
    id: "roast_breadfruit",
    name: "Roast Breadfruit",
    description: "Roast breadfruit over hot coals. Splits into two hearty portions.",
    skillId: "cooking",
    panel: "craft",
    requiredSkillLevel: 8,
    inputs: [
      { resourceId: "breadfruit", amount: 1 },
      { resourceId: "driftwood_branch", amount: 2 },
    ],
    output: { resourceId: "roasted_breadfruit", amount: 2 },
    requiredBuildings: ["camp_fire"],
    durationMs: 6000,
    repeatable: true,
    xpGain: 18,
  },

  // ═══════════════════════════════════════
  // Voyage Provisions (Cooking)
  // ═══════════════════════════════════════
  {
    id: "pack_voyage_provisions",
    name: "Voyage Provisions",
    description: "Pack preserved food into a sealed jar. Efficient fuel for long voyages.",
    skillId: "cooking",
    panel: "craft",
    inputs: [
      { resourceId: "sealed_clay_jar", amount: 1 },
    ],
    tagInputs: [{ tag: "food", count: 5 }],
    output: { resourceId: "voyage_provisions", amount: 1 },
    requiredBuildings: ["firing_pit"],
    durationMs: 10000,
    repeatable: true,
    xpGain: 25,
  },

  // Crucible (Construction 15, requires kiln)
  {
    id: "craft_crucible",
    name: "Crucible",
    description:
      "Shape and kiln-fire a thick-walled vessel capable of withstanding smelting temperatures.",
    skillId: "construction",
    panel: "craft",
    requiredSkillLevel: 15,
    inputs: [
      { resourceId: "clay", amount: 8 },
      { resourceId: "flat_stone", amount: 4 },
      { resourceId: "driftwood_branch", amount: 4 },
    ],
    toolOutput: "crucible",
    requiredBuildings: ["kiln"],
    durationMs: 15000,
    oneTimeCraft: true,
    xpGain: 50,
  },
];
