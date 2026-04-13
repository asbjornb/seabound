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

  const applyUpdate = useCallback(() => {
    if (updateSWRef.current) {
      // Activate the waiting service worker, then reload
      updateSWRef.current(true);
    } else {
      // Fallback for version.json-only detection (no waiting SW)
      window.location.reload();
    }
  }, []);

  return { updateAvailable, applyUpdate };
}
