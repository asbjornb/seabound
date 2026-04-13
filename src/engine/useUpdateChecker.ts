declare const __BUILD_ID__: string;

import { useCallback, useEffect, useRef, useState } from "react";

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Register the service worker ourselves instead of using virtual:pwa-register's
    // registerSW, which auto-reloads on controllerchange in autoUpdate mode.
    // We want to show a banner and let the user choose when to reload.
    //
    // The generated SW uses skipWaiting + clientsClaim (registerType "autoUpdate"),
    // so new SWs activate immediately — a plain reload then serves fresh assets.
    // This also fixes the bootstrap problem: previously with registerType "prompt",
    // the waiting SW needed a SKIP_WAITING message from the client, but the old
    // client code never sent it, creating a deadlock.
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      registrationRef.current = reg;
      // Periodically check for new SW versions
      setInterval(() => reg.update(), CHECK_INTERVAL);
    });

    // When a new SW takes control (via skipWaiting + clientsClaim), show the
    // update banner. Skip the first controllerchange on fresh installs where
    // no previous SW was active.
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController) {
        setUpdateAvailable(true);
      }
      hadController = true;
    });
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
          // Kick the SW to check for updates so it's ready when the user taps
          registrationRef.current?.update();
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
    window.location.reload();
  }, []);

  return { updateAvailable, applyUpdate };
}
