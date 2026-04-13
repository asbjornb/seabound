declare const __BUILD_ID__: string;

import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    // Register the service worker for offline support.
    // When a new SW is waiting, show the update bar. Calling applyUpdate()
    // sends skipWaiting to the waiting SW and reloads the page.
    const updateSW = registerSW({
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
    });
    updateSWRef.current = updateSW;
  }, []);

  useEffect(() => {
    // Version.json polling — catches deployments even before the SW update fires
    if (typeof __BUILD_ID__ === "undefined") return;

    const currentBuild = __BUILD_ID__;

    async function check() {
      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.buildId && data.buildId !== currentBuild) {
          setUpdateAvailable(true);
        }
      } catch {
        // Network error — ignore
      }
    }

    const id = setInterval(check, CHECK_INTERVAL);
    // First check after a short delay so we don't block startup
    const timeout = setTimeout(check, 30_000);

    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    // Listen for the new SW to take control, then reload.
    // This is critical because vite-plugin-pwa only sets up its internal
    // "controlling" handler when the Workbox "waiting" event fires. If
    // version.json polling detected the update first, no handler exists
    // and the page would never reload after skipWaiting succeeds.
    navigator.serviceWorker?.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    // Try the Workbox mechanism (messages the waiting SW to skipWaiting)
    if (updateSWRef.current) {
      await updateSWRef.current(true);
    }

    // Direct fallback: if Workbox's messageSkipWaiting didn't work
    // (e.g. internal state was stale), try messaging the waiting SW directly
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        return; // controllerchange listener above will reload
      }
      // No waiting SW — force an update check, then activate if found
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
          return;
        }
      }
    } catch {
      // SW API not available — fall through to hard reload
    }

    // Last resort: no SW update mechanism worked. Hard reload and hope
    // the server/CDN serves fresh assets. This breaks the loop where the
    // old SW keeps serving stale JS while version.json returns a new buildId.
    window.location.reload();
  }, []);

  return { updateAvailable, applyUpdate };
}
