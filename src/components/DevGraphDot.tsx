import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Graphviz } from "@hpcc-js/wasm-graphviz";
import {
  type GraphNode, type GraphEdge, type FocusDirection, type FocusMode, type FilterMode,
  NODE_COLORS, ALL_NODE_TYPES,
  allNodes, analysis,
  getFilteredData, applyTypeHiding,
} from "./devGraphShared";

// ───────────────────────────────────────────────
// DOT generation
// ───────────────────────────────────────────────

const EDGE_COLORS: Record<string, string> = {
  produces: "#7acea0",
  consumes: "#de7a7a",
  requires_skill: "#7ab4de",
  requires_biome: "#5aaa5a",
  requires_tool: "#d4c87a",
  requires_building: "#b47ade",
  requires_item: "#d4c87a",
  requires_vessel: "#7adede",
  requires_biome_discovered: "#5aaa5a",
  discovers: "#5aaa5a",
  trains: "#7ab4de",
  builds: "#b47ade",
  speeds_up: "#555",
  boosts_output: "#555",
};

const NODE_SHAPES: Record<string, string> = {
  resource: "ellipse",
  action: "box",
  recipe: "box",
  building: "house",
  biome: "hexagon",
  skill_level: "diamond",
  expedition: "octagon",
  station: "component",
};

function escDot(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function buildDotString(nodes: GraphNode[], edges: GraphEdge[]): string {
  const lines: string[] = [];
  lines.push("digraph G {");
  lines.push("  rankdir=LR;");
  lines.push('  bgcolor="#0a1414";');
  lines.push('  node [style=filled, fontname="Segoe UI, system-ui, sans-serif", fontsize=10, fontcolor="#e8e4d8"];');
  lines.push('  edge [fontname="Segoe UI, system-ui, sans-serif", fontsize=8];');

  const nodeIds = new Set(nodes.map(n => n.id));

  // Group nodes by type into subgraphs for better clustering
  const byType = new Map<string, GraphNode[]>();
  for (const n of nodes) {
    if (!byType.has(n.type)) byType.set(n.type, []);
    byType.get(n.type)!.push(n);
  }

  for (const [type, typeNodes] of byType) {
    lines.push(`  subgraph cluster_${type} {`);
    lines.push("    style=invis;");
    for (const n of typeNodes) {
      const color = NODE_COLORS[n.type] ?? "#888";
      const shape = NODE_SHAPES[n.type] ?? "ellipse";
      const isWarning = analysis.warnings.some(w => w.nodeId === n.id);
      const isDeadEnd = analysis.deadEnds.includes(n.id);
      const isUnreachable = analysis.unreachable.includes(n.id);
      const penwidth = isWarning || isDeadEnd || isUnreachable ? "3" : "1";
      const borderColor = isUnreachable ? "#ff0000" : isDeadEnd ? "#ffaa00" : isWarning ? "#ff4444" : "#1a3a2a";
      lines.push(`    "${escDot(n.id)}" [label="${escDot(n.label)}", shape=${shape}, fillcolor="${color}", color="${borderColor}", penwidth=${penwidth}];`);
    }
    lines.push("  }");
  }

  // Edges
  for (const e of edges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    const color = EDGE_COLORS[e.relation] ?? "#4a6a5a";
    const style = e.relation === "speeds_up" || e.relation === "boosts_output" ? "dashed" : "solid";
    lines.push(`  "${escDot(e.from)}" -> "${escDot(e.to)}" [color="${color}", style=${style}, tooltip="${escDot(e.relation)}"];`);
  }

  lines.push("}");
  return lines.join("\n");
}

// ───────────────────────────────────────────────
// Search select (shared with DevGraph — keep local for simplicity)
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

// ───────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────

export function DevGraphDot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const [focusDirection, setFocusDirection] = useState<FocusDirection>("upstream");
  const [focusMode, setFocusMode] = useState<FocusMode>("greedy");
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [graphviz, setGraphviz] = useState<Graphviz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pan/zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number; midX: number; midY: number } | null>(null);
  const [fitted, setFitted] = useState(false);

  // Load graphviz WASM
  useEffect(() => {
    Graphviz.load().then(gv => {
      setGraphviz(gv);
      setLoading(false);
    }).catch(err => {
      setError(`Failed to load Graphviz: ${err.message}`);
      setLoading(false);
    });
  }, []);

  const toggleHiddenType = useCallback((type: string) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const { nodes: filteredNodes, edges: filteredEdges } = useMemo(() => {
    const base = getFilteredData(filter, selectedSkill, focusTarget, focusDirection, focusMode);
    return applyTypeHiding(base.nodes, base.edges, hiddenTypes);
  }, [filter, selectedSkill, focusTarget, focusDirection, focusMode, hiddenTypes]);

  // Generate DOT and render SVG
  const svgContent = useMemo(() => {
    if (!graphviz || filteredNodes.length === 0) return null;
    try {
      const dot = buildDotString(filteredNodes, filteredEdges);
      return graphviz.dot(dot, "svg");
    } catch (err) {
      console.error("DOT render error:", err);
      return null;
    }
  }, [graphviz, filteredNodes, filteredEdges]);

  // Reset transform when filter changes
  useEffect(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setFitted(false);
  }, [filter, selectedSkill, focusTarget, focusDirection, focusMode, hiddenTypes]);

  // Auto-fit SVG to container on first render / filter change
  useEffect(() => {
    if (fitted || !svgContent || !containerRef.current) return;
    // Parse SVG dimensions from the rendered output
    const match = svgContent.match(/<svg[^>]*\swidth="(\d+(?:\.\d+)?)(?:pt|px)?"[^>]*\sheight="(\d+(?:\.\d+)?)(?:pt|px)?"/);
    if (!match) return;
    // Graphviz uses pt (1pt = 1.33px)
    const svgW = parseFloat(match[1]) * 1.33;
    const svgH = parseFloat(match[2]) * 1.33;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 20;
    const scale = Math.min(
      (rect.width - padding * 2) / svgW,
      (rect.height - padding * 2) / svgH,
      2
    );
    const tx = (rect.width - svgW * scale) / 2;
    const ty = (rect.height - svgH * scale) / 2;
    setTransform({ x: tx, y: ty, scale });
    setFitted(true);
  }, [svgContent, fitted]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale * delta, 0.1), 5);
      // Zoom toward cursor
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const newX = mx - (mx - prev.x) * (newScale / prev.scale);
      const newY = my - (my - prev.y) * (newScale / prev.scale);
      return { x: newX, y: newY, scale: newScale };
    });
  }, []);

  // Mouse drag pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startTx: transform.x, startTy: transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTransform(prev => ({ ...prev, x: dragRef.current!.startTx + dx, y: dragRef.current!.startTy + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Touch: single-finger pan, two-finger pinch-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragRef.current = { startX: t.clientX, startY: t.clientY, startTx: transform.x, startTy: transform.y };
      pinchRef.current = null;
    } else if (e.touches.length === 2) {
      dragRef.current = null;
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      pinchRef.current = {
        dist,
        scale: transform.scale,
        midX: (a.clientX + b.clientX) / 2 - rect.left,
        midY: (a.clientY + b.clientY) / 2 - rect.top,
      };
    }
  }, [transform]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragRef.current) {
      const t = e.touches[0];
      const dx = t.clientX - dragRef.current.startX;
      const dy = t.clientY - dragRef.current.startY;
      setTransform(prev => ({ ...prev, x: dragRef.current!.startTx + dx, y: dragRef.current!.startTy + dy }));
    } else if (e.touches.length === 2 && pinchRef.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = dist / pinchRef.current.dist;
      const newScale = Math.min(Math.max(pinchRef.current.scale * ratio, 0.1), 5);
      const mx = pinchRef.current.midX;
      const my = pinchRef.current.midY;
      setTransform(prev => ({
        x: mx - (mx - prev.x) * (newScale / prev.scale),
        y: my - (my - prev.y) * (newScale / prev.scale),
        scale: newScale,
      }));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragRef.current = null;
    pinchRef.current = null;
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <h2 style={styles.title}>
          <a href="?dev" style={{ color: "#7a9a8a", textDecoration: "none" }}>Dev Wiki</a>
          {" / "}
          <a href="?dev=graph" style={{ color: "#7a9a8a", textDecoration: "none" }}>Force Graph</a>
          {" / "}
          DOT Graph
        </h2>
        <div style={styles.filters}>
          <button style={filter === "all" ? styles.filterActive : styles.filterBtn} onClick={() => { setFilter("all"); }}>All</button>
          <button style={filter === "focus" ? styles.filterActive : styles.filterBtn} onClick={() => { setFilter("focus"); if (!focusTarget) setFocusTarget("building:dugout"); }}>Focus</button>
          <button style={styles.filterBtn} onClick={() => { setFilter("focus"); setFocusTarget("building:dugout"); setFocusDirection("upstream"); setFocusMode("greedy"); setHiddenTypes(new Set(["skill_level", "resource"])); }}>Dugout (minimal)</button>
          <button style={filter === "biomes" ? styles.filterActive : styles.filterBtn} onClick={() => { setFilter("biomes"); }}>Biomes</button>
          <button style={filter === "skill_gates" ? styles.filterActive : styles.filterBtn} onClick={() => { setFilter("skill_gates"); }}>Skill Gates</button>
          <span style={styles.separator}>|</span>
          {ALL_NODE_TYPES.map(t => (
            <button
              key={t}
              style={filter === t ? styles.filterActive : styles.filterBtn}
              onClick={() => { setFilter(t); }}
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

      <div
        ref={containerRef}
        style={styles.graphWrap}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {loading && <div style={styles.loadingMsg}>Loading Graphviz WASM...</div>}
        {error && <div style={styles.errorMsg}>{error}</div>}
        {!loading && !error && svgContent && (
          <div
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
              width: "fit-content",
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
        {!loading && !error && !svgContent && filteredNodes.length === 0 && (
          <div style={styles.loadingMsg}>No nodes match the current filter.</div>
        )}
      </div>

      <div style={styles.statsBar}>
        {filteredNodes.length} nodes · {filteredEdges.length} edges
        <span style={{ marginLeft: "1rem", color: "#5a7a6a" }}>Scroll to zoom, drag to pan</span>
      </div>

      {/* Warnings panel */}
      <div style={styles.warningsPanel}>
        <h3 style={styles.warningsTitle}>Warnings ({analysis.warnings.length})</h3>
        {analysis.warnings.length === 0 && <p style={{ color: "#5a7a6a", fontSize: "0.85rem" }}>No warnings — all clear.</p>}
        {analysis.warnings.map((w, i) => {
          const inView = filteredNodes.some(n => n.id === w.nodeId);
          return (
            <div
              key={i}
              style={{
                ...styles.warningItem,
                borderLeft: `3px solid ${w.type === "unreachable" ? "#ff4444" : w.type === "dead_end" ? "#ffaa00" : "#7ab4de"}`,
                opacity: inView ? 1 : 0.45,
              }}
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

      {/* Legend */}
      <div style={styles.legendPanel}>
        <h3 style={{ ...styles.warningsTitle, color: "#7a9a8a" }}>Legend</h3>
        <div style={styles.legendGrid}>
          <div style={styles.legendSection}>
            <strong style={styles.detailLabel}>Node shapes</strong>
            {ALL_NODE_TYPES.map(t => (
              <div key={t} style={styles.legendItem}>
                <span style={{ ...styles.dot, background: NODE_COLORS[t] }} />
                <span>{t.replace("_", " ")} ({NODE_SHAPES[t]})</span>
              </div>
            ))}
          </div>
          <div style={styles.legendSection}>
            <strong style={styles.detailLabel}>Edge colors</strong>
            {Object.entries(EDGE_COLORS).filter(([, c]) => c !== "#555").map(([rel, color]) => (
              <div key={rel} style={styles.legendItem}>
                <span style={{ display: "inline-block", width: 16, height: 3, background: color, borderRadius: 1 }} />
                <span>{rel.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
    height: "70vh",
    minHeight: 400,
    overflow: "hidden",
    background: "#0a1414",
    cursor: "grab",
    position: "relative",
    touchAction: "none",
  },
  loadingMsg: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#5a7a6a",
    fontSize: "1.2rem",
  },
  errorMsg: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#de7a7a",
    fontSize: "1.2rem",
  },
  statsBar: {
    padding: "0.5rem 1rem",
    background: "#0e2020",
    fontSize: "0.8rem",
    color: "#7a9a8a",
    borderTop: "1px solid #1e3a3a",
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
  detailLabel: {
    color: "#a0b8a8",
    fontSize: "0.85rem",
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
  legendPanel: {
    margin: "0.5rem 1rem",
    padding: "1rem",
    background: "#132626",
    borderRadius: 8,
    border: "1px solid #1e3a3a",
  },
  legendGrid: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
  },
  legendSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    fontSize: "0.8rem",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    color: "#7a9a8a",
  },
};
