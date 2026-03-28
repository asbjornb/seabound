import { getActions, getBuildings, getExpeditions, getRecipes, getResources, getTools, getSkills, getMilestonesForSkill } from "../data/registry";
import { xpForLevel } from "../data/skills";
import { SkillId } from "../data/types";

/**
 * Dev-only wiki page showing all game content.
 * Access via ?dev in the URL. Not linked from the game UI.
 * Auto-generated from the same data files the game uses, so always up-to-date.
 */
export function DevWiki() {
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

      <nav style={styles.toc}>
        <a href="?dev=graph" style={{ ...styles.link, fontWeight: 600 }}>Progression Graph</a>
        {" · "}
        <strong>Contents:</strong>{" "}
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
        {skillIds.map((id) => {
          const ms = getMilestonesForSkill(id);
          if (ms.length === 0) return null;
          return (
            <div key={id} style={styles.card}>
              <h3 style={styles.h3}>{SKILLS[id].name}</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Level</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Hidden?</th>
                    <th style={styles.th}>Effects</th>
                  </tr>
                </thead>
                <tbody>
                  {ms.map((m, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}>{m.level}</td>
                      <td style={styles.td}>{m.description}</td>
                      <td style={styles.td}>{m.hidden ? "yes" : "no"}</td>
                      <td style={styles.tdSmall}>
                        {m.effects
                          ?.map((e) => {
                            if (e.type === "drop_chance")
                              return `+${(e.bonus * 100).toFixed(0)}% ${e.resourceId} on ${e.actionId}`;
                            if (e.type === "duration")
                              return `${((1 - e.multiplier) * 100).toFixed(0)}% faster ${e.actionId}`;
                            return JSON.stringify(e);
                          })
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

      <footer style={styles.footer}>
        Generated from source data files. Add new content to{" "}
        <code>src/data/</code> and it appears here automatically.
      </footer>
    </div>
  );
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
