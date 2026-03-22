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
import type { BiomeId, SkillId } from "../src/data/types";

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface GraphNode {
  id: string;
  type: "resource" | "action" | "recipe" | "building" | "biome" | "skill_level" | "expedition" | "station";
  label: string;
  category?: string; // resource category, skill id, etc.
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
    | "requires_building"
    | "requires_item"
    | "requires_vessel"
    | "requires_biome_discovered"
    | "discovers"
    | "trains"
    | "builds";
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
  addNode({ id: `resource:${r.id}`, type: "resource", label: r.name, category: r.category });
}

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
      addEdge({ from: `resource:${t}`, to: actionId, relation: "requires_tool" });
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
  if (r.buildingOutput) {
    addEdge({ from: recipeId, to: `building:${r.buildingOutput}`, relation: "builds" });
  } else if (r.output && r.output.amount > 0) {
    addEdge({ from: recipeId, to: `resource:${r.output.resourceId}`, relation: "produces" });
  }

  // Inputs consumed
  for (const i of r.inputs) {
    addEdge({ from: `resource:${i.resourceId}`, to: recipeId, relation: "consumes" });
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

// Expeditions
for (const e of EXPEDITIONS) {
  const expId = `expedition:${e.id}`;
  addNode({ id: expId, type: "expedition", label: e.name, category: "navigation" });

  // Trains navigation
  addEdge({ from: expId, to: `skill:navigation`, relation: "trains" });

  // Required vessel
  if (e.requiredVessel) {
    addEdge({ from: `resource:${e.requiredVessel}`, to: expId, relation: "requires_vessel" });
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
    addEdge({ from: `resource:${s.requiredTool}`, to: stationId, relation: "requires_tool" });
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

for (const e of edges) {
  // forward: from → to (e.from enables e.to, or e.from leads to e.to)
  if (!forwardAdj.has(e.from)) forwardAdj.set(e.from, new Set());
  forwardAdj.get(e.from)!.add(e.to);

  if (!backwardAdj.has(e.to)) backwardAdj.set(e.to, new Set());
  backwardAdj.get(e.to)!.add(e.from);
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

// Critical path to dugout — BFS backward, then extract shortest path
function findCriticalPath(target: string): string[] {
  const visited = new Map<string, string | null>(); // node → parent
  const queue: string[] = [target];
  visited.set(target, null);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const parents = backwardAdj.get(curr);
    if (parents) {
      for (const p of parents) {
        if (!visited.has(p)) {
          visited.set(p, curr);
          queue.push(p);
        }
      }
    }
  }

  // Now trace all leaf nodes (nodes with no parents = starting resources/biomes)
  // Return the full upstream set as an ordered list
  const upstream = findAllUpstream(target);
  return Array.from(upstream);
}

// ───────────────────────────────────────────────
// Analysis: Reachability from beach start
// ───────────────────────────────────────────────

// Things available at start: beach biome, plus actions with no requirements
function computeReachable(): Set<string> {
  const reachable = new Set<string>();
  const queue: string[] = [];

  // Start: beach biome
  reachable.add("biome:beach");
  queue.push("biome:beach");

  // Actions/recipes with zero requirements are reachable
  for (const a of ACTIONS) {
    const hasReqs = (a.requiredSkillLevel && a.requiredSkillLevel > 1) ||
      a.requiredBiome || a.requiredTools?.length || a.requiredBuildings?.length;
    if (!hasReqs) {
      const id = `action:${a.id}`;
      reachable.add(id);
      queue.push(id);
    }
  }
  for (const r of RECIPES) {
    const hasGates = (r.requiredSkillLevel && r.requiredSkillLevel > 1) ||
      r.requiredSkills?.length || r.requiredItems?.length || r.requiredBuildings?.length;
    // Recipe also needs its input resources to exist — but we check that separately
    // For reachability, a recipe is "available" if its gates are met
    if (!hasGates) {
      const id = `recipe:${r.id}`;
      reachable.add(id);
      queue.push(id);
    }
  }

  // Iteratively expand: when a node is reachable, check what it produces/enables
  let changed = true;
  while (changed) {
    changed = false;
    // Check all edges: if "from" is reachable, "to" might become reachable
    for (const e of edges) {
      if (reachable.has(e.from) && !reachable.has(e.to)) {
        // For "produces", "discovers", "builds" — downstream becomes reachable
        if (["produces", "discovers", "builds", "trains"].includes(e.relation)) {
          reachable.add(e.to);
          queue.push(e.to);
          changed = true;
        }
      }
    }

    // Check if gated actions/recipes/expeditions/stations now have all requirements met
    for (const a of ACTIONS) {
      const id = `action:${a.id}`;
      if (reachable.has(id)) continue;
      const skillMet = !(a.requiredSkillLevel && a.requiredSkillLevel > 1) ||
        reachable.has(`skill:${a.skillId}:${a.requiredSkillLevel}`);
      const biomeMet = !a.requiredBiome || reachable.has(`biome:${a.requiredBiome}`);
      const toolsMet = !a.requiredTools?.length || a.requiredTools.every(t => reachable.has(`resource:${t}`));
      const buildingsMet = !a.requiredBuildings?.length || a.requiredBuildings.every(b => reachable.has(`building:${b}`));
      if (skillMet && biomeMet && toolsMet && buildingsMet) {
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
      const itemsMet = !r.requiredItems?.length || r.requiredItems.every(i => reachable.has(`resource:${i}`));
      const buildingsMet = !r.requiredBuildings?.length || r.requiredBuildings.every(b => reachable.has(`building:${b}`));
      const inputsMet = r.inputs.every(i => reachable.has(`resource:${i.resourceId}`));
      if (skillMet && dualSkillsMet && itemsMet && buildingsMet && inputsMet) {
        reachable.add(id);
        changed = true;
      }
    }

    for (const e of EXPEDITIONS) {
      const id = `expedition:${e.id}`;
      if (reachable.has(id)) continue;
      const vesselMet = !e.requiredVessel || reachable.has(`resource:${e.requiredVessel}`);
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
      const toolMet = !s.requiredTool || reachable.has(`resource:${s.requiredTool}`);
      const buildingsMet = !s.requiredBuildings?.length || s.requiredBuildings.every(b => reachable.has(`building:${b}`));
      if (skillMet && toolMet && buildingsMet) {
        reachable.add(id);
        changed = true;
      }
    }

    // Skill levels become reachable when any action/recipe that trains that skill is reachable
    // (Simplified: we assume if you can train the skill, you can eventually reach any level)
    for (const [skillId, levels] of skillLevelNodes) {
      for (const level of levels) {
        const id = `skill:${skillId}:${level}`;
        if (reachable.has(id)) continue;
        // Check if any trainer for this skill is reachable
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

  // Dead ends: resources that are produced but never consumed by anything
  const producedResources = new Set<string>();
  const consumedResources = new Set<string>();
  for (const e of edges) {
    if (e.relation === "produces" && e.to.startsWith("resource:")) producedResources.add(e.to);
    if (["consumes", "requires_tool", "requires_item", "requires_vessel"].includes(e.relation) && e.from.startsWith("resource:")) {
      consumedResources.add(e.from);
    }
  }
  for (const r of producedResources) {
    if (!consumedResources.has(r)) {
      const label = nodes.find(n => n.id === r)?.label ?? r;
      warnings.push({ type: "dead_end", nodeId: r, message: `${label} is produced but never used as input` });
    }
  }

  // Unreachable nodes
  for (const n of nodes) {
    // Skip virtual skill training target nodes (skill:X without level)
    if (n.id.match(/^skill:[^:]+$/) && !n.id.includes(":")) continue;
    if (!reachable.has(n.id)) {
      warnings.push({ type: "unreachable", nodeId: n.id, message: `${n.label} is not reachable from beach start` });
    }
  }

  // Orphan resources: defined but neither produced nor consumed
  for (const r of Object.values(RESOURCES)) {
    const id = `resource:${r.id}`;
    if (!producedResources.has(id) && !consumedResources.has(id)) {
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
      // What does this level unlock?
      const unlocks = edges
        .filter(e => e.from === nodeId && e.relation === "requires_skill")
        .map(e => e.to);

      // What trains this skill?
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
  // Manual tier assignment based on discovery chain analysis
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
const criticalPath = findCriticalPath("resource:dugout");
const skillGates = computeSkillGates();
const biomeProgression = computeBiomeProgression();

const unreachableNodes = nodes.filter(n => !reachable.has(n.id) && !n.id.match(/^skill:[^:]+$/));
const deadEnds = warnings.filter(w => w.type === "dead_end").map(w => w.nodeId);

const graph: ProgressionGraph = {
  nodes,
  edges,
  analysis: {
    criticalPathToDugout: criticalPath,
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
