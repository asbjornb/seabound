#!/usr/bin/env npx tsx
/**
 * Progression Graph Builder
 *
 * Extracts the full dependency graph from game data and runs analysis.
 * Outputs src/data/progression-graph.json — a committed artifact that agents
 * and the dev wiki can read directly.
 *
 * Usage:
 *   npx tsx scripts/build-graph.ts          # regenerate JSON
 *   npx tsx scripts/build-graph.ts --check  # exit 1 if JSON is stale
 */

import { writeFileSync, readFileSync } from "fs";
import { ACTIONS } from "../src/data/actions";
import { BUILDINGS } from "../src/data/buildings";
import { EXPEDITIONS } from "../src/data/expeditions";
import { RECIPES } from "../src/data/recipes";
import { RESOURCES } from "../src/data/resources";
import { SKILLS } from "../src/data/skills";
import { STATIONS } from "../src/data/stations";
import { TOOLS } from "../src/data/tools";
import type { BiomeId, SkillId } from "../src/data/types";

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface GraphNode {
  id: string;
  type: "resource" | "tool" | "action" | "recipe" | "building" | "biome" | "skill_level" | "expedition" | "station";
  label: string;
  category?: string; // tags joined, skill id, etc.
  meta?: Record<string, unknown>;
}

interface GraphEdge {
  from: string;
  to: string;
  relation:
    | "produces"
    | "consumes"
    | "requires_skill"
    | "requires_biome"
    | "requires_tool"
    | "requires_resource"
    | "requires_building"
    | "requires_item"
    | "requires_vessel"
    | "requires_biome_discovered"
    | "discovers"
    | "trains"
    | "builds"
    | "crafts_tool"
    | "speeds_up"
    | "boosts_output";
}

interface Warning {
  type: "dead_end" | "unreachable" | "high_gate" | "no_training" | "orphan_resource";
  nodeId: string;
  message: string;
}

interface SkillGateInfo {
  level: number;
  unlocks: string[];
  trainedBy: string[];
}

interface BiomeTier {
  tier: number;
  biomes: string[];
  gatedBy: string | null;
}

interface ProgressionGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  analysis: {
    criticalPathToDugout: string[];
    minimalPathToDugout: string[];
    deadEnds: string[];
    unreachable: string[];
    warnings: Warning[];
    skillGates: Record<string, SkillGateInfo[]>;
    biomeProgression: { tiers: BiomeTier[] };
  };
}

// ───────────────────────────────────────────────
// Node / Edge builders
// ───────────────────────────────────────────────

const nodes: GraphNode[] = [];
const edges: GraphEdge[] = [];
const nodeIds = new Set<string>();

function addNode(node: GraphNode) {
  if (nodeIds.has(node.id)) return;
  nodeIds.add(node.id);
  nodes.push(node);
}

function addEdge(edge: GraphEdge) {
  edges.push(edge);
}

// ───────────────────────────────────────────────
// Build graph from data
// ───────────────────────────────────────────────

// Resources
for (const r of Object.values(RESOURCES)) {
  addNode({ id: `resource:${r.id}`, type: "resource", label: r.name, category: (r.tags ?? []).join(",") || undefined });
}

// Tools
for (const t of Object.values(TOOLS)) {
  addNode({ id: `tool:${t.id}`, type: "tool", label: t.name });
}

// Tool speed bonuses
const toolsWithSpeed = Object.values(TOOLS).filter(t => t.speedBonus);

// Biomes
const ALL_BIOMES: BiomeId[] = ["beach", "coconut_grove", "rocky_shore", "bamboo_grove", "jungle_interior", "nearby_island"];
for (const b of ALL_BIOMES) {
  addNode({ id: `biome:${b}`, type: "biome", label: b.replace(/_/g, " ") });
}

// Skills (we add skill_level nodes for each gated level)
const skillLevelNodes = new Map<string, Set<number>>(); // skillId → set of levels that gate something

// Buildings
for (const b of Object.values(BUILDINGS)) {
  addNode({ id: `building:${b.id}`, type: "building", label: b.name });
}

// Collect all skill level gates first
for (const a of ACTIONS) {
  if (a.requiredSkillLevel && a.requiredSkillLevel > 1) {
    const levels = skillLevelNodes.get(a.skillId) ?? new Set();
    levels.add(a.requiredSkillLevel);
    skillLevelNodes.set(a.skillId, levels);
  }
}
for (const r of RECIPES) {
  if (r.requiredSkillLevel && r.requiredSkillLevel > 1) {
    const levels = skillLevelNodes.get(r.skillId) ?? new Set();
    levels.add(r.requiredSkillLevel);
    skillLevelNodes.set(r.skillId, levels);
  }
  if (r.requiredSkills) {
    for (const rs of r.requiredSkills) {
      const levels = skillLevelNodes.get(rs.skillId) ?? new Set();
      levels.add(rs.level);
      skillLevelNodes.set(rs.skillId, levels);
    }
  }
}
for (const s of STATIONS) {
  if (s.requiredSkillLevel && s.requiredSkillLevel > 1) {
    const levels = skillLevelNodes.get(s.skillId) ?? new Set();
    levels.add(s.requiredSkillLevel);
    skillLevelNodes.set(s.skillId, levels);
  }
}

// Create skill level nodes
for (const [skillId, levels] of skillLevelNodes) {
  for (const level of levels) {
    const id = `skill:${skillId}:${level}`;
    addNode({ id, type: "skill_level", label: `${SKILLS[skillId as SkillId].name} Lv${level}`, category: skillId });
  }
}

// Actions
for (const a of ACTIONS) {
  const actionId = `action:${a.id}`;
  addNode({ id: actionId, type: "action", label: a.name, category: a.skillId });

  // Drops → produces resources
  for (const d of a.drops) {
    addEdge({ from: actionId, to: `resource:${d.resourceId}`, relation: "produces" });
  }

  // Trains skill
  addEdge({ from: actionId, to: `skill:${a.skillId}`, relation: "trains" });

  // Requirements
  if (a.requiredSkillLevel && a.requiredSkillLevel > 1) {
    addEdge({ from: `skill:${a.skillId}:${a.requiredSkillLevel}`, to: actionId, relation: "requires_skill" });
  }
  if (a.requiredBiome) {
    addEdge({ from: `biome:${a.requiredBiome}`, to: actionId, relation: "requires_biome" });
  }
  if (a.requiredTools) {
    for (const t of a.requiredTools) {
      addEdge({ from: `tool:${t}`, to: actionId, relation: "requires_tool" });
    }
  }
  if (a.requiredResources) {
    for (const r of a.requiredResources) {
      addEdge({ from: `resource:${r}`, to: actionId, relation: "requires_resource" });
    }
  }
  if (a.requiredBuildings) {
    for (const b of a.requiredBuildings) {
      addEdge({ from: `building:${b}`, to: actionId, relation: "requires_building" });
    }
  }
}

// Recipes
for (const r of RECIPES) {
  const recipeId = `recipe:${r.id}`;
  addNode({ id: recipeId, type: "recipe", label: r.name, category: r.skillId });

  // Output
  if (r.toolOutput) {
    addEdge({ from: recipeId, to: `tool:${r.toolOutput}`, relation: "crafts_tool" });
  } else if (r.buildingOutput) {
    addEdge({ from: recipeId, to: `building:${r.buildingOutput}`, relation: "builds" });
  } else if (r.output && r.output.amount > 0) {
    addEdge({ from: recipeId, to: `resource:${r.output.resourceId}`, relation: "produces" });
  }

  // Inputs consumed
  for (const i of r.inputs) {
    addEdge({ from: `resource:${i.resourceId}`, to: recipeId, relation: "consumes" });
    if (i.alternateResourceId) {
      addEdge({ from: `resource:${i.alternateResourceId}`, to: recipeId, relation: "consumes" });
    }
  }
  // Tag-based inputs (e.g. "5 different foods") — link all matching tagged resources
  if (r.tagInputs) {
    for (const ti of r.tagInputs) {
      for (const res of Object.values(RESOURCES)) {
        if (res.tags?.includes(ti.tag)) {
          addEdge({ from: `resource:${res.id}`, to: recipeId, relation: "consumes" });
        }
      }
    }
  }

  // Trains skill
  addEdge({ from: recipeId, to: `skill:${r.skillId}`, relation: "trains" });

  // Requirements
  if (r.requiredSkillLevel && r.requiredSkillLevel > 1) {
    addEdge({ from: `skill:${r.skillId}:${r.requiredSkillLevel}`, to: recipeId, relation: "requires_skill" });
  }
  if (r.requiredSkills) {
    for (const rs of r.requiredSkills) {
      addEdge({ from: `skill:${rs.skillId}:${rs.level}`, to: recipeId, relation: "requires_skill" });
    }
  }
  if (r.requiredTools) {
    for (const t of r.requiredTools) {
      addEdge({ from: `tool:${t}`, to: recipeId, relation: "requires_tool" });
    }
  }
  if (r.requiredItems) {
    for (const item of r.requiredItems) {
      addEdge({ from: `resource:${item}`, to: recipeId, relation: "requires_item" });
    }
  }
  if (r.requiredBuildings) {
    for (const b of r.requiredBuildings) {
      addEdge({ from: `building:${b}`, to: recipeId, relation: "requires_building" });
    }
  }
}

// Tool speed bonuses → speeds_up edges
for (const t of toolsWithSpeed) {
  const sb = t.speedBonus!;
  for (const actionId of sb.actionIds ?? []) {
    addEdge({ from: `tool:${t.id}`, to: `action:${actionId}`, relation: "speeds_up" });
  }
  for (const recipeId of sb.recipeIds ?? []) {
    addEdge({ from: `tool:${t.id}`, to: `recipe:${recipeId}`, relation: "speeds_up" });
  }
}

// Tool output bonuses → boosts_output edges
const toolsWithOutput = Object.values(TOOLS).filter(t => t.outputBonus);
for (const t of toolsWithOutput) {
  const ob = t.outputBonus!;
  for (const recipeId of ob.recipeIds) {
    addEdge({ from: `tool:${t.id}`, to: `recipe:${recipeId}`, relation: "boosts_output" });
  }
}

// Expeditions
for (const e of EXPEDITIONS) {
  const expId = `expedition:${e.id}`;
  addNode({ id: expId, type: "expedition", label: e.name, category: "navigation" });

  // Trains navigation
  addEdge({ from: expId, to: `skill:navigation`, relation: "trains" });

  // Required vessel (now a building)
  if (e.requiredVessel) {
    addEdge({ from: `building:${e.requiredVessel}`, to: expId, relation: "requires_vessel" });
  }

  // Expeditions consume food/water generically — link all food-tagged resources
  if (e.foodCost) {
    for (const r of Object.values(RESOURCES)) {
      if (r.tags?.includes("food")) {
        addEdge({ from: `resource:${r.id}`, to: expId, relation: "consumes" });
      }
    }
  }
  if (e.waterCost) {
    addEdge({ from: `resource:fresh_water`, to: expId, relation: "consumes" });
  }
  // Specific resource inputs
  if (e.inputs) {
    for (const inp of e.inputs) {
      addEdge({ from: `resource:${inp.resourceId}`, to: expId, relation: "consumes" });
    }
  }

  // Required biomes to see expedition
  if (e.requiredBiomes) {
    for (const b of e.requiredBiomes) {
      addEdge({ from: `biome:${b}`, to: expId, relation: "requires_biome_discovered" });
    }
  }

  // Outcomes
  for (const o of e.outcomes) {
    if (o.biomeDiscovery) {
      addEdge({ from: expId, to: `biome:${o.biomeDiscovery}`, relation: "discovers" });
    }
    if (o.drops) {
      for (const d of o.drops) {
        addEdge({ from: expId, to: `resource:${d.resourceId}`, relation: "produces" });
      }
    }
    // Outcome-level biome requirements
    if (o.requiredBiomes) {
      for (const b of o.requiredBiomes) {
        addEdge({ from: `biome:${b}`, to: expId, relation: "requires_biome_discovered" });
      }
    }
  }
}

// Stations
for (const s of STATIONS) {
  const stationId = `station:${s.id}`;
  addNode({ id: stationId, type: "station", label: s.name, category: s.skillId });

  for (const y of s.yields) {
    addEdge({ from: stationId, to: `resource:${y.resourceId}`, relation: "produces" });
  }
  addEdge({ from: stationId, to: `skill:${s.skillId}`, relation: "trains" });

  if (s.requiredTool) {
    addEdge({ from: `tool:${s.requiredTool}`, to: stationId, relation: "requires_tool" });
  }
  if (s.requiredSkillLevel && s.requiredSkillLevel > 1) {
    addEdge({ from: `skill:${s.skillId}:${s.requiredSkillLevel}`, to: stationId, relation: "requires_skill" });
  }
  if (s.requiredBuildings) {
    for (const b of s.requiredBuildings) {
      addEdge({ from: `building:${b}`, to: stationId, relation: "requires_building" });
    }
  }
  if (s.setupInputs) {
    for (const i of s.setupInputs) {
      addEdge({ from: `resource:${i.resourceId}`, to: stationId, relation: "consumes" });
    }
  }
}

// ───────────────────────────────────────────────
// Analysis: BFS/DFS utilities
// ───────────────────────────────────────────────

// Build adjacency lists
// "forward" = from requirements to what they enable (upstream → downstream)
// "backward" = from a node to what it requires (downstream → upstream)
const forwardAdj = new Map<string, Set<string>>();
const backwardAdj = new Map<string, Set<string>>();
// Backward adjacency excluding optional edges (speeds_up, boosts_output) for minimal path sizing
const backwardAdjRequired = new Map<string, Set<string>>();
const OPTIONAL_RELATIONS = new Set(["speeds_up", "boosts_output"]);

for (const e of edges) {
  // forward: from → to (e.from enables e.to, or e.from leads to e.to)
  if (!forwardAdj.has(e.from)) forwardAdj.set(e.from, new Set());
  forwardAdj.get(e.from)!.add(e.to);

  if (!backwardAdj.has(e.to)) backwardAdj.set(e.to, new Set());
  backwardAdj.get(e.to)!.add(e.from);

  if (!OPTIONAL_RELATIONS.has(e.relation)) {
    if (!backwardAdjRequired.has(e.to)) backwardAdjRequired.set(e.to, new Set());
    backwardAdjRequired.get(e.to)!.add(e.from);
  }
}

// Set of recipe IDs that use tag-based food inputs (fungible, like expedition food costs)
const recipesWithFoodTagInputs = new Set<string>(
  RECIPES.filter(r => r.tagInputs?.some(ti => ti.tag === "food")).map(r => `recipe:${r.id}`)
);

// BFS backward following only required edges, skipping fungible food consumes
// (for minimal path size comparison — must match findMinimalUpstream logic)
function findAllUpstreamRequired(target: string): Set<string> {
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const visited = new Set<string>();
  const queue = [target];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    const node = nodeById.get(curr);
    // Skip food consumes edges on expeditions and recipes with tagInputs (they're fungible)
    if (node?.type === "expedition" || recipesWithFoodTagInputs.has(curr)) {
      const parentEdges = edges.filter(e => e.to === curr && !OPTIONAL_RELATIONS.has(e.relation));
      for (const e of parentEdges) {
        if (e.relation === "consumes") {
          const srcNode = nodeById.get(e.from);
          if (srcNode?.type === "resource" && srcNode.category?.includes("food")) continue;
        }
        queue.push(e.from);
      }
    } else {
      const parents = backwardAdjRequired.get(curr);
      if (parents) for (const p of parents) queue.push(p);
    }
  }
  return visited;
}

// BFS backward from a target to find all upstream dependencies
function findAllUpstream(target: string): Set<string> {
  const visited = new Set<string>();
  const queue = [target];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    const parents = backwardAdj.get(curr);
    if (parents) {
      for (const p of parents) queue.push(p);
    }
  }
  return visited;
}

// All upstream: BFS backward following every edge
function findCriticalPath(target: string): string[] {
  return Array.from(findAllUpstream(target));
}

// Minimal upstream: BFS backward, but at choice points (resource/building/biome/tool
// nodes with multiple producers) pick the single producer with the smallest
// upstream subtree. This gives the "simplest path" to a target.
function findMinimalUpstream(target: string): string[] {
  // Pre-compute upstream sizes so we can compare producers
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const upstreamSizeCache = new Map<string, number>();
  function getUpstreamSize(id: string): number {
    if (upstreamSizeCache.has(id)) return upstreamSizeCache.get(id)!;
    // Mark with Infinity to break cycles during computation
    upstreamSizeCache.set(id, Infinity);
    const size = findAllUpstreamRequired(id).size;
    upstreamSizeCache.set(id, size);
    return size;
  }

  const included = new Set<string>();
  const queue = [target];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (included.has(curr)) continue;
    included.add(curr);

    const node = nodeById.get(curr);
    if (!node) continue;

    if (node.type === "resource" || node.type === "building" || node.type === "biome" || node.type === "tool") {
      // Choice point: pick the cheapest producer
      const producers = edges.filter(e =>
        e.to === curr && ["produces", "builds", "discovers", "crafts_tool"].includes(e.relation)
      );
      if (producers.length > 0) {
        const best = producers.reduce((a, b) =>
          getUpstreamSize(a.from) < getUpstreamSize(b.from) ? a : b
        );
        queue.push(best.from);
      }
    } else {
      // Actions, recipes, expeditions, stations: ALL backward edges are mandatory
      // EXCEPT: food "consumes" edges on expeditions & tag-input recipes are fungible
      const allParentEdges = edges.filter(e => e.to === curr && e.relation !== "speeds_up" && e.relation !== "boosts_output");
      const hasFungibleFood = node.type === "expedition" || recipesWithFoodTagInputs.has(curr);
      const foodConsumeEdges = hasFungibleFood
        ? allParentEdges.filter(e => {
            if (e.relation !== "consumes") return false;
            const srcNode = nodeById.get(e.from);
            return srcNode?.type === "resource" && srcNode.category?.includes("food");
          })
        : [];
      const nonFoodEdges = foodConsumeEdges.length > 0
        ? allParentEdges.filter(e => !foodConsumeEdges.includes(e))
        : allParentEdges;

      // Add all non-food parents (mandatory)
      for (const e of nonFoodEdges) queue.push(e.from);

      // For food: pick the single cheapest food source
      if (foodConsumeEdges.length > 0) {
        const bestFood = foodConsumeEdges.reduce((a, b) =>
          getUpstreamSize(a.from) < getUpstreamSize(b.from) ? a : b
        );
        queue.push(bestFood.from);
      }
    }
  }

  return Array.from(included);
}

// ───────────────────────────────────────────────
// Analysis: Reachability from beach start
// ───────────────────────────────────────────────

// Things available at start: beach biome, plus actions with no requirements
function computeReachable(): Set<string> {
  const reachable = new Set<string>();

  // Start: beach biome
  reachable.add("biome:beach");

  // Actions/recipes with zero requirements are reachable
  for (const a of ACTIONS) {
    const hasReqs = (a.requiredSkillLevel && a.requiredSkillLevel > 1) ||
      a.requiredBiome || a.requiredTools?.length || a.requiredResources?.length || a.requiredBuildings?.length;
    if (!hasReqs) {
      const id = `action:${a.id}`;
      reachable.add(id);
    }
  }
  for (const r of RECIPES) {
    const hasGates = (r.requiredSkillLevel && r.requiredSkillLevel > 1) ||
      r.requiredSkills?.length || r.requiredItems?.length || r.requiredTools?.length || r.requiredBuildings?.length;
    if (!hasGates) {
      const id = `recipe:${r.id}`;
      reachable.add(id);
    }
  }

  // Iteratively expand
  let changed = true;
  while (changed) {
    changed = false;
    // Check all edges: if "from" is reachable, "to" might become reachable
    for (const e of edges) {
      if (reachable.has(e.from) && !reachable.has(e.to)) {
        if (["produces", "discovers", "builds", "trains", "crafts_tool"].includes(e.relation)) {
          reachable.add(e.to);
          changed = true;
        }
      }
    }

    // Check if gated actions now have all requirements met
    for (const a of ACTIONS) {
      const id = `action:${a.id}`;
      if (reachable.has(id)) continue;
      const skillMet = !(a.requiredSkillLevel && a.requiredSkillLevel > 1) ||
        reachable.has(`skill:${a.skillId}:${a.requiredSkillLevel}`);
      const biomeMet = !a.requiredBiome || reachable.has(`biome:${a.requiredBiome}`);
      const toolsMet = !a.requiredTools?.length || a.requiredTools.every(t => reachable.has(`tool:${t}`));
      const resourcesMet = !a.requiredResources?.length || a.requiredResources.every(r => reachable.has(`resource:${r}`));
      const buildingsMet = !a.requiredBuildings?.length || a.requiredBuildings.every(b => reachable.has(`building:${b}`));
      if (skillMet && biomeMet && toolsMet && resourcesMet && buildingsMet) {
        reachable.add(id);
        changed = true;
      }
    }

    for (const r of RECIPES) {
      const id = `recipe:${r.id}`;
      if (reachable.has(id)) continue;
      const skillMet = !(r.requiredSkillLevel && r.requiredSkillLevel > 1) ||
        reachable.has(`skill:${r.skillId}:${r.requiredSkillLevel}`);
      const dualSkillsMet = !r.requiredSkills?.length ||
        r.requiredSkills.every(rs => reachable.has(`skill:${rs.skillId}:${rs.level}`));
      const toolsMet = !r.requiredTools?.length || r.requiredTools.every(t => reachable.has(`tool:${t}`));
      const itemsMet = !r.requiredItems?.length || r.requiredItems.every(i => reachable.has(`resource:${i}`));
      const buildingsMet = !r.requiredBuildings?.length || r.requiredBuildings.every(b => reachable.has(`building:${b}`));
      const inputsMet = r.inputs.every(i => reachable.has(`resource:${i.resourceId}`) || (i.alternateResourceId && reachable.has(`resource:${i.alternateResourceId}`)));
      const tagInputsMet = !r.tagInputs?.length || r.tagInputs.every(ti => {
        const reachableTagged = Object.values(RESOURCES).filter(
          res => res.tags?.includes(ti.tag) && reachable.has(`resource:${res.id}`)
        ).length;
        return reachableTagged >= ti.count;
      });
      if (skillMet && dualSkillsMet && toolsMet && itemsMet && buildingsMet && inputsMet && tagInputsMet) {
        reachable.add(id);
        changed = true;
      }
    }

    for (const e of EXPEDITIONS) {
      const id = `expedition:${e.id}`;
      if (reachable.has(id)) continue;
      const vesselMet = !e.requiredVessel || reachable.has(`building:${e.requiredVessel}`);
      const biomesMet = !e.requiredBiomes?.length || e.requiredBiomes.every(b => reachable.has(`biome:${b}`));
      if (vesselMet && biomesMet) {
        reachable.add(id);
        changed = true;
      }
    }

    for (const s of STATIONS) {
      const id = `station:${s.id}`;
      if (reachable.has(id)) continue;
      const skillMet = !(s.requiredSkillLevel && s.requiredSkillLevel > 1) ||
        reachable.has(`skill:${s.skillId}:${s.requiredSkillLevel}`);
      const toolMet = !s.requiredTool || reachable.has(`tool:${s.requiredTool}`);
      const buildingsMet = !s.requiredBuildings?.length || s.requiredBuildings.every(b => reachable.has(`building:${b}`));
      if (skillMet && toolMet && buildingsMet) {
        reachable.add(id);
        changed = true;
      }
    }

    // Skill levels become reachable when any action/recipe that trains that skill is reachable
    for (const [skillId, levels] of skillLevelNodes) {
      for (const level of levels) {
        const id = `skill:${skillId}:${level}`;
        if (reachable.has(id)) continue;
        const hasTrainer = edges.some(e =>
          e.relation === "trains" &&
          e.to === `skill:${skillId}` &&
          reachable.has(e.from)
        );
        if (hasTrainer) {
          reachable.add(id);
          changed = true;
        }
      }
    }
  }

  return reachable;
}

// ───────────────────────────────────────────────
// Analysis: Warnings
// ───────────────────────────────────────────────

function computeWarnings(reachable: Set<string>): Warning[] {
  const warnings: Warning[] = [];

  // Dead ends: resources/tools that are produced but never consumed by anything
  const producedNodes = new Set<string>();
  const consumedNodes = new Set<string>();
  for (const e of edges) {
    if (["produces", "crafts_tool"].includes(e.relation)) producedNodes.add(e.to);
    if (["consumes", "requires_tool", "requires_resource", "requires_item", "requires_vessel", "speeds_up", "boosts_output"].includes(e.relation)) {
      consumedNodes.add(e.from);
    }
  }
  for (const r of producedNodes) {
    if (!consumedNodes.has(r)) {
      const label = nodes.find(n => n.id === r)?.label ?? r;
      warnings.push({ type: "dead_end", nodeId: r, message: `${label} is produced but never used as input` });
    }
  }

  // Unreachable nodes
  for (const n of nodes) {
    if (n.id.match(/^skill:[^:]+$/) && !n.id.includes(":")) continue;
    if (!reachable.has(n.id)) {
      warnings.push({ type: "unreachable", nodeId: n.id, message: `${n.label} is not reachable from beach start` });
    }
  }

  // Orphan resources: defined but neither produced nor consumed
  for (const r of Object.values(RESOURCES)) {
    const id = `resource:${r.id}`;
    if (!producedNodes.has(id) && !consumedNodes.has(id)) {
      warnings.push({ type: "orphan_resource", nodeId: id, message: `${r.name} is defined but has no production or consumption edges` });
    }
  }

  // High gates: skill level requirements with few training actions
  for (const [skillId, levels] of skillLevelNodes) {
    const trainers = edges.filter(e =>
      e.relation === "trains" && e.to === `skill:${skillId}`
    );
    const maxLevel = Math.max(...levels);
    if (maxLevel >= 10 && trainers.length <= 2) {
      warnings.push({
        type: "high_gate",
        nodeId: `skill:${skillId}:${maxLevel}`,
        message: `${SKILLS[skillId as SkillId].name} Lv${maxLevel} is required but only ${trainers.length} action(s) train this skill`,
      });
    }
  }

  // Skills with level gates but no training actions at all
  for (const [skillId, levels] of skillLevelNodes) {
    const trainers = edges.filter(e =>
      e.relation === "trains" && e.to === `skill:${skillId}`
    );
    if (trainers.length === 0) {
      for (const level of levels) {
        warnings.push({
          type: "no_training",
          nodeId: `skill:${skillId}:${level}`,
          message: `${SKILLS[skillId as SkillId].name} has level gates but zero training actions`,
        });
      }
    }
  }

  return warnings;
}

// ───────────────────────────────────────────────
// Analysis: Skill Gates
// ───────────────────────────────────────────────

function computeSkillGates(): Record<string, SkillGateInfo[]> {
  const result: Record<string, SkillGateInfo[]> = {};

  for (const [skillId, levels] of skillLevelNodes) {
    const sortedLevels = Array.from(levels).sort((a, b) => a - b);
    const gates: SkillGateInfo[] = sortedLevels.map(level => {
      const nodeId = `skill:${skillId}:${level}`;
      const unlocks = edges
        .filter(e => e.from === nodeId && e.relation === "requires_skill")
        .map(e => e.to);

      const trainedBy = edges
        .filter(e => e.relation === "trains" && e.to === `skill:${skillId}`)
        .map(e => e.from);

      return { level, unlocks, trainedBy };
    });
    result[skillId] = gates;
  }

  return result;
}

// ───────────────────────────────────────────────
// Analysis: Biome Progression
// ───────────────────────────────────────────────

function computeBiomeProgression(): { tiers: BiomeTier[] } {
  const tiers: BiomeTier[] = [
    { tier: 0, biomes: ["beach"], gatedBy: null },
    { tier: 1, biomes: ["coconut_grove"], gatedBy: "explore_beach (RNG, no prerequisites)" },
    { tier: 1, biomes: ["rocky_shore"], gatedBy: "explore_beach (RNG, requires coconut_grove discovered)" },
    { tier: 2, biomes: ["bamboo_grove"], gatedBy: "explore_interior (requires coconut_grove)" },
    { tier: 2, biomes: ["jungle_interior"], gatedBy: "explore_interior (requires coconut_grove, low 3% chance)" },
    { tier: 3, biomes: ["nearby_island"], gatedBy: "sail_nearby_island (requires raft)" },
  ];

  return { tiers };
}

// ───────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────

const reachable = computeReachable();
const warnings = computeWarnings(reachable);
// Dugout is now a building
const criticalPath = findCriticalPath("building:dugout");
const minimalPath = findMinimalUpstream("building:dugout");
const skillGates = computeSkillGates();
const biomeProgression = computeBiomeProgression();

const unreachableNodes = nodes.filter(n => !reachable.has(n.id) && !n.id.match(/^skill:[^:]+$/));
const deadEnds = warnings.filter(w => w.type === "dead_end").map(w => w.nodeId);

const graph: ProgressionGraph = {
  nodes,
  edges,
  analysis: {
    criticalPathToDugout: criticalPath,
    minimalPathToDugout: minimalPath,
    deadEnds,
    unreachable: unreachableNodes.map(n => n.id),
    warnings,
    skillGates,
    biomeProgression,
  },
};

const json = JSON.stringify(graph, null, 2);
const outPath = "src/data/progression-graph.json";

if (process.argv.includes("--check")) {
  try {
    const existing = readFileSync(outPath, "utf-8");
    if (existing === json) {
      console.log("progression-graph.json is up to date.");
      process.exit(0);
    } else {
      console.error("progression-graph.json is STALE. Run: npx tsx scripts/build-graph.ts");
      process.exit(1);
    }
  } catch {
    console.error("progression-graph.json not found. Run: npx tsx scripts/build-graph.ts");
    process.exit(1);
  }
} else {
  writeFileSync(outPath, json);
  console.log(`Wrote ${outPath} (${nodes.length} nodes, ${edges.length} edges, ${warnings.length} warnings)`);
  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const w of warnings) {
      console.log(`  [${w.type}] ${w.message}`);
    }
  }
}
