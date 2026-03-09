import { ResourceDef } from "./types";

export const RESOURCES: Record<string, ResourceDef> = {
  wood: {
    id: "wood",
    name: "Wood",
    description: "Rough logs from felled trees.",
    category: "raw",
  },
  stone: {
    id: "stone",
    name: "Stone",
    description: "Chunks of common stone.",
    category: "raw",
  },
  fiber: {
    id: "fiber",
    name: "Plant Fiber",
    description: "Tough fibers stripped from wild plants.",
    category: "raw",
  },
  clay: {
    id: "clay",
    name: "Clay",
    description: "Soft clay dug from riverbanks.",
    category: "raw",
  },
  flint: {
    id: "flint",
    name: "Flint",
    description: "Sharp-edged stone, useful for tools.",
    category: "raw",
  },
  sticks: {
    id: "sticks",
    name: "Sticks",
    description: "Thin branches, good for handles and kindling.",
    category: "raw",
  },
  berries: {
    id: "berries",
    name: "Berries",
    description: "Wild berries. Mildly nutritious.",
    category: "raw",
  },
  mushrooms: {
    id: "mushrooms",
    name: "Mushrooms",
    description: "Forest mushrooms. Hopefully edible.",
    category: "raw",
  },
  bark: {
    id: "bark",
    name: "Bark",
    description: "Stripped tree bark. Surprisingly versatile.",
    category: "raw",
  },
  dried_fiber: {
    id: "dried_fiber",
    name: "Dried Fiber",
    description: "Sun-dried plant fiber, stronger and more pliable.",
    category: "processed",
  },
  rope: {
    id: "rope",
    name: "Rope",
    description: "Twisted fiber rope. Essential for construction.",
    category: "processed",
  },
  stone_axe: {
    id: "stone_axe",
    name: "Stone Axe",
    description: "A crude axe. Chops wood faster.",
    category: "tool",
  },
  stone_pickaxe: {
    id: "stone_pickaxe",
    name: "Stone Pickaxe",
    description: "A crude pickaxe. Mines stone faster.",
    category: "tool",
  },
  stone_knife: {
    id: "stone_knife",
    name: "Stone Knife",
    description: "A sharp flint blade. Useful for processing.",
    category: "tool",
  },
  clay_pot: {
    id: "clay_pot",
    name: "Clay Pot",
    description: "A fired clay pot. Stores things.",
    category: "processed",
  },
  campfire: {
    id: "campfire",
    name: "Campfire",
    description: "A simple campfire. The first step to civilization.",
    category: "structure",
  },
  wooden_shelter: {
    id: "wooden_shelter",
    name: "Wooden Shelter",
    description: "A rough lean-to. Keeps the rain off.",
    category: "structure",
  },
};
