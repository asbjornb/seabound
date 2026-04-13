import { useEffect, useState } from "react";

const CHANNEL_NAME = "seabound-tab-guard";

/**
 * Detects when the game is open in multiple tabs/windows (including PWA).
 * Uses BroadcastChannel to ping other instances on the same origin.
 */
export function useTabGuard() {
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const ch = new BroadcastChannel(CHANNEL_NAME);

    ch.onmessage = (e) => {
      if (e.data === "ping") {
        // Another tab just opened — tell it we exist, and warn locally too
        ch.postMessage("pong");
        setDuplicateOpen(true);
      } else if (e.data === "pong") {
        // Another tab responded to our ping
        setDuplicateOpen(true);
      }
    };

    // Announce ourselves; any existing tabs will respond with pong
    ch.postMessage("ping");

    return () => ch.close();
  }, []);

  return duplicateOpen;
}
