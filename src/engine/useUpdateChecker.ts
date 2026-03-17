declare const __BUILD_ID__: string;

import { useEffect, useState } from "react";

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Only check in production builds (dev has no version.json)
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

  return updateAvailable;
}
