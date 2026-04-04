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

  // Write raw file
  await env.BUCKET.put(key, body, {
    httpMetadata: { contentType: "application/json" },
  });

  // Append to daily rollup (best-effort, race-safe via read-modify-write)
  try {
    const parsed = JSON.parse(body);
    const newEvents: unknown[] = parsed.events ?? [parsed];
    const rollupKey = `analytics-rollup/${date}.json`;
    const existing = await env.BUCKET.get(rollupKey);
    let events: unknown[] = [];
    if (existing) {
      try {
        const data = JSON.parse(await existing.text());
        events = data.events ?? [];
      } catch { /* start fresh if corrupted */ }
    }
    events.push(...newEvents);
    await env.BUCKET.put(rollupKey, JSON.stringify({ events }), {
      httpMetadata: { contentType: "application/json" },
    });
  } catch {
    // Rollup update is best-effort; raw file is already saved
  }

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
  // Read daily rollup files (1 per day) instead of individual event files
  const events: AnalyticsEvent[] = [];
  const now = new Date();

  const rollupKeys: string[] = [];
  for (let d = 0; d < daysBack; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    rollupKeys.push(`analytics-rollup/${date.toISOString().slice(0, 10)}.json`);
  }

  // Fetch all rollup files in parallel (max ~90 files vs thousands)
  const results = await Promise.all(
    rollupKeys.map((key) => env.BUCKET.get(key).catch(() => null)),
  );
  for (const body of results) {
    if (!body) continue;
    try {
      const parsed = JSON.parse(await body.text());
      const batch = parsed.events ?? [];
      for (const e of batch) {
        if (e.event) events.push(e);
      }
    } catch {
      // skip malformed rollups
    }
  }

  // Aggregate per player (use Set for O(1) milestone lookups)
  const players = new Map<string, PlayerSummary>();
  const playerMilestoneSets = new Map<string, Set<string>>();

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
      playerMilestoneSets.set(pid, new Set());
    }
    const p = players.get(pid)!;
    const ms = playerMilestoneSets.get(pid)!;
    const ts = new Date(e.ts).toISOString();
    if (ts < p.firstSeen) p.firstSeen = ts;
    if (ts > p.lastSeen) p.lastSeen = ts;

    if (e.event === "session_start") {
      p.sessions++;
    }
    // Update device from any event with screenWidth (session_start or heartbeat)
    if (e.screenWidth) {
      p.device = e.screenWidth < 768 ? "mobile" : "desktop";
    }
    // Track cross-device player GUID
    if (e.playerGuid) {
      p.playerGuid = e.playerGuid;
    }
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

    if (e.event === "milestone" && e.milestoneId && !ms.has(e.milestoneId)) {
      ms.add(e.milestoneId);
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

  // Pre-compute milestone reach counts using Sets
  const milestoneCounts = new Map<string, number>();
  for (const mid of milestoneIds) milestoneCounts.set(mid, 0);
  for (const ms of playerMilestoneSets.values()) {
    for (const mid of milestoneIds) {
      if (ms.has(mid)) milestoneCounts.set(mid, milestoneCounts.get(mid)! + 1);
    }
  }

  const totalPlayers = players.size;
  const funnel = milestoneIds.map((mid) => {
    const reached = milestoneCounts.get(mid)!;
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
    deviceBreakdown: (() => {
      const counts = { mobile: 0, desktop: 0, unknown: 0 };
      for (const p of players.values()) {
        if (p.device === "mobile") counts.mobile++;
        else if (p.device === "desktop") counts.desktop++;
        else counts.unknown++;
      }
      return counts;
    })(),
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
