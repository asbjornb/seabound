import { useMemo, useRef, useEffect } from "react";
import { getResources, getSkills } from "../data/registry";
import { RESOURCE_ICONS, SKILL_ICONS } from "../data/icons";
import type {
  ActionDef,
  RecipeDef,
  StationDef,
  ExpeditionDef,
} from "../data/types";
import { CloseIcon } from "./CloseIcon";
import { GameIcon } from "./GameIcon";

type SearchResultType = "gather" | "craft" | "build" | "tend" | "explore";

interface SearchResult {
  type: SearchResultType;
  id: string;
  iconId: string;
  name: string;
  description: string;
  skillId: string;
  inputs: string[];
  outputs: string[];
  score: number;
  def: ActionDef | RecipeDef | StationDef | ExpeditionDef;
}

interface Props {
  query: string;
  onChangeQuery: (q: string) => void;
  onClose: () => void;
  actions: ActionDef[];
  recipes: RecipeDef[];
  stations: StationDef[];
  expeditions: ExpeditionDef[];
  onStartAction: (action: ActionDef) => void;
  onStartCraft: (recipe: RecipeDef) => void;
  onDeployStation: (station: StationDef) => void;
  onStartExpedition: (expedition: ExpeditionDef) => void;
  onJumpToTab: (tab: string) => void;
}

function buildIndex(
  actions: ActionDef[],
  recipes: RecipeDef[],
  stations: StationDef[],
  expeditions: ExpeditionDef[],
): SearchResult[] {
  const RESOURCES = getResources();
  const resName = (id: string) => RESOURCES[id]?.name ?? id;

  const results: SearchResult[] = [];

  for (const a of actions) {
    const tabType: SearchResultType = a.panel === "build" ? "build" : "gather";
    const iconId = a.drops[0]?.resourceId ?? a.skillId;
    results.push({
      type: tabType,
      id: a.id,
      iconId,
      name: a.name,
      description: a.description,
      skillId: a.skillId,
      inputs: [
        ...(a.requiredTools ?? []),
        ...(a.requiredResources?.map(resName) ?? []),
      ],
      outputs: a.drops.map((d) => resName(d.resourceId)),
      score: 0,
      def: a,
    });
  }

  for (const r of recipes) {
    const tabType: SearchResultType = r.panel === "build" ? "build" : "craft";
    const iconId = r.output?.resourceId ?? r.toolOutput ?? r.buildingOutput ?? r.skillId;
    results.push({
      type: tabType,
      id: r.id,
      iconId,
      name: r.name,
      description: r.description,
      skillId: r.skillId,
      inputs: r.inputs.map((i) => resName(i.resourceId)),
      outputs: r.output
        ? [resName(r.output.resourceId)]
        : r.toolOutput
          ? [r.toolOutput]
          : r.buildingOutput
            ? [r.buildingOutput]
            : [],
      score: 0,
      def: r,
    });
  }

  for (const s of stations) {
    const iconId = s.yields[0]?.resourceId ?? s.skillId;
    results.push({
      type: "tend",
      id: s.id,
      iconId,
      name: s.name,
      description: s.description,
      skillId: s.skillId,
      inputs: s.setupInputs?.map((i) => resName(i.resourceId)) ?? [],
      outputs: s.yields.map((y) => resName(y.resourceId)),
      score: 0,
      def: s,
    });
  }

  for (const e of expeditions) {
    const firstBiome = e.outcomes.find((o) => o.biomeDiscovery)?.biomeDiscovery;
    const iconId = firstBiome ? `biome_${firstBiome}` : e.skillId;
    results.push({
      type: "explore",
      id: e.id,
      iconId,
      name: e.name,
      description: e.description,
      skillId: e.skillId,
      inputs: e.inputs?.map((i) => resName(i.resourceId)) ?? [],
      outputs: e.outcomes
        .flatMap((o) => o.drops?.map((d) => resName(d.resourceId)) ?? [])
        .filter((v, i, a) => a.indexOf(v) === i),
      score: 0,
      def: e,
    });
  }

  return results;
}

function scoreResult(result: SearchResult, terms: string[]): number {
  let score = 0;
  const nameLower = result.name.toLowerCase();
  const descLower = result.description.toLowerCase();
  const inputsLower = result.inputs.map((i) => i.toLowerCase());
  const outputsLower = result.outputs.map((o) => o.toLowerCase());

  for (const term of terms) {
    // Name match (highest priority)
    if (nameLower === term) {
      score += 100;
    } else if (nameLower.startsWith(term)) {
      score += 60;
    } else if (nameLower.includes(term)) {
      score += 40;
    }

    // Output match (second priority — "what does this produce?")
    for (const o of outputsLower) {
      if (o === term) score += 50;
      else if (o.includes(term)) score += 30;
    }

    // Input match (third priority — "what uses this?")
    for (const i of inputsLower) {
      if (i === term) score += 35;
      else if (i.includes(term)) score += 20;
    }

    // Description match (lowest priority)
    if (descLower.includes(term)) {
      score += 10;
    }
  }

  return score;
}

const TYPE_LABELS: Record<SearchResultType, string> = {
  gather: "Gather",
  craft: "Craft",
  build: "Build",
  tend: "Tend",
  explore: "Explore",
};

export function SearchPanel({
  query,
  onChangeQuery,
  onClose,
  actions,
  recipes,
  stations,
  expeditions,
  onStartAction,
  onStartCraft,
  onDeployStation,
  onStartExpedition,
  onJumpToTab,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const SKILLS = getSkills();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const index = useMemo(
    () => buildIndex(actions, recipes, stations, expeditions),
    [actions, recipes, stations, expeditions],
  );

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    const terms = trimmed.split(/\s+/);
    const scored: SearchResult[] = [];
    for (const r of index) {
      const s = scoreResult(r, terms);
      if (s > 0) scored.push({ ...r, score: s });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 20);
  }, [query, index]);

  const handleStart = (result: SearchResult) => {
    const { type, def } = result;
    if (type === "gather" || type === "build") {
      if ("drops" in def && "durationMs" in def && "panel" in def) {
        onStartAction(def as ActionDef);
      }
    } else if (type === "craft") {
      onStartCraft(def as RecipeDef);
    } else if (type === "tend") {
      onDeployStation(def as StationDef);
    } else if (type === "explore") {
      onStartExpedition(def as ExpeditionDef);
    }
    onClose();
  };

  const handleJump = (result: SearchResult) => {
    onJumpToTab(result.type);
    onClose();
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-row">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search actions, recipes, resources..."
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
          />
          <button className="modal-close-btn" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="search-results">
          {query.trim() && results.length === 0 && (
            <div className="search-empty">No matches found</div>
          )}
          {results.map((r) => (
            <div key={`${r.type}-${r.id}`} className="search-result-card">
              <div className="search-result-header">
                <span className="search-result-name">
                  <GameIcon id={r.iconId} size={18} />
                  {r.name}
                </span>
                <span className="search-result-type">{TYPE_LABELS[r.type]}</span>
              </div>
              <div className="search-result-meta">
                <span className="search-result-skill">
                  {SKILL_ICONS[r.skillId] ?? ""} {SKILLS[r.skillId]?.name ?? r.skillId}
                </span>
                {r.outputs.length > 0 && (
                  <span className="search-result-outputs">
                    &rarr;{" "}
                    {r.outputs.slice(0, 4).map((o, i) => (
                      <span key={i} className="search-resource-tag">
                        {RESOURCE_ICONS[o] ?? ""} {o}
                      </span>
                    ))}
                    {r.outputs.length > 4 && <span className="search-resource-tag">+{r.outputs.length - 4}</span>}
                  </span>
                )}
              </div>
              {r.inputs.length > 0 && (
                <div className="search-result-inputs">
                  Needs:{" "}
                  {r.inputs.slice(0, 4).map((inp, i) => (
                    <span key={i} className="search-resource-tag dim">
                      {inp}
                    </span>
                  ))}
                  {r.inputs.length > 4 && <span className="search-resource-tag dim">+{r.inputs.length - 4}</span>}
                </div>
              )}
              <div className="search-result-actions">
                <button
                  className="search-start-btn"
                  onClick={() => handleStart(r)}
                >
                  {r.type === "tend" ? "Deploy" : r.type === "explore" ? "Embark" : "Start"}
                </button>
                <button
                  className="search-jump-btn"
                  onClick={() => handleJump(r)}
                >
                  Go to {TYPE_LABELS[r.type]}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
