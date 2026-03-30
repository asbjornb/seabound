import { PhaseDef } from "./types";

export const PHASES: PhaseDef[] = [
  {
    id: "bare_hands",
    name: "Bare Hands",
    tagline: "Washed ashore. Everything starts here.",
    order: 0,
    conditions: [], // default phase, always matches
  },
  {
    id: "bamboo",
    name: "Bamboo",
    tagline: "The grove provides. Tools take shape.",
    order: 1,
    conditions: [
      { type: "has_biome", id: "bamboo_grove" },
      { type: "has_resource", id: "bamboo_cane" },
      { type: "has_tool", id: "bamboo_knife" },
    ],
  },
  {
    id: "fire",
    name: "Fire",
    tagline: "The night no longer owns you.",
    order: 2,
    conditions: [
      { type: "has_building", id: "camp_fire" },
    ],
  },
  {
    id: "stone",
    name: "Stone & Clay",
    tagline: "The island yields its deeper secrets.",
    order: 3,
    conditions: [
      { type: "has_tool", id: "hammerstone" },
      { type: "has_resource", id: "stone_flake" },
      { type: "has_resource", id: "stone_blade" },
      { type: "has_tool", id: "stone_axe" },
      { type: "has_resource", id: "clay" },
      { type: "has_resource", id: "shaped_clay_pot" },
    ],
  },
  {
    id: "maritime",
    name: "Maritime",
    tagline: "The horizon opens.",
    order: 4,
    conditions: [
      { type: "has_building", id: "raft" },
      { type: "has_building", id: "dugout" },
    ],
  },
  {
    id: "escape",
    name: "Escape",
    tagline: "The open ocean awaits.",
    order: 5,
    conditions: [
      { type: "has_building", id: "outrigger_canoe" },
    ],
  },
];
