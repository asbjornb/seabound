interface Env {
  BUCKET: R2Bucket;
  API_KEY: string; // Secret: for CI/admin writes
  ALLOWED_ORIGIN: string;
}

// -- Helpers --

function corsHeaders(env: Env, request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const allowed =
    origin === env.ALLOWED_ORIGIN ||
    origin === "https://seabound.dev" ||
    origin.endsWith(".seabound.pages.dev");
  return {
    "Access-Control-Allow-Origin": allowed ? origin : env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(
  body: unknown,
  status: number,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function isAuthorized(request: Request, env: Env): boolean {
  const auth = request.headers.get("Authorization");
  return auth === `Bearer ${env.API_KEY}`;
}

// -- Route handlers --

/** POST /api/analytics — append analytics events (from game client, no auth) */
async function handleAnalytics(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const body = await request.text();
  if (!body || body.length > 10_000) {
    return json({ error: "Invalid payload" }, 400, cors);
  }

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const timestamp = Date.now();
  const key = `analytics/${date}/${timestamp}-${crypto.randomUUID().slice(0, 8)}.json`;

  await env.BUCKET.put(key, body, {
    httpMetadata: { contentType: "application/json" },
  });

  return json({ ok: true, key }, 200, cors);
}

// -- Analytics types --

interface AnalyticsEvent {
  event: string;
  ts: number;
  playerId?: string;
  milestoneId?: string;
  totalPlayTimeMs?: number;
  activePlayTimeMs?: number;
  actionCompletions?: number;
  maxSkillLevel?: number;
  skills?: Record<string, number>;
  phase?: string;
  biomes?: number;
  buildings?: number;
  tools?: number;
  morale?: number;
  victory?: boolean;
  isNewPlayer?: boolean;
  screenWidth?: number;
  screenHeight?: number;
}

interface PlayerSummary {
  firstSeen: string;
  lastSeen: string;
  sessions: number;
  totalPlayTimeMs: number;
  activePlayTimeMs: number;
  actionCompletions: number;
  maxSkillLevel: number;
  lastPhase: string;
  milestones: string[];
  victory: boolean;
  device: string;
}

/**
 * GET /api/analytics/summary — aggregate analytics into a readable summary.
 * Auth required (uses API_KEY). Scans R2 analytics files and produces:
 * - Player count + return rate
 * - Milestone funnel (count + median time-to-milestone)
 * - Drop-off analysis (last phase per churned player)
 */
async function handleAnalyticsSummary(
  env: Env,
  cors: Record<string, string>,
  daysBack: number,
): Promise<Response> {
  // Collect all analytics files for the date range
  const events: AnalyticsEvent[] = [];
  const now = new Date();

  for (let d = 0; d < daysBack; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const prefix = `analytics/${date.toISOString().slice(0, 10)}/`;

    let cursor: string | undefined;
    do {
      const listed = await env.BUCKET.list({ prefix, cursor, limit: 500 });
      for (const obj of listed.objects) {
        try {
          const body = await env.BUCKET.get(obj.key);
          if (!body) continue;
          const parsed = JSON.parse(await body.text());
          const batch = parsed.events ?? [parsed];
          for (const e of batch) {
            if (e.event) events.push(e);
          }
        } catch {
          // skip malformed files
        }
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
  }

  // Aggregate per player
  const players = new Map<string, PlayerSummary>();

  for (const e of events) {
    const pid = e.playerId ?? "unknown";
    if (!players.has(pid)) {
      players.set(pid, {
        firstSeen: new Date(e.ts).toISOString(),
        lastSeen: new Date(e.ts).toISOString(),
        sessions: 0,
        totalPlayTimeMs: 0,
        activePlayTimeMs: 0,
        actionCompletions: 0,
        maxSkillLevel: 1,
        lastPhase: "bare_hands",
        milestones: [],
        victory: false,
        device: "unknown",
      });
    }
    const p = players.get(pid)!;
    const ts = new Date(e.ts).toISOString();
    if (ts < p.firstSeen) p.firstSeen = ts;
    if (ts > p.lastSeen) p.lastSeen = ts;

    if (e.event === "session_start") {
      p.sessions++;
      if (e.screenWidth) {
        p.device = e.screenWidth < 768 ? "mobile" : "desktop";
      }
    }
    // Always update to latest known values
    if (e.totalPlayTimeMs != null && e.totalPlayTimeMs > p.totalPlayTimeMs) {
      p.totalPlayTimeMs = e.totalPlayTimeMs;
    }
    if (e.activePlayTimeMs != null && e.activePlayTimeMs > p.activePlayTimeMs) {
      p.activePlayTimeMs = e.activePlayTimeMs;
    }
    if (e.actionCompletions != null && e.actionCompletions > p.actionCompletions) {
      p.actionCompletions = e.actionCompletions;
    }
    if (e.maxSkillLevel != null && e.maxSkillLevel > p.maxSkillLevel) {
      p.maxSkillLevel = e.maxSkillLevel;
    }
    if (e.phase) p.lastPhase = e.phase;
    if (e.victory) p.victory = true;

    if (e.event === "milestone" && e.milestoneId && !p.milestones.includes(e.milestoneId)) {
      p.milestones.push(e.milestoneId);
    }
  }

  // Build milestone funnel
  const milestoneIds = [
    "phase_bamboo", "phase_fire", "phase_stone_clay",
    "raft_built", "first_skill_5", "first_skill_10",
    "phase_maritime", "dugout_built", "first_skill_15",
    "outrigger_built", "phase_voyage", "victory",
  ];

  // Collect time-to-milestone from milestone events
  const milestoneTimes = new Map<string, number[]>();
  const milestoneActiveT = new Map<string, number[]>();
  const milestoneActions = new Map<string, number[]>();
  for (const mid of milestoneIds) {
    milestoneTimes.set(mid, []);
    milestoneActiveT.set(mid, []);
    milestoneActions.set(mid, []);
  }
  for (const e of events) {
    if (e.event === "milestone" && e.milestoneId && milestoneTimes.has(e.milestoneId)) {
      if (e.totalPlayTimeMs != null) milestoneTimes.get(e.milestoneId)!.push(e.totalPlayTimeMs);
      if (e.activePlayTimeMs != null) milestoneActiveT.get(e.milestoneId)!.push(e.activePlayTimeMs);
      if (e.actionCompletions != null) milestoneActions.get(e.milestoneId)!.push(e.actionCompletions);
    }
  }

  const median = (arr: number[]) => {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const msToMin = (ms: number | null) => ms != null ? Math.round(ms / 60000) : null;

  const totalPlayers = players.size;
  const funnel = milestoneIds.map((mid) => {
    const reached = [...players.values()].filter((p) => p.milestones.includes(mid)).length;
    return {
      milestone: mid,
      reached,
      pctOfTotal: totalPlayers > 0 ? Math.round((reached / totalPlayers) * 100) : 0,
      medianTotalTimeMin: msToMin(median(milestoneTimes.get(mid)!)),
      medianActiveTimeMin: msToMin(median(milestoneActiveT.get(mid)!)),
      medianActions: median(milestoneActions.get(mid)!),
    };
  });

  // Drop-off: group non-victory players by last phase
  const dropOff: Record<string, number> = {};
  for (const p of players.values()) {
    if (!p.victory) {
      dropOff[p.lastPhase] = (dropOff[p.lastPhase] ?? 0) + 1;
    }
  }

  // Returning players
  const returningPlayers = [...players.values()].filter((p) => p.sessions > 1).length;

  const summary = {
    period: `last ${daysBack} days`,
    totalEvents: events.length,
    uniquePlayers: totalPlayers,
    newPlayers: new Set(
      events.filter((e) => e.event === "session_start" && e.isNewPlayer && e.playerId)
        .map((e) => e.playerId)
    ).size,
    returningPlayers,
    returnRate: totalPlayers > 0 ? Math.round((returningPlayers / totalPlayers) * 100) : 0,
    deviceBreakdown: {
      mobile: [...players.values()].filter((p) => p.device === "mobile").length,
      desktop: [...players.values()].filter((p) => p.device === "desktop").length,
      unknown: [...players.values()].filter((p) => p.device === "unknown").length,
    },
    funnel,
    dropOff,
    victories: [...players.values()].filter((p) => p.victory).length,
  };

  return json(summary, 200, cors);
}

/** PUT /api/store/:path — write arbitrary files (CI auth required) */
async function handleStoreWrite(
  request: Request,
  env: Env,
  cors: Record<string, string>,
  path: string,
): Promise<Response> {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized" }, 401, cors);
  }

  const body = await request.arrayBuffer();
  const contentType =
    request.headers.get("Content-Type") ?? "application/octet-stream";

  await env.BUCKET.put(`store/${path}`, body, {
    httpMetadata: { contentType },
  });

  return json({ ok: true, key: `store/${path}` }, 200, cors);
}

/** GET /api/store/:path — read files (public, for changelogs etc.) */
async function handleStoreRead(
  env: Env,
  cors: Record<string, string>,
  path: string,
): Promise<Response> {
  const object = await env.BUCKET.get(`store/${path}`);
  if (!object) {
    return json({ error: "Not found" }, 404, cors);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type":
        object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=300",
      ...cors,
    },
  });
}

/** GET /api/store/ — list files under a prefix (public) */
async function handleStoreList(
  env: Env,
  cors: Record<string, string>,
  prefix: string,
): Promise<Response> {
  const listed = await env.BUCKET.list({
    prefix: `store/${prefix}`,
    limit: 100,
  });

  const keys = listed.objects.map((o) => ({
    key: o.key.replace(/^store\//, ""),
    size: o.size,
    uploaded: o.uploaded.toISOString(),
  }));

  return json({ keys }, 200, cors);
}

// -- Router --

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(env, request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // POST /api/analytics
    if (path === "/api/analytics" && request.method === "POST") {
      return handleAnalytics(request, env, cors);
    }

    // GET /api/analytics/summary — aggregated dashboard
    // Accessible from game origin (for dev wiki) and via API key (for curl)
    if (path === "/api/analytics/summary" && request.method === "GET") {
      const origin = request.headers.get("Origin") ?? "";
      const isGameOrigin =
        origin === "https://seabound.dev" ||
        origin.endsWith(".seabound.pages.dev");
      if (!isGameOrigin && !isAuthorized(request, env)) {
        return json({ error: "Unauthorized" }, 401, cors);
      }
      const days = parseInt(url.searchParams.get("days") ?? "30", 10);
      return handleAnalyticsSummary(env, cors, Math.min(days, 90));
    }

    // PUT /api/store/*
    if (path.startsWith("/api/store/") && request.method === "PUT") {
      const storePath = path.slice("/api/store/".length);
      if (!storePath) return json({ error: "Path required" }, 400, cors);
      return handleStoreWrite(request, env, cors, storePath);
    }

    // GET /api/store/*
    if (path.startsWith("/api/store/") && request.method === "GET") {
      const storePath = path.slice("/api/store/".length);
      if (!storePath) return handleStoreList(env, cors, "");
      return handleStoreRead(env, cors, storePath);
    }

    // GET /api/store?prefix=...
    if (path === "/api/store" && request.method === "GET") {
      const prefix = url.searchParams.get("prefix") ?? "";
      return handleStoreList(env, cors, prefix);
    }

    return json({ error: "Not found" }, 404, cors);
  },
} satisfies ExportedHandler<Env>;
