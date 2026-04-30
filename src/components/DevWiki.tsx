import { useState, useCallback } from "react";
import { getActions, getBuildings, getExpeditions, getRecipes, getResources, getTools, getSkills, getMilestonesForSkill, getStations } from "../data/registry";
import { xpForLevel } from "../data/skills";
import { MilestoneEffect, SkillId, SkillMilestone } from "../data/types";
import changelogData from "../data/changelog.json";
import { WORKER_URL } from "../lib/analytics";
import { DevPinGate } from "./DevPinGate";

/**
 * Dev-only wiki page showing all game content.
 * Access via ?dev in the URL. Not linked from the game UI.
 * Auto-generated from the same data files the game uses, so always up-to-date.
 */
interface ChangelogEntry {
  date: string;
  changes: string[];
}

function Changelog() {
  const entries = (changelogData as { entries: ChangelogEntry[] }).entries;
  if (entries.length === 0) {
    return (
      <div style={{ ...styles.card, marginBottom: "1.5rem" }}>
        <h3 style={styles.h3}>Changelog</h3>
        <p style={styles.desc}>No changelog entries yet.</p>
      </div>
    );
  }
  return (
    <section id="changelog" style={{ marginBottom: "1.5rem" }}>
      <h2 style={styles.h2}>Changelog</h2>
      {entries.map((entry, i) => (
        <div key={i} style={{ ...styles.card, marginBottom: "0.5rem" }}>
          <h3 style={{ ...styles.h3, fontSize: "0.95rem" }}>
            <span style={{ color: "#f0a050" }}>{entry.date}</span>
          </h3>
          <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0, color: "#e8e4d8", fontSize: "0.9rem" }}>
            {entry.changes.map((change, j) => (
              <li key={j} style={{ marginBottom: "0.2rem" }}>{change}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function DevTools() {
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const key = "seabound_feedbackQ";

  const reset = () => {
    localStorage.removeItem(key);
    setFeedbackStatus("Cleared — reload page to see the modal (15s delay)");
  };

  const current = localStorage.getItem(key);

  return (
    <div style={{ ...styles.card, marginBottom: "1.5rem" }}>
      <h3 style={styles.h3}>Dev Tools</h3>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          onClick={reset}
          style={{
            background: "#f0a050",
            color: "#0c1a1a",
            border: "none",
            borderRadius: 6,
            padding: "0.4rem 0.8rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reset feedback modal
        </button>
        {feedbackStatus && <span style={{ color: "#7acea0", fontSize: "0.85rem" }}>{feedbackStatus}</span>}
      </div>
      {current && (
        <pre style={{ color: "#5a7a6a", fontSize: "0.75rem", marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
          {current}
        </pre>
      )}
      <R2StorageCheck />
    </div>
  );
}

type R2Status = "idle" | "checking" | "ok" | "error";

function R2StorageCheck() {
  const [status, setStatus] = useState<R2Status>("idle");
  const [detail, setDetail] = useState("");

  const runCheck = useCallback(async () => {
    setStatus("checking");
    setDetail("");
    try {
      const res = await fetch(`${WORKER_URL}/api/store?prefix=`, { method: "GET" });
      if (res.ok) {
        const data = await res.json() as { keys?: { key: string; size: number }[] };
        const count = data.keys?.length ?? 0;
        setStatus("ok");
        setDetail(`Worker + R2 reachable. Store has ${count} file${count !== 1 ? "s" : ""}.`);
      } else {
        const text = await res.text().catch(() => "");
        setStatus("error");
        setDetail(`Worker returned ${res.status}: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      setStatus("error");
      setDetail(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const statusColor =
    status === "ok" ? "#7acea0" : status === "error" ? "#de7a7a" : status === "checking" ? "#d4c87a" : "#7a9a8a";

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          onClick={runCheck}
          disabled={status === "checking"}
          style={{
            background: "#50a0d0",
            color: "#0c1a1a",
            border: "none",
            borderRadius: 6,
            padding: "0.4rem 0.8rem",
            fontWeight: 600,
            cursor: status === "checking" ? "wait" : "pointer",
            opacity: status === "checking" ? 0.7 : 1,
          }}
        >
          {status === "checking" ? "Checking..." : "Check R2 Storage"}
        </button>
        {status !== "idle" && (
          <span style={{ color: statusColor, fontSize: "0.85rem", fontWeight: 600 }}>
            {status === "ok" ? "OK" : status === "error" ? "FAIL" : "..."}
          </span>
        )}
      </div>
      {detail && (
        <pre style={{ color: statusColor, fontSize: "0.75rem", marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
          {detail}
        </pre>
      )}
    </div>
  );
}

// -- Analytics types for the summary endpoint --

interface FunnelEntry {
  milestone: string;
  reached: number;
  pctOfTotal: number;
  medianTotalTimeMin: number | null;
  medianActiveTimeMin: number | null;
  medianActions: number | null;
}

interface RoutinesSummary {
  playersStarted: number;
  adoptionRate: number;
  totalStarts: number;
  medianStepCount: number | null;
  stopReasons: Record<string, number>;
}

interface EarlyFunnel {
  sessionStarts: number;
  uniquePlayersStarted: number;
  playersWithFirstAction: number;
  playersWithEarly30s: number;
  playersWithEarly2m: number;
  medianMsToFirstAction: number | null;
  firstActionByActionId: Record<string, number>;
}

interface AnalyticsSummary {
  period: string;
  totalEvents: number;
  uniquePlayers: number;
  newPlayers: number;
  returningPlayers: number;
  returnRate: number;
  deviceBreakdown: { mobile: number; desktop: number; unknown: number };
  funnel: FunnelEntry[];
  dropOff: Record<string, number>;
  victories: number;
  routines?: RoutinesSummary;
  earlyFunnel?: EarlyFunnel;
}

function AnalyticsDashboard() {
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`${WORKER_URL}/api/analytics/summary?days=${days}`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status}: ${text.slice(0, 200)}`);
      }
      const json = await res.json() as AnalyticsSummary;
      setData(json);
      setStatus("loaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, [days]);

  const milestoneLabel = (id: string) => {
    const s = id.replace(/_/g, " ");
    if (s.startsWith("phase ")) {
      const phase = s.slice(6);
      return `Phase: ${phase.includes(" ") ? phase.split(" ").join(" & ") : phase}`;
    }
    return s.replace(/^first /, "First ");
  };

  return (
    <div style={{ ...styles.card, marginBottom: "1.5rem" }}>
      <h3 style={styles.h3}>Analytics</h3>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{
            background: "#1e3a3a",
            color: "#e8e4d8",
            border: "1px solid #2d4a3e",
            borderRadius: 6,
            padding: "0.4rem 0.6rem",
            fontSize: "0.85rem",
          }}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <button
          onClick={load}
          disabled={status === "loading"}
          style={{
            background: "#7a50d0",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "0.4rem 0.8rem",
            fontWeight: 600,
            cursor: status === "loading" ? "wait" : "pointer",
            opacity: status === "loading" ? 0.7 : 1,
          }}
        >
          {status === "loading" ? "Loading..." : "Load Analytics"}
        </button>
      </div>

      {status === "error" && (
        <pre style={{ color: "#de7a7a", fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>{error}</pre>
      )}

      {data && status === "loaded" && (
        <div>
          {/* Overview cards */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {[
              { label: "Unique Players", value: data.uniquePlayers },
              { label: "New Players", value: data.newPlayers },
              { label: "Returning", value: `${data.returningPlayers} (${data.returnRate}%)` },
              { label: "Victories", value: data.victories },
              { label: "Mobile", value: data.deviceBreakdown.mobile },
              { label: "Desktop", value: data.deviceBreakdown.desktop },
            ].map((card) => (
              <div key={card.label} style={{
                background: "#1e3a3a",
                borderRadius: 6,
                padding: "0.5rem 0.75rem",
                minWidth: 90,
                textAlign: "center",
              }}>
                <div style={{ color: "#f0a050", fontSize: "1.2rem", fontWeight: 700 }}>{card.value}</div>
                <div style={{ color: "#7a9a8a", fontSize: "0.75rem" }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <h4 style={{ color: "#e8e4d8", marginBottom: "0.5rem" }}>Progression Funnel</h4>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ ...styles.table, minWidth: 480 }}>
            <thead>
              <tr>
                <th style={styles.th}>Milestone</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Reached</th>
                <th style={{ ...styles.th, textAlign: "center" }}>%</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Median Total (min)</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Median Active (min)</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Median Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.funnel.map((f) => (
                <tr key={f.milestone} style={styles.tr}>
                  <td style={{ ...styles.td, whiteSpace: "nowrap" }}>{milestoneLabel(f.milestone)}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>{f.reached}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <span style={{
                      display: "inline-block",
                      background: "#2d4a3e",
                      borderRadius: 4,
                      padding: "0.1rem 0.4rem",
                      minWidth: 36,
                      textAlign: "center",
                      color: f.pctOfTotal > 50 ? "#7acea0" : f.pctOfTotal > 20 ? "#d4c87a" : "#de7a7a",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                    }}>
                      {f.pctOfTotal}%
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>{f.medianTotalTimeMin ?? "—"}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>{f.medianActiveTimeMin ?? "—"}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>{f.medianActions ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Drop-off */}
          {Object.keys(data.dropOff).length > 0 && (
            <>
              <h4 style={{ color: "#e8e4d8", marginTop: "1rem", marginBottom: "0.5rem" }}>
                Drop-off by Last Phase
              </h4>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {Object.entries(data.dropOff)
                  .sort(([, a], [, b]) => b - a)
                  .map(([phase, count]) => (
                    <div key={phase} style={{
                      background: "#1e3a3a",
                      borderRadius: 6,
                      padding: "0.4rem 0.6rem",
                      textAlign: "center",
                    }}>
                      <div style={{ color: "#de7a7a", fontSize: "1rem", fontWeight: 700 }}>{count}</div>
                      <div style={{ color: "#7a9a8a", fontSize: "0.75rem" }}>{phase.replace(/_/g, " ")}</div>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* Routines */}
          {data.routines && (
            <>
              <h4 style={{ color: "#e8e4d8", marginTop: "1rem", marginBottom: "0.5rem" }}>
                Routines
              </h4>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[
                  {
                    label: "Players Started",
                    value: `${data.routines.playersStarted} (${data.routines.adoptionRate}%)`,
                  },
                  { label: "Total Starts", value: data.routines.totalStarts },
                  {
                    label: "Median Steps",
                    value: data.routines.medianStepCount ?? "—",
                  },
                  {
                    label: "Stopped: manual",
                    value: data.routines.stopReasons.manual ?? 0,
                  },
                  {
                    label: "Stopped: output full",
                    value: data.routines.stopReasons.output_full ?? 0,
                  },
                  {
                    label: "Stopped: can't proceed",
                    value: data.routines.stopReasons.cant_proceed ?? 0,
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{
                      background: "#1e3a3a",
                      borderRadius: 6,
                      padding: "0.5rem 0.75rem",
                      minWidth: 110,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ color: "#f0a050", fontSize: "1.1rem", fontWeight: 700 }}>
                      {card.value}
                    </div>
                    <div style={{ color: "#7a9a8a", fontSize: "0.75rem" }}>{card.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Early engagement funnel */}
          {data.earlyFunnel && (() => {
            const ef = data.earlyFunnel;
            const players = ef.uniquePlayersStarted || 1;
            const pct = (n: number) => Math.round((n / players) * 100);
            const cards = [
              { label: "Sessions Started", value: ef.sessionStarts },
              { label: "Players w/ First Action", value: `${ef.playersWithFirstAction} (${pct(ef.playersWithFirstAction)}%)` },
              { label: "Reached 30s", value: `${ef.playersWithEarly30s} (${pct(ef.playersWithEarly30s)}%)` },
              { label: "Reached 2m", value: `${ef.playersWithEarly2m} (${pct(ef.playersWithEarly2m)}%)` },
              {
                label: "Median Time to First Action",
                value: ef.medianMsToFirstAction != null
                  ? `${(ef.medianMsToFirstAction / 1000).toFixed(1)}s`
                  : "—",
              },
            ];
            const sortedActions = Object.entries(ef.firstActionByActionId)
              .sort(([, a], [, b]) => b - a);
            return (
              <>
                <h4 style={{ color: "#e8e4d8", marginTop: "1rem", marginBottom: "0.5rem" }}>
                  Early Engagement (% of unique players)
                </h4>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {cards.map((card) => (
                    <div key={card.label} style={{
                      background: "#1e3a3a",
                      borderRadius: 6,
                      padding: "0.5rem 0.75rem",
                      minWidth: 110,
                      textAlign: "center",
                    }}>
                      <div style={{ color: "#f0a050", fontSize: "1.05rem", fontWeight: 700 }}>
                        {card.value}
                      </div>
                      <div style={{ color: "#7a9a8a", fontSize: "0.75rem" }}>{card.label}</div>
                    </div>
                  ))}
                </div>
                {sortedActions.length > 0 && (
                  <>
                    <h4 style={{ color: "#e8e4d8", marginTop: "1rem", marginBottom: "0.5rem" }}>
                      First Action Picked
                    </h4>
                    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                      <table style={{ ...styles.table, minWidth: 320 }}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Action</th>
                            <th style={{ ...styles.th, textAlign: "right" }}>Players</th>
                            <th style={{ ...styles.th, textAlign: "right" }}>Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedActions.map(([actionId, count]) => (
                            <tr key={actionId} style={styles.tr}>
                              <td style={{ ...styles.td, whiteSpace: "nowrap" }}>{actionId}</td>
                              <td style={{ ...styles.td, textAlign: "right" }}>{count}</td>
                              <td style={{ ...styles.td, textAlign: "right" }}>
                                {Math.round((count / ef.playersWithFirstAction) * 100)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            );
          })()}

          <div style={{ color: "#5a7a6a", fontSize: "0.75rem", marginTop: "0.75rem" }}>
            {data.period} — {data.totalEvents} events processed
          </div>
        </div>
      )}
    </div>
  );
}

type WikiTab = "content" | "changelog" | "tools";

const tabLabels: Record<WikiTab, string> = {
  content: "Content",
  changelog: "Changelog",
  tools: "Dev Tools",
};

export function DevWiki() {
  const [activeTab, setActiveTab] = useState<WikiTab>("content");
  const RESOURCES = getResources();
  const TOOLS = getTools();
  const SKILLS = getSkills();
  const BUILDINGS = getBuildings();
  const ACTIONS = getActions();
  const RECIPES = getRecipes();
  const EXPEDITIONS = getExpeditions();
  const skillIds = Object.keys(SKILLS) as SkillId[];

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>SeaBound — Dev Wiki</h1>
      <p style={styles.subtitle}>
        Auto-generated from game data. This page reads directly from the source
        data files, so it's always in sync with the game.
      </p>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        {(Object.keys(tabLabels) as WikiTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab ? styles.tabBtnActive : {}),
            }}
          >
            {tabLabels[tab]}
          </button>
        ))}
        <a href="?dev=graph" style={{ ...styles.tabBtn, textDecoration: "none", color: "#7a9a8a" }}>
          Graph
        </a>
        <a href="?dev=dot" style={{ ...styles.tabBtn, textDecoration: "none", color: "#7a9a8a" }}>
          DOT Graph
        </a>
      </div>

      {/* Changelog tab */}
      {activeTab === "changelog" && <Changelog />}

      {/* Dev Tools tab */}
      {activeTab === "tools" && (
        <DevPinGate>
          <DevTools />
          <AnalyticsDashboard />
        </DevPinGate>
      )}

      {/* Content tab */}
      {activeTab === "content" && (
        <>
      <nav style={styles.toc}>
        <strong>Jump to:</strong>{" "}
        <a href="#resources" style={styles.link}>Resources</a> ·{" "}
        <a href="#tools" style={styles.link}>Tools</a> ·{" "}
        <a href="#skills" style={styles.link}>Skills</a> ·{" "}
        <a href="#actions" style={styles.link}>Actions</a> ·{" "}
        <a href="#recipes" style={styles.link}>Recipes</a> ·{" "}
        <a href="#buildings" style={styles.link}>Buildings</a> ·{" "}
        <a href="#expeditions" style={styles.link}>Expeditions</a> ·{" "}
        <a href="#milestones" style={styles.link}>Milestones</a>
      </nav>

      {/* ── Resources ── */}
      <section id="resources">
        <h2 style={styles.h2}>Resources ({Object.keys(RESOURCES).length})</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Tags</th>
              <th style={styles.th}>Description</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(RESOURCES).map((r) => (
              <tr key={r.id} style={styles.tr}>
                <td style={styles.tdCode}>{r.id}</td>
                <td style={styles.td}>{r.name}</td>
                <td style={styles.tdTag}>
                  {(r.tags ?? []).map((tag) => (
                    <span key={tag} style={{ ...styles.tag, ...tagColor(tag) }}>
                      {tag}
                    </span>
                  ))}
                  {(!r.tags || r.tags.length === 0) && <span style={styles.dim}>—</span>}
                </td>
                <td style={styles.td}>{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Tools ── */}
      <section id="tools">
        <h2 style={styles.h2}>Tools ({Object.keys(TOOLS).length})</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Speed Bonus</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(TOOLS).map((t) => (
              <tr key={t.id} style={styles.tr}>
                <td style={styles.tdCode}>{t.id}</td>
                <td style={styles.td}>{t.name}</td>
                <td style={styles.td}>{t.description}</td>
                <td style={styles.tdSmall}>
                  {t.speedBonus
                    ? `${Math.round((1 - t.speedBonus.multiplier) * 100)}% faster: ${[...(t.speedBonus.actionIds ?? []), ...(t.speedBonus.recipeIds ?? [])].join(", ")}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Skills ── */}
      <section id="skills">
        <h2 style={styles.h2}>Skills ({skillIds.length})</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>XP Curve (sample)</th>
            </tr>
          </thead>
          <tbody>
            {skillIds.map((id) => {
              const s = SKILLS[id];
              return (
                <tr key={id} style={styles.tr}>
                  <td style={styles.tdCode}>{id}</td>
                  <td style={styles.td}>{s.name}</td>
                  <td style={styles.td}>{s.description}</td>
                  <td style={styles.tdSmall}>
                    {[2, 3, 5, 10].map((l) => `L${l}: ${xpForLevel(l)} xp`).join(", ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ── Actions ── */}
      <section id="actions">
        <h2 style={styles.h2}>Actions ({ACTIONS.length})</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Skill</th>
              <th style={styles.th}>Duration</th>
              <th style={styles.th}>XP</th>
              <th style={styles.th}>Requirements</th>
              <th style={styles.th}>Drops</th>
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map((a) => (
              <tr key={a.id} style={styles.tr}>
                <td style={styles.tdCode}>{a.id}</td>
                <td style={styles.td}>{a.name}</td>
                <td style={styles.td}>{a.skillId}</td>
                <td style={styles.td}>{(a.durationMs / 1000).toFixed(1)}s</td>
                <td style={styles.td}>{a.xpGain}</td>
                <td style={styles.tdSmall}>
                  {[
                    a.requiredSkillLevel && a.requiredSkillLevel > 1
                      ? `Lv${a.requiredSkillLevel}`
                      : null,
                    a.requiredBiome ? `Biome: ${a.requiredBiome}` : null,
                    a.requiredTools?.length
                      ? `Tools: ${a.requiredTools.join(", ")}`
                      : null,
                    a.requiredResources?.length
                      ? `Resources: ${a.requiredResources.join(", ")}`
                      : null,
                    a.requiredBuildings?.length
                      ? `Buildings: ${a.requiredBuildings.join(", ")}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td style={styles.tdSmall}>
                  {a.drops.map((d) => {
                    const pct =
                      d.chance !== undefined && d.chance < 1
                        ? ` (${(d.chance * 100).toFixed(0)}%)`
                        : "";
                    return `${d.amount}× ${d.resourceId}${pct}`;
                  }).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Recipes ── */}
      <section id="recipes">
        <h2 style={styles.h2}>Recipes ({RECIPES.length})</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Skill</th>
              <th style={styles.th}>Duration</th>
              <th style={styles.th}>XP</th>
              <th style={styles.th}>Inputs</th>
              <th style={styles.th}>Output</th>
              <th style={styles.th}>Requirements</th>
              <th style={styles.th}>Flags</th>
            </tr>
          </thead>
          <tbody>
            {RECIPES.map((r) => (
              <tr key={r.id} style={styles.tr}>
                <td style={styles.tdCode}>{r.id}</td>
                <td style={styles.td}>{r.name}</td>
                <td style={styles.td}>{r.skillId}</td>
                <td style={styles.td}>{(r.durationMs / 1000).toFixed(1)}s</td>
                <td style={styles.td}>{r.xpGain}</td>
                <td style={styles.tdSmall}>
                  {r.inputs.map((i) => `${i.amount}× ${i.resourceId}`).join(", ")}
                </td>
                <td style={styles.tdSmall}>
                  {r.toolOutput
                    ? `🔧 ${r.toolOutput}`
                    : r.buildingOutput
                    ? `🏗 ${r.buildingOutput}`
                    : r.output ? `${r.output.amount}× ${r.output.resourceId}` : "XP only"}
                </td>
                <td style={styles.tdSmall}>
                  {[
                    r.requiredSkillLevel && r.requiredSkillLevel > 1
                      ? `${r.skillId} Lv${r.requiredSkillLevel}`
                      : null,
                    ...(r.requiredSkills ?? []).map(
                      (req) => `${req.skillId} Lv${req.level}`
                    ),
                    r.requiredTools?.length
                      ? `Tools: ${r.requiredTools.join(", ")}`
                      : null,
                    r.requiredItems?.length
                      ? `Items: ${r.requiredItems.join(", ")}`
                      : null,
                    r.requiredBuildings?.length
                      ? `Buildings: ${r.requiredBuildings.join(", ")}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td style={styles.tdSmall}>
                  {r.oneTimeCraft ? "one-time" : "repeatable"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Buildings ── */}
      <section id="buildings">
        <h2 style={styles.h2}>Buildings ({Object.keys(BUILDINGS).length})</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Unlocks</th>
              <th style={styles.th}>Storage Bonus</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(BUILDINGS).map((b) => (
              <tr key={b.id} style={styles.tr}>
                <td style={styles.tdCode}>{b.id}</td>
                <td style={styles.td}>{b.name}{b.maxCount && b.maxCount > 1 ? ` (max ${b.maxCount})` : ""}</td>
                <td style={styles.td}>{b.description}</td>
                <td style={styles.td}>{b.unlocks}</td>
                <td style={styles.tdSmall}>
                  {b.storageBonus?.map((s) => {
                    if (s.tag) return `+${s.amount} ${s.tag}`;
                    if (s.excludeTags) return `+${s.amount} (excl. ${s.excludeTags.join(",")})`;
                    return `+${s.amount} all`;
                  }).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Expeditions ── */}
      <section id="expeditions">
        <h2 style={styles.h2}>Expeditions ({EXPEDITIONS.length})</h2>
        {EXPEDITIONS.map((e) => (
          <div key={e.id} style={styles.card}>
            <h3 style={styles.h3}>
              {e.name} <span style={styles.dim}>({e.id})</span>
            </h3>
            <p style={styles.desc}>{e.description}</p>
            <p style={styles.meta}>
              Skill: {e.skillId} · Duration: {(e.durationMs / 1000).toFixed(1)}s · XP:{" "}
              {e.xpGain}
              {e.foodCost ? ` · Food cost: ${e.foodCost}` : ""}
              {e.requiredVessel ? ` · Vessel: ${e.requiredVessel}` : ""}
            </p>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Weight</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Biome Discovery</th>
                  <th style={styles.th}>Required Biomes</th>
                  <th style={styles.th}>Drops</th>
                </tr>
              </thead>
              <tbody>
                {e.outcomes.map((o, i) => {
                  const totalWeight = e.outcomes
                    .filter(
                      (oo) =>
                        !oo.requiredBiomes ||
                        oo.requiredBiomes.length === 0
                    )
                    .reduce((sum, oo) => sum + oo.weight, 0);
                  return (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}>
                        {o.weight}{" "}
                        <span style={styles.dim}>
                          (~{((o.weight / totalWeight) * 100).toFixed(0)}%)
                        </span>
                      </td>
                      <td style={styles.td}>{o.description}</td>
                      <td style={styles.td}>{o.biomeDiscovery || "—"}</td>
                      <td style={styles.tdSmall}>
                        {o.requiredBiomes?.join(", ") || "—"}
                      </td>
                      <td style={styles.tdSmall}>
                        {o.drops
                          ?.map((d) => `${d.amount}× ${d.resourceId}`)
                          .join(", ") || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* ── Milestones ── */}
      <section id="milestones">
        <h2 style={styles.h2}>Skill Milestones</h2>
        <p style={styles.desc}>
          Authored milestones grant bonuses at specific skill levels.
          Implicit unlocks are actions, recipes, and stations gated by skill level requirements.
        </p>
        {skillIds.map((id) => {
          const authored = getMilestonesForSkill(id);
          const implicit = getImplicitUnlocks(id);
          const all = mergeAndSort(authored, implicit);
          if (all.length === 0) return null;
          return (
            <div key={id} style={styles.card}>
              <h3 style={styles.h3}>
                {SKILLS[id].name}
                <span style={styles.dim}> — {all.length} milestones</span>
              </h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Lv</th>
                    <th style={styles.th}>Source</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Effects</th>
                  </tr>
                </thead>
                <tbody>
                  {all.map((m, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}>{m.level}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.tag,
                          ...(m.source === "authored"
                            ? { background: "#2d4a3e", color: "#7acea0" }
                            : { background: "#3d3a2a", color: "#d4c87a" }),
                        }}>
                          {m.source}
                        </span>
                      </td>
                      <td style={styles.td}>{m.description}{m.hidden ? " (hidden)" : ""}</td>
                      <td style={styles.tdSmall}>
                        {m.effects
                          ?.map(formatEffect)
                          .join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </section>
        </>
      )}

      <footer style={styles.footer}>
        Generated from source data files. Add new content to{" "}
        <code>src/data/</code> and it appears here automatically.
      </footer>
    </div>
  );
}

type AnnotatedMilestone = SkillMilestone & { source: "authored" | "unlock" };

/** Collect implicit unlocks: actions, recipes, and stations gated by a skill level. */
function getImplicitUnlocks(skillId: SkillId): AnnotatedMilestone[] {
  const result: AnnotatedMilestone[] = [];
  const ACTIONS = getActions();
  const RECIPES = getRecipes();
  const STATIONS = getStations();

  for (const a of ACTIONS) {
    if (a.skillId === skillId && a.requiredSkillLevel && a.requiredSkillLevel > 1) {
      result.push({ level: a.requiredSkillLevel, description: `Unlock action: ${a.name}`, source: "unlock" });
    }
  }

  for (const r of RECIPES) {
    if (r.skillId === skillId && r.requiredSkillLevel && r.requiredSkillLevel > 1) {
      result.push({ level: r.requiredSkillLevel, description: `Unlock recipe: ${r.name}`, source: "unlock" });
    }
    // Dual-skill gates: show as unlock for the secondary skill too
    for (const req of r.requiredSkills ?? []) {
      if (req.skillId === skillId && req.level > 1) {
        result.push({ level: req.level, description: `Unlock recipe: ${r.name} (cross-skill gate)`, source: "unlock" });
      }
    }
  }

  for (const s of STATIONS) {
    if (s.skillId === skillId && s.requiredSkillLevel && s.requiredSkillLevel > 1) {
      result.push({ level: s.requiredSkillLevel, description: `Unlock station: ${s.name}`, source: "unlock" });
    }
  }

  return result;
}

/** Merge authored milestones (from getMilestonesForSkill) with implicit unlocks, deduplicated. */
function mergeAndSort(authored: SkillMilestone[], implicit: AnnotatedMilestone[]): AnnotatedMilestone[] {
  // Tag authored milestones; filter out auto-generated unlocks from getMilestonesForSkill
  // (we rebuild them ourselves with better detail)
  const authoredOnly: AnnotatedMilestone[] = authored
    .filter((m) => !m.description.startsWith("Unlock "))
    .map((m) => ({ ...m, source: "authored" as const }));

  // Deduplicate implicit by level+description
  const seen = new Set<string>();
  const deduped: AnnotatedMilestone[] = [];
  for (const m of implicit) {
    const key = `${m.level}:${m.description}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(m);
    }
  }

  return [...authoredOnly, ...deduped].sort((a, b) => a.level - b.level);
}

/** Human-readable formatting for all milestone effect types. */
function formatEffect(e: MilestoneEffect): string {
  switch (e.type) {
    case "drop_chance":
      return `+${(e.bonus * 100).toFixed(0)}% ${e.resourceId} on ${e.actionId}`;
    case "duration":
      return `${((1 - e.multiplier) * 100).toFixed(0)}% faster ${e.actionId === "*" ? "(all)" : e.actionId}`;
    case "double_output":
      return `${(e.chance * 100).toFixed(0)}% double output${e.recipeId ? ` (${e.recipeId})` : ""}`;
    case "output_chance_bonus":
      return `+${(e.bonus * 100).toFixed(0)}% success on ${e.recipeId}`;
    case "station_input_reduce":
      return `${e.stationId}: ${e.resourceId} cost → ${e.newAmount}`;
    case "station_guaranteed_drop":
      return `${e.stationId}: min ${e.minAmount}× ${e.resourceId}`;
    case "expedition_biome_bonus":
      return `+${(e.bonus * 100).toFixed(0)}% biome discovery weight`;
    case "expedition_drop_bonus":
      return `+${(e.bonus * 100).toFixed(0)}% expedition drops`;
    case "expedition_loot_chance":
      return `+${(e.bonus * 100).toFixed(0)}% loot table chance`;
    case "combat_stat_bonus":
      return `+${e.bonus} ${e.stat}`;
  }
}

function tagColor(tag: string): React.CSSProperties {
  switch (tag) {
    case "food":
      return { background: "#4d2a2a", color: "#de7a7a" };
    case "large":
      return { background: "#3d2a4d", color: "#b47ade" };
    case "dried":
      return { background: "#3d3a2a", color: "#d4c87a" };
    default:
      return { background: "#2d4a3e", color: "#7acea0" };
  }
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "2rem 1rem",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#e8e4d8",
    background: "#0c1a1a",
    minHeight: "100vh",
  },
  h1: {
    color: "#f0a050",
    fontSize: "2rem",
    marginBottom: "0.25rem",
  },
  subtitle: {
    color: "#7a9a8a",
    marginBottom: "1.5rem",
    fontSize: "0.9rem",
  },
  tabBar: {
    display: "flex",
    gap: "0.25rem",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #1e3a3a",
    paddingBottom: "0",
  },
  tabBtn: {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "0.6rem 1rem",
    marginBottom: "-2px",
    color: "#7a9a8a",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "color 0.15s, border-color 0.15s",
  } as React.CSSProperties,
  tabBtnActive: {
    color: "#f0a050",
    borderBottomColor: "#f0a050",
  },
  toc: {
    background: "#132626",
    padding: "0.75rem 1rem",
    borderRadius: 8,
    marginBottom: "2rem",
    fontSize: "0.9rem",
  },
  link: {
    color: "#f0a050",
    textDecoration: "none",
  },
  h2: {
    color: "#f0a050",
    borderBottom: "1px solid #1e3a3a",
    paddingBottom: "0.5rem",
    marginTop: "2.5rem",
    marginBottom: "1rem",
  },
  h3: {
    color: "#e8e4d8",
    marginBottom: "0.5rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
    marginBottom: "1rem",
  },
  th: {
    textAlign: "left",
    padding: "0.5rem",
    borderBottom: "2px solid #1e3a3a",
    color: "#f0a050",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #1e3a3a",
  },
  td: {
    padding: "0.4rem 0.5rem",
    verticalAlign: "top",
  },
  tdCode: {
    padding: "0.4rem 0.5rem",
    fontFamily: "monospace",
    fontSize: "0.8rem",
    color: "#7ab4de",
    verticalAlign: "top",
  },
  tdSmall: {
    padding: "0.4rem 0.5rem",
    fontSize: "0.8rem",
    color: "#7a9a8a",
    verticalAlign: "top",
  },
  tdTag: {
    padding: "0.4rem 0.5rem",
    verticalAlign: "top",
  },
  tag: {
    padding: "0.15rem 0.5rem",
    borderRadius: 4,
    fontSize: "0.75rem",
    fontWeight: 600,
    marginRight: 4,
  },
  card: {
    background: "#132626",
    borderRadius: 8,
    padding: "1rem",
    marginBottom: "1rem",
  },
  desc: {
    color: "#7a9a8a",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
  },
  meta: {
    color: "#7a9a8a",
    fontSize: "0.85rem",
    marginBottom: "0.75rem",
  },
  dim: {
    color: "#5a7a6a",
    fontSize: "0.8rem",
  },
  footer: {
    marginTop: "3rem",
    padding: "1rem",
    borderTop: "1px solid #1e3a3a",
    color: "#5a7a6a",
    fontSize: "0.85rem",
    textAlign: "center",
  },
};
