interface Env {
  BUCKET: R2Bucket;
  API_KEY: string; // Secret: for CI/admin writes
  ALLOWED_ORIGIN: string;
}

// -- Helpers --

function corsHeaders(env: Env, request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const allowed =
    origin === env.ALLOWED_ORIGIN || origin.endsWith(".seabound.pages.dev");
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
