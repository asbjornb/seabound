import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  getActions,
  getBuildings,
  getExpeditions,
  getRecipes,
  getResources,
  getStations,
  getTools,
} from "../data/registry";
import { GameState } from "../data/types";
import { GameIcon } from "./GameIcon";
import { selectAvailableActions, selectAvailableRecipes, selectAvailableExpeditions } from "../engine/selectors";

// ── Context ──────────────────────────────────────────────

const ItemLookupContext = createContext<(id: string) => void>(() => {});
export const useItemLookup = () => useContext(ItemLookupContext);

// ── Provider + Modal ─────────────────────────────────────

// Re-export the open-browse hook via a second context
const OpenBrowseContext = createContext<() => void>(() => {});
export const useOpenBrowse = () => useContext(OpenBrowseContext);

export function ItemLookupWithBrowse({
  children,
  state,
}: {
  children: React.ReactNode;
  state: GameState;
}) {
  const [itemId, setItemId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [browseOpen, setBrowseOpen] = useState(false);

  const openLookup = useCallback(
    (id: string) => {
      setItemId((prev) => {
        if (prev) setHistory((h) => [...h, prev]);
        return id;
      });
      setBrowseOpen(false);
    },
    [],
  );

  const goBack = useCallback(() => {
    setHistory((h) => {
      const prev = h[h.length - 1];
      setItemId(prev ?? null);
      return h.slice(0, -1);
    });
  }, []);

  const close = useCallback(() => {
    setItemId(null);
    setHistory([]);
  }, []);

  const openBrowse = useCallback(() => {
    setBrowseOpen(true);
    setItemId(null);
    setHistory([]);
  }, []);

  const closeBrowse = useCallback(() => {
    setBrowseOpen(false);
  }, []);

  return (
    <ItemLookupContext.Provider value={openLookup}>
      <OpenBrowseContext.Provider value={openBrowse}>
        {children}
        {itemId && (
          <ItemDetail
            itemId={itemId}
            state={state}
            onBack={history.length > 0 ? goBack : undefined}
            onClose={close}
            onNavigate={openLookup}
          />
        )}
        {browseOpen && !itemId && (
          <BrowseItems
            state={state}
            onSelect={openLookup}
            onClose={closeBrowse}
          />
        )}
      </OpenBrowseContext.Provider>
    </ItemLookupContext.Provider>
  );
}

// ── Data helpers ─────────────────────────────────────────

interface SourceEntry {
  type: "action" | "recipe" | "expedition" | "station";
  name: string;
  detail: string;
  /** Item IDs referenced (inputs, requirements) — tappable */
  refs: { id: string; label: string; amount?: number }[];
}

function getSourcesFor(itemId: string): SourceEntry[] {
  const sources: SourceEntry[] = [];
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const BUILDINGS = getBuildings();
  const nameOf = (id: string) =>
    RESOURCES[id]?.name ?? TOOLS[id]?.name ?? BUILDINGS[id]?.name ?? id.replace(/_/g, " ");

  // Actions that drop this resource
  for (const a of getActions()) {
    if (a.drops.some((d) => d.resourceId === itemId)) {
      const drop = a.drops.find((d) => d.resourceId === itemId)!;
      const reqs: string[] = [];
      if (a.requiredBiome) reqs.push(`biome: ${a.requiredBiome.replace(/_/g, " ")}`);
      if (a.requiredSkillLevel && a.requiredSkillLevel > 1) reqs.push(`${a.skillId} lv${a.requiredSkillLevel}`);
      if (a.requiredBuildings?.length) reqs.push(a.requiredBuildings.map(nameOf).join(", "));
      const chancePart = drop.chance != null && drop.chance < 1 ? ` (${Math.round(drop.chance * 100)}%)` : "";
      sources.push({
        type: "action",
        name: a.name,
        detail: `Gather · ${a.skillId}${reqs.length ? " · " + reqs.join(" · ") : ""}${chancePart}`,
        refs: [
          ...(a.requiredTools?.map((id) => ({ id, label: nameOf(id) })) ?? []),
        ],
      });
    }
  }

  // Recipes that output this resource/tool/building
  for (const r of getRecipes()) {
    const produces =
      r.output?.resourceId === itemId ||
      r.toolOutput === itemId ||
      r.buildingOutput === itemId;
    if (!produces) continue;
    const reqs: string[] = [];
    if (r.requiredSkillLevel && r.requiredSkillLevel > 1) reqs.push(`${r.skillId} lv${r.requiredSkillLevel}`);
    if (r.requiredBuildings?.length) reqs.push(r.requiredBuildings.map(nameOf).join(", "));
    const panel = r.panel === "craft" ? "Crafting" : "Construction";
    sources.push({
      type: "recipe",
      name: r.name,
      detail: `${panel} · ${r.skillId}${reqs.length ? " · " + reqs.join(" · ") : ""}`,
      refs: [
        ...r.inputs.map((inp) => ({ id: inp.resourceId, label: nameOf(inp.resourceId), amount: inp.amount })),
        ...(r.requiredTools?.map((id) => ({ id, label: nameOf(id) })) ?? []),
        ...(r.requiredBuildings?.map((id) => ({ id, label: nameOf(id) })) ?? []),
      ],
    });
  }

  // Stations that yield this
  for (const s of getStations()) {
    if (s.yields.some((y) => y.resourceId === itemId)) {
      const reqs: string[] = [];
      if (s.requiredSkillLevel && s.requiredSkillLevel > 1) reqs.push(`${s.skillId} lv${s.requiredSkillLevel}`);
      if (s.requiredBuildings?.length) reqs.push(s.requiredBuildings.map(nameOf).join(", "));
      sources.push({
        type: "station",
        name: s.name,
        detail: `Station · ${s.skillId}${reqs.length ? " · " + reqs.join(" · ") : ""}`,
        refs: s.setupInputs?.map((inp) => ({ id: inp.resourceId, label: nameOf(inp.resourceId), amount: inp.amount })) ?? [],
      });
    }
  }

  // Expeditions that drop this (in outcomes or lootTable)
  for (const e of getExpeditions()) {
    const drops = e.outcomes.some(
      (o) => o.drops?.some((d) => d.resourceId === itemId),
    ) || e.lootTable?.some((d) => d.resourceId === itemId);
    if (drops) {
      sources.push({
        type: "expedition",
        name: e.name,
        detail: `Expedition · ${e.skillId}`,
        refs: [],
      });
    }
  }

  return sources;
}

function getUsesFor(itemId: string): SourceEntry[] {
  const uses: SourceEntry[] = [];
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const BUILDINGS = getBuildings();
  const nameOf = (id: string) =>
    RESOURCES[id]?.name ?? TOOLS[id]?.name ?? BUILDINGS[id]?.name ?? id.replace(/_/g, " ");

  // Recipes that consume this as input
  for (const r of getRecipes()) {
    const isInput = r.inputs.some((inp) => inp.resourceId === itemId);
    if (!isInput) continue;
    const output = r.output
      ? nameOf(r.output.resourceId)
      : r.toolOutput
        ? nameOf(r.toolOutput)
        : r.buildingOutput
          ? nameOf(r.buildingOutput)
          : "XP";
    const outputId = r.output?.resourceId ?? r.toolOutput ?? r.buildingOutput;
    uses.push({
      type: "recipe",
      name: r.name,
      detail: `${r.panel === "craft" ? "Crafting" : "Construction"} · ${r.skillId}`,
      refs: outputId ? [{ id: outputId, label: output }] : [],
    });
  }

  // Recipes that require this as a building
  for (const r of getRecipes()) {
    if (!r.requiredBuildings?.includes(itemId)) continue;
    const output = r.output
      ? nameOf(r.output.resourceId)
      : r.toolOutput
        ? nameOf(r.toolOutput)
        : r.buildingOutput
          ? nameOf(r.buildingOutput)
          : "XP";
    const outputId = r.output?.resourceId ?? r.toolOutput ?? r.buildingOutput;
    uses.push({
      type: "recipe",
      name: r.name,
      detail: `Requires this building · ${r.skillId}`,
      refs: outputId ? [{ id: outputId, label: output }] : [],
    });
  }

  // Recipes that require this as a tool
  for (const r of getRecipes()) {
    if (!r.requiredTools?.includes(itemId)) continue;
    const output = r.output
      ? nameOf(r.output.resourceId)
      : r.toolOutput
        ? nameOf(r.toolOutput)
        : r.buildingOutput
          ? nameOf(r.buildingOutput)
          : "XP";
    const outputId = r.output?.resourceId ?? r.toolOutput ?? r.buildingOutput;
    uses.push({
      type: "recipe",
      name: r.name,
      detail: `Uses this tool · ${r.skillId}`,
      refs: outputId ? [{ id: outputId, label: output }] : [],
    });
  }

  // Stations that consume this
  for (const s of getStations()) {
    if (!s.setupInputs?.some((inp) => inp.resourceId === itemId)) continue;
    uses.push({
      type: "station",
      name: s.name,
      detail: `Station · ${s.skillId}`,
      refs: s.yields.map((y) => ({ id: y.resourceId, label: nameOf(y.resourceId) })),
    });
  }

  // Expeditions that require this as input
  for (const e of getExpeditions()) {
    if (!e.inputs?.some((inp) => inp.resourceId === itemId)) continue;
    uses.push({
      type: "expedition",
      name: e.name,
      detail: `Expedition · ${e.skillId}`,
      refs: [],
    });
  }

  return uses;
}

/** Compute items the player has visibility into. */
function getVisibleItems(state: GameState): string[] {
  const seen = new Set<string>();
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const BUILDINGS = getBuildings();

  // Discovered resources
  for (const id of state.discoveredResources) seen.add(id);

  // Available actions — drops
  for (const a of selectAvailableActions(state)) {
    for (const d of a.drops) seen.add(d.resourceId);
  }

  // Available recipes — inputs and outputs
  for (const r of selectAvailableRecipes(state)) {
    for (const inp of r.inputs) seen.add(inp.resourceId);
    if (r.output) seen.add(r.output.resourceId);
    if (r.toolOutput) seen.add(r.toolOutput);
    if (r.buildingOutput) seen.add(r.buildingOutput);
    if (r.requiredTools) for (const id of r.requiredTools) seen.add(id);
    if (r.requiredBuildings) for (const id of r.requiredBuildings) seen.add(id);
  }

  // Available expeditions — inputs/outputs
  for (const e of selectAvailableExpeditions(state)) {
    if (e.inputs) for (const inp of e.inputs) seen.add(inp.resourceId);
    for (const o of e.outcomes) {
      if (o.drops) for (const d of o.drops) seen.add(d.resourceId);
    }
    if (e.lootTable) for (const d of e.lootTable) seen.add(d.resourceId);
  }

  // Owned tools and buildings
  for (const id of state.tools) seen.add(id);
  for (const id of state.buildings) seen.add(id);

  // Filter to items that actually exist in data
  return [...seen].filter(
    (id) => RESOURCES[id] || TOOLS[id] || BUILDINGS[id],
  );
}

// ── Item Detail Modal ────────────────────────────────────

function ItemDetail({
  itemId,
  state,
  onBack,
  onClose,
  onNavigate,
}: {
  itemId: string;
  state: GameState;
  onBack?: () => void;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const BUILDINGS = getBuildings();
  const def = RESOURCES[itemId] ?? TOOLS[itemId] ?? BUILDINGS[itemId];
  const name = def?.name ?? itemId.replace(/_/g, " ");
  const description = def?.description ?? "";
  const amount = state.resources[itemId] ?? 0;
  const isResource = !!RESOURCES[itemId];

  const sources = useMemo(() => getSourcesFor(itemId), [itemId]);
  const uses = useMemo(() => getUsesFor(itemId), [itemId]);

  return (
    <div className="lookup-overlay" onClick={onClose}>
      <div className="lookup-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="lookup-header">
          <div className="lookup-header-left">
            {onBack && (
              <button className="lookup-back-btn" onClick={onBack}>
                &larr;
              </button>
            )}
            <GameIcon id={itemId} size={28} />
            <div>
              <div className="lookup-item-name">{name}</div>
              {isResource && amount > 0 && (
                <div className="lookup-item-count">You have: {amount}</div>
              )}
            </div>
          </div>
          <button className="lookup-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        {description && <div className="lookup-description">{description}</div>}

        {sources.length > 0 && (
          <div className="lookup-section">
            <div className="lookup-section-title">Obtained from</div>
            {sources.map((s, i) => (
              <SourceCard key={i} entry={s} onNavigate={onNavigate} />
            ))}
          </div>
        )}
        {sources.length === 0 && (
          <div className="lookup-section">
            <div className="lookup-section-title">Obtained from</div>
            <div className="lookup-empty">No known sources</div>
          </div>
        )}

        {uses.length > 0 && (
          <div className="lookup-section">
            <div className="lookup-section-title">Used in</div>
            {uses.map((u, i) => (
              <SourceCard key={i} entry={u} onNavigate={onNavigate} />
            ))}
          </div>
        )}
        {uses.length === 0 && (
          <div className="lookup-section">
            <div className="lookup-section-title">Used in</div>
            <div className="lookup-empty">No known uses</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceCard({
  entry,
  onNavigate,
}: {
  entry: SourceEntry;
  onNavigate: (id: string) => void;
}) {
  return (
    <div className="lookup-source-card">
      <div className="lookup-source-name">{entry.name}</div>
      <div className="lookup-source-detail">{entry.detail}</div>
      {entry.refs.length > 0 && (
        <div className="lookup-source-refs">
          {entry.refs.map((ref, i) => (
            <span
              key={i}
              className="lookup-ref-chip"
              onClick={() => onNavigate(ref.id)}
            >
              <GameIcon id={ref.id} size={14} />
              {ref.amount != null && <span>{ref.amount}x </span>}
              {ref.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Browse / Search Panel ────────────────────────────────

function BrowseItems({
  state,
  onSelect,
  onClose,
}: {
  state: GameState;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const BUILDINGS = getBuildings();

  const visibleItems = useMemo(() => getVisibleItems(state), [state]);

  const items = useMemo(() => {
    const nameOf = (id: string) =>
      RESOURCES[id]?.name ?? TOOLS[id]?.name ?? BUILDINGS[id]?.name ?? id;
    const typeOf = (id: string): string =>
      RESOURCES[id] ? "resource" : TOOLS[id] ? "tool" : "building";
    const list = visibleItems.map((id) => ({
      id,
      name: nameOf(id),
      type: typeOf(id),
      amount: state.resources[id] ?? 0,
    }));
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [visibleItems, state, RESOURCES, TOOLS, BUILDINGS]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="lookup-overlay" onClick={onClose}>
      <div className="lookup-sheet lookup-browse" onClick={(e) => e.stopPropagation()}>
        <div className="lookup-header">
          <div className="lookup-header-left">
            <div className="lookup-item-name">Item Guide</div>
          </div>
          <button className="lookup-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="lookup-search-row">
          <input
            className="lookup-search"
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="lookup-browse-list">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="lookup-browse-item"
              onClick={() => onSelect(item.id)}
            >
              <GameIcon id={item.id} size={20} />
              <span className="lookup-browse-name">{item.name}</span>
              <span className="lookup-browse-type">{item.type}</span>
              {item.type === "resource" && item.amount > 0 && (
                <span className="lookup-browse-amount">{item.amount}</span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="lookup-empty">No matching items</div>
          )}
        </div>
        <div className="lookup-browse-hint">Tap any item for details</div>
      </div>
    </div>
  );
}
