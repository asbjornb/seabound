import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import {
  type FocusDirection, type FocusMode, type FilterMode,
  NODE_COLORS, NODE_RADIUS, ALL_NODE_TYPES,
  allNodes, allEdges, analysis,
  getUpstream, getFilteredData, applyTypeHiding,
} from "./devGraphShared";

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  type: string;
  label: string;
  category?: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  relation: string;
}

// ───────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────

function SearchSelect({ value, options, onChange }: {
  value: string | null;
  options: { id: string; label: string; type: string }[];
  onChange: (id: string | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  }, [search, options]);

  const selectedLabel = value ? options.find(o => o.id === value) : null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <input
        style={styles.focusSelect}
        placeholder="Search nodes..."
        value={open ? search : (selectedLabel ? `${selectedLabel.label} (${selectedLabel.type})` : search)}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => { setOpen(true); setSearch(""); }}
      />
      {open && (
        <div style={styles.searchDropdown}>
          {filtered.slice(0, 40).map(o => (
            <div
              key={o.id}
              style={{
                ...styles.searchOption,
                background: o.id === value ? "#1e4a3a" : undefined,
              }}
              onMouseDown={() => { onChange(o.id); setSearch(""); setOpen(false); }}
            >
              <span style={{ ...styles.dot, background: NODE_COLORS[o.type] }} />
              {o.label} <span style={{ color: "#5a7a6a", fontSize: "0.7rem" }}>({o.type})</span>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: "0.4rem 0.6rem", color: "#5a7a6a", fontSize: "0.8rem" }}>No matches</div>}
          {filtered.length > 40 && <div style={{ padding: "0.4rem 0.6rem", color: "#5a7a6a", fontSize: "0.75rem" }}>...{filtered.length - 40} more</div>}
        </div>
      )}
    </div>
  );
}

export function DevGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightUpstream, setHighlightUpstream] = useState<Set<string> | null>(null);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const [focusDirection, setFocusDirection] = useState<FocusDirection>("upstream");
  const [focusMode, setFocusMode] = useState<FocusMode>("greedy");
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [focusDepth, setFocusDepth] = useState<number | null>(null);

  const toggleHiddenType = useCallback((type: string) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const { nodes: filteredNodes, edges: filteredEdges } = useMemo(() => {
    const base = getFilteredData(filter, selectedSkill, focusTarget, focusDirection, focusMode, focusDepth ?? undefined);
    return applyTypeHiding(base.nodes, base.edges, hiddenTypes);
  }, [filter, selectedSkill, focusTarget, focusDirection, focusMode, focusDepth, hiddenTypes]);

  // Warning node IDs visible in current filter (used to dim out-of-view warnings)
  const visibleWarningIds = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return new Set(analysis.warnings.filter(w => nodeIds.has(w.nodeId)).map(w => w.nodeId));
  }, [filteredNodes]);

  const warningNodeIds = useMemo(
    () => new Set(analysis.warnings.map(w => w.nodeId)),
    []
  );

  const deadEndSet = useMemo(() => new Set(analysis.deadEnds), []);
  const unreachableSet = useMemo(() => new Set(analysis.unreachable), []);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (filter === "focus") {
      // In focus mode, clicking a node re-targets the focus
      setFocusTarget(nodeId);
      setSelectedNode(nodeId);
      setHighlightUpstream(null);
    } else if (selectedNode === nodeId) {
      setSelectedNode(null);
      setHighlightUpstream(null);
    } else {
      setSelectedNode(nodeId);
      setHighlightUpstream(getUpstream(nodeId));
    }
  }, [selectedNode, filter]);

  // D3 simulation
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    if (filteredNodes.length === 0) return;

    const width = svgEl.clientWidth || 1200;
    const height = svgEl.clientHeight || 800;

    // Build sim data
    const simNodes: SimNode[] = filteredNodes.map(n => ({ ...n }));
    const nodeMap = new Map(simNodes.map(n => [n.id, n]));
    const simLinks: SimLink[] = filteredEdges
      .filter(e => nodeMap.has(e.from) && nodeMap.has(e.to))
      .map(e => ({ source: nodeMap.get(e.from)!, target: nodeMap.get(e.to)!, relation: e.relation }));

    // Container with zoom
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as unknown as (selection: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void);

    // Arrow markers
    const defs = svg.append("defs");
    const markerRelations = ["produces", "consumes", "requires_skill", "requires_biome", "requires_tool",
      "requires_building", "requires_item", "requires_vessel", "requires_biome_discovered", "discovers", "trains", "builds"];
    for (const rel of markerRelations) {
      defs.append("marker")
        .attr("id", `arrow-${rel}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#4a6a5a");
    }

    // Links
    const link = g.append("g")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "#2a4a3a")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", d => `url(#arrow-${d.relation})`);

    // Nodes
    const node = g.append("g")
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(simNodes)
      .join("circle")
      .attr("r", d => NODE_RADIUS[d.type] ?? 6)
      .attr("fill", d => NODE_COLORS[d.type] ?? "#888")
      .attr("stroke", d => {
        if (warningNodeIds.has(d.id)) return "#ff4444";
        if (deadEndSet.has(d.id)) return "#ffaa00";
        if (unreachableSet.has(d.id)) return "#ff0000";
        return "#1a3a2a";
      })
      .attr("stroke-width", d => warningNodeIds.has(d.id) ? 3 : 1.5)
      .attr("cursor", "pointer")
      .on("click", (_, d) => handleNodeClick(d.id))
      .call(d3.drag<SVGCircleElement, SimNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Labels
    const label = g.append("g")
      .selectAll("text")
      .data(simNodes)
      .join("text")
      .text(d => d.label)
      .attr("font-size", 9)
      .attr("fill", "#a0b8a8")
      .attr("dx", d => (NODE_RADIUS[d.type] ?? 6) + 3)
      .attr("dy", 3)
      .attr("pointer-events", "none");

    // Tooltip on hover
    node.append("title").text(d => `${d.type}: ${d.label}\n${d.id}`);

    // Force simulation
    const simulation = d3.forceSimulation(simNodes)
      .force("link", d3.forceLink<SimNode, SimLink>(simLinks)
        .id(d => d.id)
        .distance(60))
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => (NODE_RADIUS[(d as SimNode).type] ?? 6) + 4))
      .on("tick", () => {
        link
          .attr("x1", d => (d.source as SimNode).x!)
          .attr("y1", d => (d.source as SimNode).y!)
          .attr("x2", d => (d.target as SimNode).x!)
          .attr("y2", d => (d.target as SimNode).y!);
        node
          .attr("cx", d => d.x!)
          .attr("cy", d => d.y!);
        label
          .attr("x", d => d.x!)
          .attr("y", d => d.y!);
      });

    // Initial zoom to fit
    setTimeout(() => {
      const bounds = (g.node() as SVGGElement)?.getBBox();
      if (bounds && bounds.width > 0) {
        const padding = 40;
        const scale = Math.min(
          width / (bounds.width + padding * 2),
          height / (bounds.height + padding * 2),
          1.5
        );
        const tx = width / 2 - (bounds.x + bounds.width / 2) * scale;
        const ty = height / 2 - (bounds.y + bounds.height / 2) * scale;
        svg.transition().duration(500).call(
          zoom.transform as never,
          d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
      }
    }, 1000);

    return () => { simulation.stop(); };
  }, [filteredNodes, filteredEdges, handleNodeClick, warningNodeIds, deadEndSet, unreachableSet]);

  // Highlight upstream when a node is selected
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    if (highlightUpstream) {
      svg.selectAll<SVGCircleElement, SimNode>("circle")
        .attr("opacity", d => highlightUpstream.has(d.id) ? 1 : 0.15);
      svg.selectAll<SVGLineElement, SimLink>("line")
        .attr("stroke-opacity", d => {
          const srcId = typeof d.source === "string" ? d.source : (d.source as SimNode).id;
          const tgtId = typeof d.target === "string" ? d.target : (d.target as SimNode).id;
          return highlightUpstream.has(srcId) && highlightUpstream.has(tgtId) ? 0.8 : 0.05;
        });
      svg.selectAll<SVGTextElement, SimNode>("text")
        .attr("opacity", d => highlightUpstream.has(d.id) ? 1 : 0.1);
    } else {
      svg.selectAll("circle").attr("opacity", 1);
      svg.selectAll("line").attr("stroke-opacity", 0.6);
      svg.selectAll("text").attr("opacity", 1);
    }
  }, [highlightUpstream]);

  const selectedNodeData = selectedNode ? allNodes.find(n => n.id === selectedNode) : null;
  const selectedNodeEdges = selectedNode
    ? allEdges.filter(e => e.from === selectedNode || e.to === selectedNode)
    : [];

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <h2 style={styles.title}><a href="?dev" style={{ color: "#7a9a8a", textDecoration: "none" }}>Dev Wiki</a> / Force Graph · <a href="?dev=dot" style={{ color: "#7a9a8a", textDecoration: "none", fontSize: "1rem" }}>DOT Graph</a></h2>
        <div style={styles.filters}>
          <button style={filter === "all" ? styles.filterActive : styles.filterBtn} onClick={() => { setFilter("all"); setSelectedNode(null); setHighlightUpstream(null); }}>All</button>
          <button style={filter === "focus" ? styles.filterActive : styles.filterBtn} onClick={() => { setFilter("focus"); setSelectedNode(null); setHighlightUpstream(null); if (!focusTarget) setFocusTarget("building:dugout"); }}>Focus</button>
          <button style={styles.filterBtn} onClick={() => { setFilter("focus"); setFocusTarget("building:dugout"); setFocusDirection("upstream"); setFocusMode("greedy"); setSelectedNode(null); setHighlightUpstream(null); setHiddenTypes(new Set(["skill_level", "resource"])); }}>Dugout (minimal)</button>
          <button style={filter === "biomes" ? styles.filterActive : styles.filterBtn} onClick={() => { setFilter("biomes"); setSelectedNode(null); setHighlightUpstream(null); }}>Biomes</button>
          <button style={filter === "skill_gates" ? styles.filterActive : styles.filterBtn} onClick={() => { setFilter("skill_gates"); setSelectedNode(null); setHighlightUpstream(null); }}>Skill Gates</button>
          <span style={styles.separator}>|</span>
          {ALL_NODE_TYPES.map(t => (
            <button
              key={t}
              style={filter === t ? styles.filterActive : styles.filterBtn}
              onClick={() => { setFilter(t); setSelectedNode(null); setHighlightUpstream(null); }}
            >
              <span style={{ ...styles.dot, background: NODE_COLORS[t] }} />
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
        {filter === "focus" && (
          <div style={styles.subFilter}>
            <SearchSelect
              value={focusTarget}
              options={allNodes}
              onChange={setFocusTarget}
            />
            <span style={styles.separator}>|</span>
            <button style={focusDirection === "upstream" ? styles.filterActive : styles.filterBtn} onClick={() => setFocusDirection("upstream")}>Upstream</button>
            <button style={focusDirection === "downstream" ? styles.filterActive : styles.filterBtn} onClick={() => setFocusDirection("downstream")}>Downstream</button>
            {focusDirection === "upstream" && (<>
              <span style={styles.separator}>|</span>
              <button style={focusMode === "greedy" ? styles.filterActive : styles.filterBtn} onClick={() => setFocusMode("greedy")}>Greedy</button>
              <button style={focusMode === "all" ? styles.filterActive : styles.filterBtn} onClick={() => setFocusMode("all")}>All paths</button>
            </>)}
            <span style={styles.separator}>|</span>
            <span style={{ color: "#5a7a6a", fontSize: "0.75rem" }}>Depth:</span>
            <button style={focusDepth === null ? styles.filterActive : styles.filterBtn} onClick={() => setFocusDepth(null)}>All</button>
            {[1, 2, 3, 4, 6, 10].map(d => (
              <button key={d} style={focusDepth === d ? styles.filterActive : styles.filterBtn} onClick={() => setFocusDepth(d)}>{d}</button>
            ))}
          </div>
        )}
        {filter === "skill_gates" && (
          <div style={styles.subFilter}>
            {Object.keys(analysis.skillGates).map(s => (
              <button
                key={s}
                style={selectedSkill === s ? styles.filterActive : styles.filterBtn}
                onClick={() => setSelectedSkill(s)}
              >{s}</button>
            ))}
          </div>
        )}
        {/* Visual type hiding toggles */}
        <div style={styles.subFilter}>
          <span style={{ color: "#5a7a6a", fontSize: "0.75rem", marginRight: "0.25rem" }}>Hide:</span>
          {ALL_NODE_TYPES.map(t => (
            <button
              key={t}
              style={hiddenTypes.has(t) ? styles.hideActive : styles.hideBtn}
              onClick={() => toggleHiddenType(t)}
              title={hiddenTypes.has(t) ? `Show ${t} nodes` : `Hide ${t} nodes (edges bridge through)`}
            >
              <span style={{ ...styles.dot, background: NODE_COLORS[t], opacity: hiddenTypes.has(t) ? 0.3 : 1 }} />
              {t.replace("_", " ")}
            </button>
          ))}
          {hiddenTypes.size > 0 && (
            <button style={styles.filterBtn} onClick={() => setHiddenTypes(new Set())}>show all</button>
          )}
        </div>
      </div>

      <div style={styles.graphWrap}>
        <svg ref={svgRef} style={styles.svg} />
      </div>

      <div style={styles.statsBar}>
        {filteredNodes.length} nodes · {filteredEdges.length} edges
        {selectedNode && <span> · Selected: <strong>{selectedNodeData?.label}</strong> ({selectedNodeData?.type}) — click again to deselect</span>}
      </div>

      {/* Selected node detail panel */}
      {selectedNode && selectedNodeData && (
        <div style={styles.detailPanel}>
          <h3 style={styles.detailTitle}>{selectedNodeData.label} <span style={styles.detailType}>{selectedNodeData.type}</span></h3>
          <p style={styles.detailId}>{selectedNodeData.id}</p>
          {filter !== "focus" && (
            <button style={styles.filterBtn} onClick={() => { setFilter("focus"); setFocusTarget(selectedNode); }}>Focus on this node</button>
          )}
          {selectedNodeEdges.length > 0 && (
            <div>
              <strong style={styles.detailLabel}>Connections:</strong>
              <ul style={styles.detailList}>
                {selectedNodeEdges.map((e, i) => {
                  const other = e.from === selectedNode ? e.to : e.from;
                  const direction = e.from === selectedNode ? "→" : "←";
                  const otherNode = allNodes.find(n => n.id === other);
                  return (
                    <li key={i} style={styles.detailListItem}>
                      {direction} <span style={styles.detailRelation}>{e.relation}</span> {otherNode?.label ?? other}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Warnings panel — always visible */}
      <div style={styles.warningsPanel}>
        <h3 style={styles.warningsTitle}>Warnings ({analysis.warnings.length})</h3>
        {analysis.warnings.length === 0 && <p style={{ color: "#5a7a6a", fontSize: "0.85rem" }}>No warnings — all clear.</p>}
        {analysis.warnings.map((w, i) => {
          const inView = visibleWarningIds.has(w.nodeId);
          return (
            <div
              key={i}
              style={{
                ...styles.warningItem,
                borderLeft: `3px solid ${w.type === "unreachable" ? "#ff4444" : w.type === "dead_end" ? "#ffaa00" : "#7ab4de"}`,
                cursor: "pointer",
                opacity: inView ? 1 : 0.45,
              }}
              onClick={() => handleNodeClick(w.nodeId)}
            >
              <span style={styles.warningType}>{w.type}</span>
              <span>{w.message}</span>
            </div>
          );
        })}
      </div>

      {/* Biome progression tiers */}
      {filter === "biomes" && (
        <div style={styles.biomePanel}>
          <h3 style={styles.warningsTitle}>Biome Progression</h3>
          {analysis.biomeProgression.tiers.map((t, i) => (
            <div key={i} style={styles.biomeTier}>
              <span style={styles.biomeTierLabel}>Tier {t.tier}</span>
              <span style={styles.biomeName}>{t.biomes.join(", ")}</span>
              {t.gatedBy && <span style={styles.biomeGate}>{t.gatedBy}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Skill gate details */}
      {filter === "skill_gates" && selectedSkill && analysis.skillGates[selectedSkill] && (
        <div style={styles.biomePanel}>
          <h3 style={styles.warningsTitle}>{selectedSkill} Level Gates</h3>
          {analysis.skillGates[selectedSkill].map((g, i) => (
            <div key={i} style={styles.biomeTier}>
              <span style={styles.biomeTierLabel}>Lv {g.level}</span>
              <div>
                <div><strong style={styles.detailLabel}>Unlocks:</strong> {g.unlocks.join(", ") || "none"}</div>
                <div><strong style={styles.detailLabel}>Trained by:</strong> {g.trainedBy.join(", ") || "none"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────
// Styles
// ───────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#0c1a1a",
    color: "#e8e4d8",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  toolbar: {
    padding: "1rem",
    borderBottom: "1px solid #1e3a3a",
  },
  title: {
    color: "#f0a050",
    margin: "0 0 0.75rem 0",
    fontSize: "1.5rem",
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
    alignItems: "center",
  },
  filterBtn: {
    background: "#132626",
    border: "1px solid #1e3a3a",
    color: "#a0b8a8",
    padding: "0.3rem 0.6rem",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  filterActive: {
    background: "#1e4a3a",
    border: "1px solid #f0a050",
    color: "#f0a050",
    padding: "0.3rem 0.6rem",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  subFilter: {
    marginTop: "0.5rem",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
    alignItems: "center",
  },
  focusSelect: {
    background: "#132626",
    border: "1px solid #1e3a3a",
    color: "#a0b8a8",
    padding: "0.3rem 0.5rem",
    borderRadius: 4,
    fontSize: "0.8rem",
    width: 260,
    outline: "none",
  },
  searchDropdown: {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    width: 300,
    maxHeight: 280,
    overflowY: "auto" as const,
    background: "#132626",
    border: "1px solid #1e3a3a",
    borderRadius: 4,
    zIndex: 100,
    marginTop: 2,
  },
  searchOption: {
    padding: "0.35rem 0.6rem",
    cursor: "pointer",
    fontSize: "0.8rem",
    color: "#a0b8a8",
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  separator: {
    color: "#3a5a4a",
    margin: "0 0.25rem",
  },
  dot: {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  graphWrap: {
    width: "100%",
    height: "60vh",
    minHeight: 400,
  },
  svg: {
    width: "100%",
    height: "100%",
    background: "#0a1414",
  },
  statsBar: {
    padding: "0.5rem 1rem",
    background: "#0e2020",
    fontSize: "0.8rem",
    color: "#7a9a8a",
    borderTop: "1px solid #1e3a3a",
  },
  detailPanel: {
    margin: "0.5rem 1rem",
    padding: "1rem",
    background: "#132626",
    borderRadius: 8,
    border: "1px solid #1e3a3a",
  },
  detailTitle: {
    margin: "0 0 0.25rem 0",
    color: "#f0a050",
  },
  detailType: {
    fontSize: "0.8rem",
    color: "#7a9a8a",
    fontWeight: "normal",
  },
  detailId: {
    fontSize: "0.8rem",
    color: "#5a7a6a",
    fontFamily: "monospace",
    margin: "0 0 0.5rem 0",
  },
  detailLabel: {
    color: "#a0b8a8",
    fontSize: "0.85rem",
  },
  detailList: {
    margin: "0.25rem 0 0 0",
    paddingLeft: "1.25rem",
    fontSize: "0.8rem",
  },
  detailListItem: {
    color: "#7a9a8a",
    marginBottom: "0.15rem",
  },
  detailRelation: {
    color: "#7ab4de",
    fontStyle: "italic",
  },
  warningsPanel: {
    margin: "0.5rem 1rem",
    padding: "1rem",
    background: "#1a1a10",
    borderRadius: 8,
    border: "1px solid #3a3a1a",
  },
  warningsTitle: {
    color: "#ffaa00",
    margin: "0 0 0.5rem 0",
    fontSize: "1rem",
  },
  warningItem: {
    padding: "0.4rem 0.6rem",
    marginBottom: "0.3rem",
    fontSize: "0.8rem",
    color: "#c0b880",
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  warningType: {
    background: "#2a2a1a",
    padding: "0.1rem 0.4rem",
    borderRadius: 3,
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#a0a060",
    whiteSpace: "nowrap",
  },
  biomePanel: {
    margin: "0.5rem 1rem",
    padding: "1rem",
    background: "#132626",
    borderRadius: 8,
    border: "1px solid #1e3a3a",
  },
  biomeTier: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "flex-start",
    padding: "0.4rem 0",
    borderBottom: "1px solid #1e3a3a",
    fontSize: "0.85rem",
  },
  biomeTierLabel: {
    background: "#1e4a3a",
    padding: "0.1rem 0.5rem",
    borderRadius: 3,
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#7acea0",
    whiteSpace: "nowrap",
  },
  biomeName: {
    color: "#e8e4d8",
    fontWeight: 600,
  },
  biomeGate: {
    color: "#7a9a8a",
    fontSize: "0.8rem",
  },
  hideBtn: {
    background: "#132626",
    border: "1px solid #1e3a3a",
    color: "#a0b8a8",
    padding: "0.2rem 0.5rem",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  hideActive: {
    background: "#1a1a10",
    border: "1px solid #5a5a3a",
    color: "#7a7a5a",
    padding: "0.2rem 0.5rem",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    textDecoration: "line-through",
  },
};
