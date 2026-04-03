/**
 * Lightweight analytics client for Seabound.
 * Sends events to the Cloudflare Worker → R2 pipeline.
 * Fires-and-forgets — never blocks gameplay or throws.
 *
 * Disabled in dev (localhost / non-production origins).
 */

export const WORKER_URL = "https://seabound-api.asbjoernbrandt.workers.dev";

/** Only send analytics from production origins. */
const IS_PROD =
  typeof window !== "undefined" &&
  (window.location.hostname === "seabound.dev" ||
    window.location.hostname.endsWith(".seabound.pages.dev"));

const queue: Record<string, unknown>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Queue an analytics event. Flushed automatically every 30s or at 10 events. */
export function trackEvent(
  event: string,
  data?: Record<string, unknown>,
): void {
  if (!IS_PROD) return; // analytics disabled in dev

  queue.push({
    event,
    ts: Date.now(),
    ...data,
  });

  if (queue.length >= 10) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, 30_000);
  }
}

/** Send queued events to the worker. */
function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;

  const batch = queue.splice(0);

  // Fire-and-forget — don't await, don't throw
  fetch(`${WORKER_URL}/api/analytics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: batch }),
    keepalive: true, // survives page unload
  }).catch(() => {
    /* silently drop on network failure */
  });
}

/** Flush remaining events on page unload. */
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
