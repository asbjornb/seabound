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
      { type: "has_resource", id: "fired_clay_pot" },
    ],
  },
  {
    id: "maritime",
    name: "Maritime",
    tagline: "The horizon opens.",
    order: 4,
    conditions: [
      { type: "has_building", id: "dugout" },
    ],
  },
  {
    id: "voyage",
    name: "Voyage",
    tagline: "The ocean calls. Adventure begins.",
    order: 5,
    conditions: [
      { type: "has_building", id: "outrigger_canoe" },
    ],
  },
];
