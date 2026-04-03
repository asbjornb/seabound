/**
 * Lightweight analytics client for Seabound.
 * Sends events to the Cloudflare Worker → R2 pipeline.
 * Fires-and-forgets — never blocks gameplay or throws.
 */

const API_URL = import.meta.env.VITE_ANALYTICS_URL as string | undefined;

const queue: Record<string, unknown>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Queue an analytics event. Flushed automatically every 30s or at 10 events. */
export function trackEvent(
  event: string,
  data?: Record<string, unknown>,
): void {
  if (!API_URL) return; // analytics disabled (dev / not configured)

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
  fetch(`${API_URL}/api/analytics`, {
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
