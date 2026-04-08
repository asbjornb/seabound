import type { RecipeDef } from "./types";

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
    hideWhen: [{ type: "output_no_use" }],
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
    hideWhen: [{ type: "has_building", buildingId: "fiber_loom" }],
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
    repeatable: true,
    xpGain: 15,
  },

  // ═══════════════════════════════════════
  // Pandanus Fiber Processing
  // ═══════════════════════════════════════
  {
    id: "dry_pandanus_leaf",
    name: "Dry Pandanus Leaf",
    description: "Hang pandanus leaves on the drying rack to cure in the sun.",
    skillId: "crafting",
    panel: "craft",
    inputs: [{ resourceId: "pandanus_leaves", amount: 1 }],
    output: { resourceId: "dried_pandanus_leaf", amount: 1 },
    durationMs: 5000,
    requiredBuildings: ["drying_rack"],
    repeatable: true,
    xpGain: 10,
  },
  {
    id: "cut_pandanus_strips",
    name: "Cut Pandanus Strips",
    description: "Slice a dried pandanus leaf into thin, flexible strips.",
    skillId: "crafting",
    panel: "craft",
    inputs: [{ resourceId: "dried_pandanus_leaf", amount: 1 }],
    output: { resourceId: "pandanus_strip", amount: 2 },
    durationMs: 4000,
    requiredTools: ["bamboo_knife"],
    repeatable: true,
    xpGain: 8,
  },
  {
    id: "split_retted_pandanus",
    name: "Split Retted Fiber",
    description: "Pull apart water-softened pandanus into fine, pliable strips. Better yield than cutting dried leaves.",
    skillId: "weaving",
    panel: "craft",
    inputs: [{ resourceId: "retted_pandanus", amount: 1 }],
    output: { resourceId: "pandanus_strip", amount: 3 },
    durationMs: 3000,
    repeatable: true,
    xpGain: 10,
  },
  {
    id: "weave_pandanus_cordage",
    name: "Pandanus Cordage",
    description: "Braid pandanus strips into cordage. Reliable and strong.",
    skillId: "weaving",
    panel: "craft",
    inputs: [{ resourceId: "pandanus_strip", amount: 3 }],
    output: { resourceId: "cordage", amount: 1 },
    durationMs: 5000,
    repeatable: true,
    xpGain: 12,
  },
  {
    id: "twist_rope",
    name: "Twist Rope",
    description: "Twist pandanus strips into strong rope for boats and heavy construction.",
    skillId: "weaving",
    panel: "craft",
    inputs: [{ resourceId: "pandanus_strip", amount: 8 }],
    output: { resourceId: "rope", amount: 1 },
    durationMs: 10000,
    repeatable: true,
    xpGain: 20,
  },
  {
    id: "sew_sail",
    name: "Sew Sail",
    description: "Stitch pandanus strips into a broad sail. The wind awaits.",
    skillId: "weaving",
    panel: "craft",
    inputs: [{ resourceId: "pandanus_strip", amount: 50 }],
    output: { resourceId: "sail", amount: 1 },
    requiredBuildings: ["fiber_loom"],
    durationMs: 30000,
    oneTimeCraft: true,
    xpGain: 60,
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
    requiredSkillLevel: 5,
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
    requiredSkillLevel: 12,
    inputs: [
      { resourceId: "flat_stone", amount: 8 },
      { resourceId: "clay", amount: 4 },
      { resourceId: "cordage", amount: 2 },
    ],
    buildingOutput: "stone_hearth",
    requiredBuildings: ["camp_fire", "firing_pit"],
    durationMs: 12000,
    xpGain: 40,
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
    xpGain: 20,
  },
  {
    id: "build_rock_pool_cache",
    name: "Rock Pool Cache",
    description:
      "Wall off a rocky tidal pool with flat stones. Keeps fish and crabs alive until you need them.",
    skillId: "construction",
    panel: "build",
    inputs: [
      { resourceId: "flat_stone", amount: 6 },
      { resourceId: "driftwood_branch", amount: 2 },
    ],
    buildingOutput: "rock_pool_cache",
    durationMs: 8000,
    xpGain: 20,
  },

  // Comfort tier
  {
    id: "build_sleeping_mat",
    name: "Sleeping Mat",
    description:
      "Layer palm fronds and dry grass into a simple sleeping mat. Better than bare sand.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 4,
    inputs: [
      { resourceId: "palm_frond", amount: 6 },
      { resourceId: "dry_grass", amount: 4 },
    ],
    buildingOutput: "sleeping_mat",
    oneTimeCraft: true,
    durationMs: 6000,
    xpGain: 15,
  },
  {
    id: "build_hammock",
    name: "Hammock",
    description:
      "String a woven fiber hammock between two palms. A proper place to rest.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 7,
    inputs: [
      { resourceId: "cordage", amount: 6 },
      { resourceId: "dried_fiber", amount: 4 },
      { resourceId: "driftwood_branch", amount: 2 },
    ],
    buildingOutput: "hammock",
    replacesBuilding: "sleeping_mat",
    oneTimeCraft: true,
    durationMs: 12000,
    xpGain: 40,
  },
  {
    id: "build_thatched_hut",
    name: "Thatched Hut",
    description:
      "Build a sturdy bamboo-framed hut with a palm-thatch roof. Real shelter at last.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 9,
    inputs: [
      { resourceId: "bamboo_cane", amount: 8 },
      { resourceId: "palm_frond", amount: 10 },
      { resourceId: "cordage", amount: 6 },
      { resourceId: "clay", amount: 4 },
    ],
    buildingOutput: "thatched_hut",
    replacesBuilding: "hammock",
    oneTimeCraft: true,
    durationMs: 20000,
    xpGain: 65,
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
    xpGain: 30,
  },

  {
    id: "build_log_rack",
    name: "Log Rack",
    description:
      "Build an A-frame rack for stacking logs and lumber off the ground.",
    skillId: "construction",
    panel: "build",
    inputs: [
      { resourceId: "driftwood_branch", amount: 4 },
      { resourceId: "cordage", amount: 4 },
      { resourceId: "bamboo_cane", amount: 2 },
    ],
    buildingOutput: "log_rack",
    requiredBuildings: ["fenced_perimeter"],
    durationMs: 10000,
    xpGain: 30,
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
    inputs: [
      { resourceId: "driftwood_branch", amount: 6 },
      { resourceId: "cordage", amount: 8 },
      { resourceId: "bamboo_cane", amount: 4 },
    ],
    buildingOutput: "raft",
    durationMs: 20000,
    oneTimeCraft: true,
    xpGain: 65,
    hideWhen: [{ type: "has_building", buildingId: "dugout" }],
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
    hideWhen: [{ type: "output_no_use" }],
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
    hideWhen: [{ type: "output_no_use" }],
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
    oneTimeCraft: true,
    xpGain: 40,
    hideWhen: [{ type: "has_building", buildingId: "dugout" }],
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
    oneTimeCraft: true,
    xpGain: 40,
    hideWhen: [{ type: "has_building", buildingId: "dugout" }],
  },
  {
    id: "assemble_dugout",
    name: "Assemble Dugout Canoe",
    description:
      "Fit crossbeams and seal the hull. A proper canoe for near-shore waters.",
    skillId: "construction",
    panel: "craft",
    inputs: [
      { resourceId: "shaped_hull", amount: 1 },
      { resourceId: "cordage", amount: 6 },
      { resourceId: "bamboo_cane", amount: 4 },
    ],
    buildingOutput: "dugout",
    durationMs: 20000,
    oneTimeCraft: true,
    xpGain: 75,
  },

  // ═══════════════════════════════════════
  // Maritime — Outrigger Canoe (upgrade from dugout)
  // ═══════════════════════════════════════
  {
    id: "build_outrigger",
    name: "Fit Outrigger & Sail",
    description:
      "Lash a bamboo outrigger float to the dugout and rig a woven sail. Ready for open ocean.",
    skillId: "construction",
    panel: "craft",
    inputs: [
      { resourceId: "sail", amount: 1 },
      { resourceId: "rope", amount: 3 },
      { resourceId: "bamboo_cane", amount: 6 },
    ],
    buildingOutput: "outrigger_canoe",
    replacesBuilding: "dugout",
    durationMs: 25000,
    oneTimeCraft: true,
    xpGain: 100,
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
      { resourceId: "driftwood_branch", amount: 1, alternateResourceId: "charcoal" },
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
      { resourceId: "driftwood_branch", amount: 2, alternateResourceId: "charcoal" },
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
      { resourceId: "driftwood_branch", amount: 1, alternateResourceId: "charcoal" },
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
    xpGain: 45,
  },

  // Building: Kiln (Construction 11)
  {
    id: "build_kiln",
    name: "Kiln",
    description:
      "Build an enclosed clay kiln over the firing pit. Much higher temperatures for advanced pottery.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 11,
    inputs: [
      { resourceId: "clay", amount: 10 },
      { resourceId: "flat_stone", amount: 8 },
      { resourceId: "driftwood_branch", amount: 6 },
      { resourceId: "cordage", amount: 4 },
    ],
    buildingOutput: "kiln",
    requiredBuildings: ["firing_pit"],
    durationMs: 20000,
    xpGain: 75,
  },

  // Building: Pottery Wheel (Crafting 11, requires kiln)
  {
    id: "build_pottery_wheel",
    name: "Pottery Wheel",
    description:
      "Carve a heavy stone disc and mount it on a bamboo axle. Spin clay into shape in half the time.",
    skillId: "crafting",
    panel: "build",
    requiredSkillLevel: 11,
    inputs: [
      { resourceId: "flat_stone", amount: 8 },
      { resourceId: "clay", amount: 6 },
      { resourceId: "bamboo_cane", amount: 4 },
      { resourceId: "cordage", amount: 3 },
    ],
    buildingOutput: "pottery_wheel",
    requiredBuildings: ["firing_pit"],
    durationMs: 15000,
    xpGain: 50,
  },

  // Building: Charcoal Kiln (Construction 14, requires kiln + stone_hearth)
  {
    id: "build_charcoal_kiln",
    name: "Charcoal Kiln",
    description:
      "Build a clay-sealed mound for slow-burning logs into charcoal. An ancient fuel upgrade.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 14,
    inputs: [
      { resourceId: "clay", amount: 8 },
      { resourceId: "flat_stone", amount: 6 },
      { resourceId: "large_log", amount: 2 },
      { resourceId: "cordage", amount: 4 },
    ],
    buildingOutput: "charcoal_kiln",
    requiredBuildings: ["kiln", "stone_hearth"],
    durationMs: 20000,
    xpGain: 75,
  },

  // Building: Charcoal Board (Crafting, requires charcoal_kiln)
  {
    id: "build_charcoal_board",
    name: "Charcoal Board",
    description:
      "Scrawl daily plans on a flat piece of driftwood with charcoal. A simple way to stay organized.",
    skillId: "crafting",
    panel: "build",
    inputs: [
      { resourceId: "driftwood_branch", amount: 2 },
      { resourceId: "charcoal", amount: 1 },
    ],
    buildingOutput: "charcoal_board",
    requiredBuildings: ["charcoal_kiln"],
    durationMs: 8000,
    xpGain: 30,
  },

  // Building: Storage Shelf (Construction 15)
  {
    id: "build_storage_shelf",
    name: "Storage Shelf",
    description:
      "Assemble a bamboo rack and line it with fired pots. A proper place for everything.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 15,
    inputs: [
      { resourceId: "bamboo_cane", amount: 6 },
      { resourceId: "fired_clay_pot", amount: 3 },
      { resourceId: "cordage", amount: 4 },
    ],
    buildingOutput: "storage_shelf",
    requiredBuildings: ["thatched_hut"],
    durationMs: 18000,
    xpGain: 70,
  },

  // Building: Soaking Pit (Weaving 7)
  {
    id: "build_soaking_pit",
    name: "Soaking Pit",
    description:
      "Dig and line a pit with clay for retting pandanus fiber. A technique as old as rope itself.",
    skillId: "construction",
    panel: "build",
    inputs: [
      { resourceId: "clay", amount: 5 },
      { resourceId: "flat_stone", amount: 4 },
      { resourceId: "driftwood_branch", amount: 3 },
    ],
    buildingOutput: "soaking_pit",
    requiredBuildings: ["firing_pit"],
    requiredItems: ["pandanus_strip"],
    durationMs: 10000,
    xpGain: 50,
  },

  // Building: Stone Tidal Weir (Fishing 11)
  {
    id: "build_stone_tidal_weir",
    name: "Stone Tidal Weir",
    description:
      "Stack flat stones into a crescent wall across the shallows. Fish swim in at high tide and can't find their way out.",
    skillId: "fishing",
    panel: "build",
    requiredSkillLevel: 11,
    inputs: [
      { resourceId: "flat_stone", amount: 15 },
      { resourceId: "large_log", amount: 4 },
      { resourceId: "cordage", amount: 6 },
    ],
    buildingOutput: "stone_tidal_weir",
    durationMs: 30000,
    xpGain: 80,
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
    hideWhen: [{ type: "has_building", buildingId: "pottery_wheel" }],
  },
  {
    id: "wheel_shape_clay_pot",
    name: "Wheel-Throw Pot",
    description: "Spin clay on the wheel into an even, thin-walled pot. Much faster than hand-shaping.",
    skillId: "crafting",
    panel: "craft",
    inputs: [{ resourceId: "clay", amount: 3 }],
    output: { resourceId: "shaped_clay_pot", amount: 1 },
    requiredBuildings: ["pottery_wheel"],
    durationMs: 3000,
    repeatable: true,
    xpGain: 15,
  },

  // Fire Clay Pot (requires firing pit → progression-gated)
  {
    id: "fire_clay_pot",
    name: "Fire Clay Pot",
    description: "Fire a shaped pot in the firing pit. About 1 in 7 crack from uneven heat.",
    skillId: "crafting",
    panel: "craft",
    inputs: [
      { resourceId: "shaped_clay_pot", amount: 1 },
      { resourceId: "driftwood_branch", amount: 2, alternateResourceId: "charcoal" },
      { resourceId: "dry_grass", amount: 1, removedByBuilding: "stone_hearth" },
    ],
    output: { resourceId: "fired_clay_pot", amount: 1 },
    outputChance: 0.85,
    requiredBuildings: ["firing_pit"],
    durationMs: 8000,
    repeatable: true,
    xpGain: 20,
    hideWhen: [{ type: "has_building", buildingId: "kiln" }],
  },
  {
    id: "kiln_fire_pot",
    name: "Kiln-Fire Pot",
    description: "Fire pots in the enclosed kiln. Even heat means fewer cracks.",
    skillId: "crafting",
    panel: "craft",
    inputs: [
      { resourceId: "shaped_clay_pot", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1, alternateResourceId: "charcoal" },
    ],
    output: { resourceId: "fired_clay_pot", amount: 1 },
    outputChance: 0.85,
    requiredBuildings: ["kiln"],
    durationMs: 5000,
    repeatable: true,
    xpGain: 20,
  },

  {
    id: "build_clay_storage_jar",
    name: "Clay Storage Jar",
    description:
      "Seal a fired pot with a clay lid. Keeps provisions fresh and critters out.",
    skillId: "crafting",
    panel: "build",
    inputs: [
      { resourceId: "fired_clay_pot", amount: 1 },
      { resourceId: "clay", amount: 1 },
    ],
    buildingOutput: "clay_storage_jar",
    requiredBuildings: ["firing_pit"],
    durationMs: 6000,
    repeatable: true,
    xpGain: 15,
  },

  // Building: Clay Tablet (queue upgrade — requires firing pit + clay)
  {
    id: "build_clay_tablet",
    name: "Clay Tablet",
    description:
      "Press task marks into wet clay and fire it hard. A simple planner to remember what comes next.",
    skillId: "crafting",
    panel: "build",
    inputs: [
      { resourceId: "clay", amount: 4 },
      { resourceId: "flat_stone", amount: 2 },
    ],
    buildingOutput: "clay_tablet",
    requiredBuildings: ["firing_pit"],
    durationMs: 8000,
    xpGain: 25,
  },

  // Fill Water Pot (requires well)
  {
    id: "fill_water_pot",
    name: "Fill Water Pot",
    description:
      "Draw fresh water from the well into a clay pot. Essential for long voyages.",
    skillId: "cooking",
    panel: "craft",
    inputs: [{ resourceId: "fired_clay_pot", amount: 1 }],
    output: { resourceId: "fresh_water", amount: 1 },
    requiredBuildings: ["well"],
    durationMs: 4000,
    repeatable: true,
    noDoubleOutput: true,
    xpGain: 5,
  },

  // Sealed Clay Jar (requires firing pit)
  {
    id: "seal_clay_jar",
    name: "Sealed Clay Jar",
    description:
      "Coat a fired pot with clay slip and re-fire to create an airtight seal. Preserves food for long voyages.",
    skillId: "cooking",
    panel: "craft",
    inputs: [
      { resourceId: "fired_clay_pot", amount: 1 },
      { resourceId: "clay", amount: 2 },
      { resourceId: "driftwood_branch", amount: 2, alternateResourceId: "charcoal" },
      { resourceId: "dry_grass", amount: 1, removedByBuilding: "stone_hearth" },
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
    description: "Dig a stone-lined well to the water table. Provides fresh water for expeditions and farming.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 5,
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
    requiredSkillLevel: 6,
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
    requiredSkillLevel: 8,
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
  // Pandanus Grove (Phase 2 upgrade — replaces farm plot need)
  // ═══════════════════════════════════════
  {
    id: "build_pandanus_grove",
    name: "Pandanus Grove",
    description: "Establish a self-sustaining pandanus grove. No replanting needed — just harvest.",
    skillId: "construction",
    panel: "build",
    requiredSkillLevel: 10,
    requiredSkills: [{ skillId: "farming", level: 7 }],
    inputs: [
      { resourceId: "pandanus_cutting", amount: 2 },
      { resourceId: "flat_stone", amount: 4 },
      { resourceId: "clay", amount: 4 },
      { resourceId: "bamboo_cane", amount: 6 },
      { resourceId: "cordage", amount: 4 },
    ],
    requiredTools: ["digging_stick"],
    requiredBuildings: ["well", "farm_plot"],
    buildingOutput: "pandanus_grove",
    durationMs: 20000,
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
      { resourceId: "driftwood_branch", amount: 1, alternateResourceId: "charcoal" },
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
      { resourceId: "driftwood_branch", amount: 1, alternateResourceId: "charcoal" },
      { resourceId: "dry_grass", amount: 1, removedByBuilding: "stone_hearth" },
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
      { resourceId: "driftwood_branch", amount: 2, alternateResourceId: "charcoal" },
      { resourceId: "dry_grass", amount: 1, removedByBuilding: "stone_hearth" },
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

  // Crucible (Construction 13, requires kiln)
  {
    id: "craft_crucible",
    name: "Crucible",
    description:
      "Shape and kiln-fire a thick-walled vessel capable of withstanding smelting temperatures.",
    skillId: "construction",
    panel: "craft",
    requiredSkillLevel: 13,
    inputs: [
      { resourceId: "clay", amount: 8 },
      { resourceId: "flat_stone", amount: 4 },
      { resourceId: "driftwood_branch", amount: 4, alternateResourceId: "charcoal" },
    ],
    toolOutput: "crucible",
    requiredBuildings: ["kiln"],
    durationMs: 15000,
    oneTimeCraft: true,
    xpGain: 65,
  },

  // ═══════════════════════════════════════
  // MAINLAND — Smithing: Smelting & Forging
  // ═══════════════════════════════════════

  // Era 1: Copper
  {
    id: "smelt_copper",
    name: "Smelt Copper",
    description: "Melt copper ore in the crucible to produce a pure copper ingot.",
    skillId: "smithing",
    panel: "craft",
    inputs: [
      { resourceId: "copper_ore", amount: 2, alternateResourceId: "native_copper" },
      { resourceId: "charcoal", amount: 2 },
    ],
    output: { resourceId: "copper_ingot", amount: 1 },
    requiredTools: ["crucible"],
    requiredBuildings: ["kiln"],
    durationMs: 12000,
    repeatable: true,
    xpGain: 20,
  },

  // Era 2: Bronze
  {
    id: "smelt_bronze",
    name: "Smelt Bronze",
    description: "Combine copper and tin in the crucible to forge a superior alloy.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 8,
    inputs: [
      { resourceId: "copper_ingot", amount: 1 },
      { resourceId: "tin_ore", amount: 2 },
      { resourceId: "charcoal", amount: 3 },
    ],
    output: { resourceId: "bronze_ingot", amount: 1 },
    requiredTools: ["crucible"],
    requiredBuildings: ["kiln"],
    durationMs: 15000,
    repeatable: true,
    xpGain: 35,
  },

  // Era 3: Iron — bloomery process
  {
    id: "smelt_iron_bloom",
    name: "Smelt Iron Bloom",
    description: "Reduce iron ore in the bloomery to produce a spongy mass of crude iron.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 15,
    inputs: [
      { resourceId: "iron_ore", amount: 3 },
      { resourceId: "charcoal", amount: 5 },
    ],
    output: { resourceId: "iron_bloom", amount: 1 },
    requiredBuildings: ["bloomery"],
    durationMs: 20000,
    repeatable: true,
    xpGain: 50,
  },
  {
    id: "hammer_iron_bloom",
    name: "Hammer Iron Bloom",
    description: "Hammer the bloom repeatedly to drive out slag and consolidate the iron.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 17,
    inputs: [
      { resourceId: "iron_bloom", amount: 1 },
      { resourceId: "charcoal", amount: 2 },
    ],
    output: { resourceId: "iron_ingot", amount: 1 },
    requiredBuildings: ["bloomery"],
    durationMs: 15000,
    repeatable: true,
    xpGain: 60,
  },

  // Era 4: Steel — costly late-game
  {
    id: "forge_steel",
    name: "Forge Steel",
    description: "Carburize iron with charcoal at extreme heat. Slow, costly, but the metal is unmatched.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 22,
    inputs: [
      { resourceId: "iron_ingot", amount: 2 },
      { resourceId: "charcoal", amount: 8 },
    ],
    output: { resourceId: "steel_ingot", amount: 1 },
    requiredBuildings: ["bloomery"],
    durationMs: 30000,
    repeatable: true,
    xpGain: 90,
  },

  // ── Tier 0: Improvised Equipment (Island Materials) ──
  // First equipment the player can craft from stockpiled island resources.
  // Available once the player has the right skills and materials — entry into the gear system.

  {
    id: "craft_fire_hardened_spear",
    name: "Fire-Hardened Spear",
    description: "Sharpen a bamboo tip and harden it in the fire. A proper weapon at last.",
    skillId: "crafting",
    panel: "craft",
    requiredSkillLevel: 3,
    inputs: [
      { resourceId: "bamboo_cane", amount: 2 },
      { resourceId: "cordage", amount: 1 },
    ],
    requiredBuildings: ["camp_fire"],
    equipmentOutput: "fire_hardened_spear",
    durationMs: 8000,
    repeatable: true,
    xpGain: 15,
  },
  {
    id: "craft_stone_club",
    name: "Stone Club",
    description: "Lash a heavy stone to a driftwood handle. Blunt but punishing.",
    skillId: "crafting",
    panel: "craft",
    requiredSkillLevel: 3,
    inputs: [
      { resourceId: "flat_stone", amount: 2 },
      { resourceId: "driftwood_branch", amount: 1 },
      { resourceId: "cordage", amount: 1 },
    ],
    equipmentOutput: "stone_club",
    durationMs: 8000,
    repeatable: true,
    xpGain: 15,
  },
  {
    id: "craft_obsidian_dagger",
    name: "Obsidian Dagger",
    description: "Knap a razor-sharp obsidian blade and bind it to a bamboo grip. Fast and deadly, but fragile.",
    skillId: "crafting",
    panel: "craft",
    requiredSkillLevel: 5,
    inputs: [
      { resourceId: "obsidian", amount: 2 },
      { resourceId: "bamboo_splinter", amount: 1 },
      { resourceId: "cordage", amount: 1 },
    ],
    requiredTools: ["obsidian_blade"],
    equipmentOutput: "obsidian_dagger",
    durationMs: 10000,
    repeatable: true,
    xpGain: 20,
  },
  {
    id: "weave_fiber_vest",
    name: "Woven Fiber Vest",
    description: "Weave rough and dried fiber into a basic chest covering. Better than nothing.",
    skillId: "weaving",
    panel: "craft",
    requiredSkillLevel: 3,
    inputs: [
      { resourceId: "rough_fiber", amount: 4 },
      { resourceId: "dried_fiber", amount: 2 },
      { resourceId: "cordage", amount: 1 },
    ],
    equipmentOutput: "woven_fiber_vest",
    durationMs: 10000,
    repeatable: true,
    xpGain: 18,
  },
  {
    id: "craft_bamboo_sandals",
    name: "Bamboo Sandals",
    description: "Split bamboo soles lashed with fiber. Protects feet from rough terrain.",
    skillId: "crafting",
    panel: "craft",
    requiredSkillLevel: 3,
    inputs: [
      { resourceId: "bamboo_cane", amount: 2 },
      { resourceId: "rough_fiber", amount: 2 },
      { resourceId: "cordage", amount: 1 },
    ],
    equipmentOutput: "bamboo_sandals",
    durationMs: 8000,
    repeatable: true,
    xpGain: 15,
  },
  {
    id: "craft_bamboo_buckler",
    name: "Bamboo Buckler",
    description: "Weave bamboo strips into a small round shield. Light and fast to deploy.",
    skillId: "woodworking",
    panel: "craft",
    requiredSkillLevel: 4,
    inputs: [
      { resourceId: "bamboo_cane", amount: 3 },
      { resourceId: "cordage", amount: 2 },
      { resourceId: "rough_fiber", amount: 1 },
    ],
    equipmentOutput: "bamboo_buckler",
    durationMs: 10000,
    repeatable: true,
    xpGain: 18,
  },

  // ── Tier 1: Smithing Equipment (Copper Era) ──
  // Baseline craftable gear — reliable alternatives to broken expedition drops.
  // Copper-era gear requires smithing + copper ingots at the kiln.

  {
    id: "forge_copper_spear",
    name: "Forge Copper Spear",
    description: "Hammer a copper spearhead and bind it to a hardwood shaft. A reliable sidearm for mainland treks.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 3,
    inputs: [
      { resourceId: "copper_ingot", amount: 2 },
      { resourceId: "bamboo_cane", amount: 1 },
      { resourceId: "cordage", amount: 1 },
    ],
    requiredBuildings: ["kiln"],
    equipmentOutput: "copper_spear",
    durationMs: 15000,
    repeatable: true,
    xpGain: 35,
  },
  {
    id: "forge_copper_axe",
    name: "Forge Copper Axe",
    description: "Cast a heavy copper axe head and haft it with hardwood. Slow but devastating.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 5,
    inputs: [
      { resourceId: "copper_ingot", amount: 3 },
      { resourceId: "bamboo_cane", amount: 1 },
      { resourceId: "cordage", amount: 2 },
    ],
    requiredBuildings: ["kiln"],
    equipmentOutput: "copper_axe",
    durationMs: 18000,
    repeatable: true,
    xpGain: 45,
  },
  {
    id: "forge_copper_shield",
    name: "Forge Copper Shield",
    description: "Hammer copper sheets over a wooden frame. Dependable protection for the mainland.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 4,
    inputs: [
      { resourceId: "copper_ingot", amount: 2 },
      { resourceId: "bamboo_cane", amount: 2 },
      { resourceId: "rough_fiber", amount: 3 },
    ],
    requiredBuildings: ["kiln"],
    equipmentOutput: "copper_shield",
    durationMs: 16000,
    repeatable: true,
    xpGain: 40,
  },
  {
    id: "stitch_hide_armor",
    name: "Stitch Hide Armor",
    description: "Layer and stitch dried fibers into a proper chest piece. The first real armor.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 2,
    inputs: [
      { resourceId: "dried_fiber", amount: 6 },
      { resourceId: "cordage", amount: 2 },
      { resourceId: "rough_fiber", amount: 2 },
    ],
    equipmentOutput: "hide_armor",
    durationMs: 12000,
    repeatable: true,
    xpGain: 25,
  },
  {
    id: "stitch_hide_cap",
    name: "Stitch Hide Cap",
    description: "Shape and stitch layered fiber into a fitted cap.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 2,
    inputs: [
      { resourceId: "dried_fiber", amount: 3 },
      { resourceId: "cordage", amount: 1 },
    ],
    equipmentOutput: "hide_cap",
    durationMs: 10000,
    repeatable: true,
    xpGain: 20,
  },
  {
    id: "stitch_hide_leggings",
    name: "Stitch Hide Leggings",
    description: "Fit and stitch fiber panels into leggings. Good mobility with decent protection.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 2,
    inputs: [
      { resourceId: "dried_fiber", amount: 4 },
      { resourceId: "cordage", amount: 1 },
      { resourceId: "rough_fiber", amount: 1 },
    ],
    equipmentOutput: "hide_leggings",
    durationMs: 11000,
    repeatable: true,
    xpGain: 22,
  },
  {
    id: "stitch_hide_boots",
    name: "Stitch Hide Boots",
    description: "Sole and stitch sturdy fiber boots. Ankle support for rough mainland terrain.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 3,
    inputs: [
      { resourceId: "dried_fiber", amount: 3 },
      { resourceId: "cordage", amount: 1 },
      { resourceId: "bamboo_cane", amount: 1 },
    ],
    equipmentOutput: "hide_boots",
    durationMs: 11000,
    repeatable: true,
    xpGain: 22,
  },

  // ── Tier 2: Bronze-Era Equipment ──
  // Mid-mainland gear. Requires smithing + bronze ingots + bloomery.

  {
    id: "forge_bronze_sword",
    name: "Forge Bronze Sword",
    description: "Cast and hammer a leaf-shaped bronze blade. Balanced and sharp — a true weapon.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 10,
    inputs: [
      { resourceId: "bronze_ingot", amount: 3 },
      { resourceId: "bamboo_cane", amount: 1 },
      { resourceId: "cordage", amount: 2 },
    ],
    requiredBuildings: ["bloomery"],
    equipmentOutput: "bronze_sword",
    durationMs: 20000,
    repeatable: true,
    xpGain: 55,
  },
  {
    id: "forge_bronze_shield",
    name: "Forge Bronze Shield",
    description: "Cast a heavy round shield in bronze. Turns aside even determined blows.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 8,
    inputs: [
      { resourceId: "bronze_ingot", amount: 3 },
      { resourceId: "bamboo_cane", amount: 2 },
      { resourceId: "cordage", amount: 2 },
    ],
    requiredBuildings: ["bloomery"],
    equipmentOutput: "bronze_shield",
    durationMs: 18000,
    repeatable: true,
    xpGain: 50,
  },
  {
    id: "forge_bronze_helm",
    name: "Forge Bronze Helm",
    description: "Hammer a close-fitting bronze helmet with cheek guards. Solid head protection.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 8,
    inputs: [
      { resourceId: "bronze_ingot", amount: 2 },
      { resourceId: "dried_fiber", amount: 2 },
    ],
    requiredBuildings: ["bloomery"],
    equipmentOutput: "bronze_helm",
    durationMs: 16000,
    repeatable: true,
    xpGain: 45,
  },
  {
    id: "forge_bronze_cuirass",
    name: "Forge Bronze Cuirass",
    description: "Hammer bronze plates shaped to the torso. Heavy but formidable protection.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 10,
    inputs: [
      { resourceId: "bronze_ingot", amount: 4 },
      { resourceId: "dried_fiber", amount: 3 },
      { resourceId: "cordage", amount: 2 },
    ],
    requiredBuildings: ["bloomery"],
    equipmentOutput: "bronze_cuirass",
    durationMs: 22000,
    repeatable: true,
    xpGain: 60,
  },
  {
    id: "forge_bronze_greaves",
    name: "Forge Bronze Greaves",
    description: "Beat bronze into shin guards. Protects the legs on rough marches.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 8,
    inputs: [
      { resourceId: "bronze_ingot", amount: 2 },
      { resourceId: "dried_fiber", amount: 2 },
      { resourceId: "cordage", amount: 1 },
    ],
    requiredBuildings: ["bloomery"],
    equipmentOutput: "bronze_greaves",
    durationMs: 16000,
    repeatable: true,
    xpGain: 45,
  },
  {
    id: "forge_bronze_boots",
    name: "Forge Bronze-Shod Boots",
    description: "Reinforce leather boots with bronze plates at the toe and heel.",
    skillId: "smithing",
    panel: "craft",
    requiredSkillLevel: 8,
    inputs: [
      { resourceId: "bronze_ingot", amount: 2 },
      { resourceId: "dried_fiber", amount: 3 },
      { resourceId: "cordage", amount: 1 },
    ],
    requiredBuildings: ["bloomery"],
    equipmentOutput: "bronze_boots",
    durationMs: 16000,
    repeatable: true,
    xpGain: 45,
  },

  // Bloomery building recipe
  {
    id: "build_bloomery",
    name: "Bloomery",
    description: "Construct a clay shaft furnace with bellows. Required for iron smelting.",
    skillId: "smithing",
    panel: "build",
    requiredSkillLevel: 12,
    requiredSkills: [{ skillId: "construction", level: 10 }],
    inputs: [
      { resourceId: "clay", amount: 15 },
      { resourceId: "flat_stone", amount: 10 },
      { resourceId: "charcoal", amount: 10 },
      { resourceId: "copper_ingot", amount: 2 },
    ],
    buildingOutput: "bloomery",
    durationMs: 25000,
    oneTimeCraft: true,
    xpGain: 80,
  },
];
