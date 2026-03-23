import graphData from "../data/progression-graph.json";

// ───────────────────────────────────────────────
// Types matching the JSON shape
// ───────────────────────────────────────────────

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  category?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

export interface Warning {
  type: string;
  nodeId: string;
  message: string;
}

// ───────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────

export type NodeType = "resource" | "action" | "recipe" | "building" | "biome" | "skill_level" | "expedition" | "station";

export const NODE_COLORS: Record<string, string> = {
  resource: "#7acea0",
  action: "#de9a7a",
  recipe: "#d4c87a",
  building: "#b47ade",
  biome: "#5aaa5a",
  skill_level: "#7ab4de",
  expedition: "#de7a7a",
  station: "#7adede",
};

export const NODE_RADIUS: Record<string, number> = {
  resource: 6,
  action: 8,
  recipe: 8,
  building: 10,
  biome: 12,
  skill_level: 7,
  expedition: 10,
  station: 8,
};

export const ALL_NODE_TYPES: NodeType[] = ["resource", "action", "recipe", "building", "biome", "skill_level", "expedition", "station"];

export type FocusDirection = "upstream" | "downstream";
export type FocusMode = "all" | "greedy";
export type FilterMode = "all" | "focus" | "biomes" | "skill_gates" | NodeType;

// ───────────────────────────────────────────────
// Graph data
// ───────────────────────────────────────────────

export const allNodes: GraphNode[] = graphData.nodes as GraphNode[];
export const allEdges: GraphEdge[] = graphData.edges as GraphEdge[];
export const analysis = graphData.analysis as {
  criticalPathToDugout: string[];
  minimalPathToDugout: string[];
  deadEnds: string[];
  unreachable: string[];
  warnings: Warning[];
  skillGates: Record<string, { level: number; unlocks: string[]; trainedBy: string[] }[]>;
  biomeProgression: { tiers: { tier: number; biomes: string[]; gatedBy: string | null }[] };
};

// ───────────────────────────────────────────────
// Graph utilities
// ───────────────────────────────────────────────

const OPTIONAL_RELATIONS = new Set(["speeds_up", "boosts_output"]);

function buildAdjacency() {
  const forward = new Map<string, Set<string>>();
  const backward = new Map<string, Set<string>>();
  const backwardRequired = new Map<string, Set<string>>();
  for (const e of allEdges) {
    if (!forward.has(e.from)) forward.set(e.from, new Set());
    forward.get(e.from)!.add(e.to);
    if (!backward.has(e.to)) backward.set(e.to, new Set());
    backward.get(e.to)!.add(e.from);
    if (!OPTIONAL_RELATIONS.has(e.relation)) {
      if (!backwardRequired.has(e.to)) backwardRequired.set(e.to, new Set());
      backwardRequired.get(e.to)!.add(e.from);
    }
  }
  return { forward, backward, backwardRequired };
}

export const { forward, backward, backwardRequired } = buildAdjacency();
export const nodeById = new Map(allNodes.map(n => [n.id, n]));

export function getUpstream(nodeId: string): Set<string> {
  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    const parents = backward.get(curr);
    if (parents) for (const p of parents) queue.push(p);
  }
  return visited;
}

export function getDownstream(nodeId: string): Set<string> {
  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    const children = forward.get(curr);
    if (children) for (const c of children) queue.push(c);
  }
  return visited;
}

function getUpstreamRequired(nodeId: string): Set<string> {
  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    const node = nodeById.get(curr);
    if (node?.type === "expedition") {
      const parentEdges = allEdges.filter(e => e.to === curr && !OPTIONAL_RELATIONS.has(e.relation));
      for (const e of parentEdges) {
        if (e.relation === "consumes") {
          const srcNode = nodeById.get(e.from);
          if (srcNode?.type === "resource" && srcNode.category?.includes("food")) continue;
        }
        queue.push(e.from);
      }
    } else {
      const parents = backwardRequired.get(curr);
      if (parents) for (const p of parents) queue.push(p);
    }
  }
  return visited;
}

const upstreamSizeCache = new Map<string, number>();
function getUpstreamSize(nodeId: string): number {
  if (upstreamSizeCache.has(nodeId)) return upstreamSizeCache.get(nodeId)!;
  upstreamSizeCache.set(nodeId, Infinity);
  const size = getUpstreamRequired(nodeId).size;
  upstreamSizeCache.set(nodeId, size);
  return size;
}

export function getMinimalUpstream(nodeId: string): Set<string> {
  const included = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (included.has(curr)) continue;
    included.add(curr);
    const node = nodeById.get(curr);
    if (!node) continue;

    if (node.type === "resource" || node.type === "building" || node.type === "biome" || node.type === "tool") {
      const producers = allEdges.filter(e =>
        e.to === curr && ["produces", "builds", "discovers", "crafts_tool"].includes(e.relation)
      );
      if (producers.length > 0) {
        const best = producers.reduce((a, b) =>
          getUpstreamSize(a.from) < getUpstreamSize(b.from) ? a : b
        );
        queue.push(best.from);
      }
    } else {
      const allParentEdges = allEdges.filter(e => e.to === curr && e.relation !== "speeds_up" && e.relation !== "boosts_output");
      const foodConsumeEdges = node.type === "expedition"
        ? allParentEdges.filter(e => {
            if (e.relation !== "consumes") return false;
            const srcNode = nodeById.get(e.from);
            return srcNode?.type === "resource" && srcNode.category?.includes("food");
          })
        : [];
      const nonFoodEdges = foodConsumeEdges.length > 0
        ? allParentEdges.filter(e => !foodConsumeEdges.includes(e))
        : allParentEdges;
      for (const e of nonFoodEdges) queue.push(e.from);
      if (foodConsumeEdges.length > 0) {
        const bestFood = foodConsumeEdges.reduce((a, b) =>
          getUpstreamSize(a.from) < getUpstreamSize(b.from) ? a : b
        );
        queue.push(bestFood.from);
      }
    }
  }
  return included;
}

// ───────────────────────────────────────────────
// Filter logic
// ───────────────────────────────────────────────

export function getFilteredData(
  mode: FilterMode,
  selectedSkill: string | null,
  focusTarget: string | null,
  focusDirection: FocusDirection,
  focusMode: FocusMode,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (mode === "all") return { nodes: allNodes, edges: allEdges };

  if (mode === "focus" && focusTarget) {
    let nodeSet: Set<string>;
    if (focusDirection === "upstream") {
      nodeSet = focusMode === "greedy" ? getMinimalUpstream(focusTarget) : getUpstream(focusTarget);
    } else {
      nodeSet = getDownstream(focusTarget);
    }
    const nodes = allNodes.filter(n => nodeSet.has(n.id));
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = allEdges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));
    return { nodes, edges };
  }

  if (mode === "biomes") {
    const relevantIds = new Set<string>();
    for (const n of allNodes) {
      if (n.type === "biome" || n.type === "expedition") relevantIds.add(n.id);
    }
    for (const e of allEdges) {
      if (e.relation === "requires_vessel" && relevantIds.has(e.to)) relevantIds.add(e.from);
      if (e.relation === "discovers" && relevantIds.has(e.from)) relevantIds.add(e.to);
      if (e.relation === "requires_biome_discovered") {
        relevantIds.add(e.from);
        relevantIds.add(e.to);
      }
    }
    const nodes = allNodes.filter(n => relevantIds.has(n.id));
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = allEdges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));
    return { nodes, edges };
  }

  if (mode === "skill_gates") {
    if (!selectedSkill || !analysis.skillGates[selectedSkill]) return { nodes: [], edges: [] };
    const gates = analysis.skillGates[selectedSkill];
    const relevantIds = new Set<string>();
    for (const g of gates) {
      relevantIds.add(`skill:${selectedSkill}:${g.level}`);
      for (const u of g.unlocks) relevantIds.add(u);
      for (const t of g.trainedBy) relevantIds.add(t);
    }
    relevantIds.add(`skill:${selectedSkill}`);
    const nodes = allNodes.filter(n => relevantIds.has(n.id));
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = allEdges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));
    return { nodes, edges };
  }

  // Filter by node type
  const typeFilter = mode as NodeType;
  const typeNodes = allNodes.filter(n => n.type === typeFilter);
  const typeNodeIds = new Set(typeNodes.map(n => n.id));
  const connectedIds = new Set(typeNodeIds);
  for (const e of allEdges) {
    if (typeNodeIds.has(e.from)) connectedIds.add(e.to);
    if (typeNodeIds.has(e.to)) connectedIds.add(e.from);
  }
  const nodes = allNodes.filter(n => connectedIds.has(n.id));
  const nodeIds = new Set(nodes.map(n => n.id));
  const edges = allEdges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));
  return { nodes, edges };
}

export function applyTypeHiding(
  nodes: GraphNode[],
  edges: GraphEdge[],
  hiddenTypes: Set<string>,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (hiddenTypes.size === 0) return { nodes, edges };

  const visibleNodes = nodes.filter(n => !hiddenTypes.has(n.type));
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const hiddenIds = new Set(nodes.filter(n => hiddenTypes.has(n.type)).map(n => n.id));

  const fwd = new Map<string, { to: string; relation: string }[]>();
  for (const e of edges) {
    if (!fwd.has(e.from)) fwd.set(e.from, []);
    fwd.get(e.from)!.push({ to: e.to, relation: e.relation });
  }

  const bridgedEdges: GraphEdge[] = [];
  const seen = new Set<string>();

  for (const e of edges) {
    if (visibleIds.has(e.from) && visibleIds.has(e.to)) {
      const key = `${e.from}|${e.to}`;
      if (!seen.has(key)) {
        seen.add(key);
        bridgedEdges.push(e);
      }
    } else if (visibleIds.has(e.from) && hiddenIds.has(e.to)) {
      const queue = [e.to];
      const visited = new Set<string>();
      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (visited.has(curr)) continue;
        visited.add(curr);
        const children = fwd.get(curr) ?? [];
        for (const child of children) {
          if (visibleIds.has(child.to)) {
            const key = `${e.from}|${child.to}`;
            if (!seen.has(key)) {
              seen.add(key);
              bridgedEdges.push({ from: e.from, to: child.to, relation: e.relation });
            }
          } else if (hiddenIds.has(child.to)) {
            queue.push(child.to);
          }
        }
      }
    }
  }

  return { nodes: visibleNodes, edges: bridgedEdges };
}
