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
    inputs: [{ resourceId: "bamboo_cane", amount: 1 }],
    output: { resourceId: "bamboo_splinter", amount: 2 },
    durationMs: 3000,
    requiredSkillLevel: 1,
    repeatable: true,
    xpGain: 8,
  },
  {
    id: "craft_bamboo_knife",
    name: "Bamboo Knife",
    description:
      "Wrap a bamboo splinter with rough fiber into a cutting blade.",
    skillId: "crafting",
    inputs: [
      { resourceId: "bamboo_splinter", amount: 1 },
      { resourceId: "rough_fiber", amount: 2 },
    ],
    output: { resourceId: "bamboo_knife", amount: 1 },
    durationMs: 4000,
    requiredSkillLevel: 2,
    oneTimeCraft: true,
    xpGain: 12,
  },
  // ═══════════════════════════════════════
  // Fiber & Cordage Chain
  // ═══════════════════════════════════════
  {
    id: "dry_fiber",
    name: "Dry Fiber",
    description: "Hang rough fibers on the drying rack to cure in the sun.",
    skillId: "preservation",
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
    skillId: "crafting",
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
    inputs: [
      { resourceId: "bamboo_cane", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1 },
      { resourceId: "cordage", amount: 1 },
      { resourceId: "flat_stone", amount: 1 },
    ],
    output: { resourceId: "bow_drill_kit", amount: 1 },
    durationMs: 6000,
    requiredSkillLevel: 2,
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
    inputs: [
      { resourceId: "palm_frond", amount: 5 },
      { resourceId: "cordage", amount: 3 },
    ],
    output: { resourceId: "woven_basket", amount: 1 },
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
  // Settlement Building Recipes
  // ═══════════════════════════════════════
  {
    id: "build_camp_fire",
    name: "Light Camp Fire",
    description:
      "Use the bow drill kit with tinder to start a fire. A permanent settlement building.",
    skillId: "crafting",
    inputs: [
      { resourceId: "bow_drill_kit", amount: 1 },
      { resourceId: "coconut_husk", amount: 2 },
      { resourceId: "dry_grass", amount: 2 },
      { resourceId: "driftwood_branch", amount: 3 },
    ],
    output: { resourceId: "bow_drill_kit", amount: 0 }, // placeholder, buildingOutput takes precedence
    buildingOutput: "camp_fire",
    durationMs: 8000,
    requiredSkillLevel: 2,
    xpGain: 20,
  },
  {
    id: "build_palm_leaf_pile",
    name: "Palm Leaf Pile",
    description:
      "Heap palm fronds together to keep materials off the wet sand.",
    skillId: "construction",
    inputs: [
      { resourceId: "palm_frond", amount: 8 },
      { resourceId: "driftwood_branch", amount: 2 },
    ],
    output: { resourceId: "palm_frond", amount: 0 }, // placeholder
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
    inputs: [
      { resourceId: "bamboo_cane", amount: 4 },
      { resourceId: "palm_frond", amount: 4 },
    ],
    output: { resourceId: "bamboo_cane", amount: 0 }, // placeholder
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
    inputs: [
      { resourceId: "bamboo_cane", amount: 6 },
      { resourceId: "cordage", amount: 4 },
      { resourceId: "driftwood_branch", amount: 3 },
    ],
    output: { resourceId: "bamboo_cane", amount: 0 }, // placeholder
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
    inputs: [
      { resourceId: "bamboo_cane", amount: 4 },
      { resourceId: "cordage", amount: 3 },
      { resourceId: "palm_frond", amount: 2 },
    ],
    output: { resourceId: "bamboo_cane", amount: 0 }, // placeholder
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
    requiredSkillLevel: 8,
    inputs: [
      { resourceId: "driftwood_branch", amount: 6 },
      { resourceId: "cordage", amount: 8 },
      { resourceId: "bamboo_cane", amount: 4 },
    ],
    output: { resourceId: "raft", amount: 1 },
    durationMs: 20000,
    oneTimeCraft: true,
    xpGain: 50,
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
    requiredSkillLevel: 8,
    inputs: [
      { resourceId: "obsidian", amount: 2 },
      { resourceId: "flat_stone", amount: 1 },
    ],
    output: { resourceId: "obsidian_blade", amount: 1 },
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
    description: "Fire-harden a bamboo tip into a spear. Requires camp fire.",
    skillId: "crafting",
    inputs: [{ resourceId: "bamboo_cane", amount: 2 }],
    output: { resourceId: "bamboo_spear", amount: 1 },
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
    inputs: [
      { resourceId: "small_fish", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1 },
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
    requiredSkillLevel: 4,
    inputs: [
      { resourceId: "large_fish", amount: 1 },
      { resourceId: "driftwood_branch", amount: 2 },
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
    requiredSkillLevel: 2,
    inputs: [
      { resourceId: "crab", amount: 1 },
      { resourceId: "driftwood_branch", amount: 1 },
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

  // Building: Firing Pit (Construction 12)
  {
    id: "build_firing_pit",
    name: "Firing Pit",
    description:
      "Dig a pit and line it with stones. Reaches temperatures high enough to fire clay.",
    skillId: "construction",
    requiredSkillLevel: 12,
    inputs: [
      { resourceId: "flat_stone", amount: 6 },
      { resourceId: "driftwood_branch", amount: 4 },
      { resourceId: "clay", amount: 3 },
    ],
    output: { resourceId: "flat_stone", amount: 0 }, // placeholder
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
    requiredSkillLevel: 25,
    inputs: [
      { resourceId: "clay", amount: 10 },
      { resourceId: "flat_stone", amount: 8 },
      { resourceId: "driftwood_branch", amount: 6 },
      { resourceId: "cordage", amount: 4 },
    ],
    output: { resourceId: "clay", amount: 0 }, // placeholder
    buildingOutput: "kiln",
    requiredBuildings: ["firing_pit"],
    durationMs: 20000,
    xpGain: 60,
  },

  // Shape Clay Pot (Crafting 8)
  {
    id: "shape_clay_pot",
    name: "Shape Clay Pot",
    description: "Hand-shape wet clay into a pot. Must be fired to harden.",
    skillId: "crafting",
    requiredSkillLevel: 8,
    inputs: [{ resourceId: "clay", amount: 3 }],
    output: { resourceId: "shaped_clay_pot", amount: 1 },
    durationMs: 6000,
    repeatable: true,
    xpGain: 15,
  },

  // Fire Clay Pot (Preservation 8, requires firing pit)
  {
    id: "fire_clay_pot",
    name: "Fire Clay Pot",
    description: "Fire a shaped pot in the firing pit to harden it.",
    skillId: "preservation",
    requiredSkillLevel: 8,
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

  // Sealed Clay Jar (Preservation 15, requires firing pit)
  {
    id: "seal_clay_jar",
    name: "Sealed Clay Jar",
    description:
      "Coat a fired pot with clay slip and re-fire to create an airtight seal. Preserves food for long voyages.",
    skillId: "preservation",
    requiredSkillLevel: 15,
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

  // Crucible (Preservation 30, requires kiln)
  {
    id: "craft_crucible",
    name: "Crucible",
    description:
      "Shape and kiln-fire a thick-walled vessel capable of withstanding smelting temperatures.",
    skillId: "preservation",
    requiredSkillLevel: 30,
    inputs: [
      { resourceId: "clay", amount: 8 },
      { resourceId: "flat_stone", amount: 4 },
      { resourceId: "driftwood_branch", amount: 4 },
    ],
    output: { resourceId: "crucible", amount: 1 },
    requiredBuildings: ["kiln"],
    durationMs: 15000,
    oneTimeCraft: true,
    xpGain: 50,
  },
];
