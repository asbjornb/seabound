import { useCallback, useEffect, useRef, useState } from "react";
import { DiscoveryEntry } from "../data/types";

const MAX_VISIBLE = 5;
const AUTO_DISMISS_MS = 5000;

interface Toast {
  entry: DiscoveryEntry;
  dismissing: boolean;
}

export function NotificationToast({
  discoveryLog,
  lastSeenDiscoveryId,
  onSeen,
  onBiomeDiscovery,
}: {
  discoveryLog: DiscoveryEntry[];
  lastSeenDiscoveryId: number;
  onSeen: (id: number) => void;
  onBiomeDiscovery?: (entry: DiscoveryEntry) => void;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Watch for new discovery log entries
  useEffect(() => {
    if (discoveryLog.length === 0) return;

    // discoveryLog is newest-first (unshift), so index 0 is newest
    const newBiomeEntries: DiscoveryEntry[] = [];
    const newLoreEntries: DiscoveryEntry[] = [];
    for (const entry of discoveryLog) {
      if (entry.id <= lastSeenDiscoveryId) break;
      if (entry.type === "biome" && entry.biomeId) {
        newBiomeEntries.push(entry);
      }
      if (entry.type === "lore" || entry.type === "expedition") {
        newLoreEntries.push(entry);
      }
    }

    if (newBiomeEntries.length === 0 && newLoreEntries.length === 0) {
      // Still mark latest as seen even if no biome toasts, so we don't re-scan next time
      if (discoveryLog[0].id > lastSeenDiscoveryId) {
        onSeen(discoveryLog[0].id);
      }
      return;
    }

    // Mark all current entries as seen
    onSeen(discoveryLog[0].id);

    if (newLoreEntries.length > 0) {
      const loreToAdd = newLoreEntries.slice(0, MAX_VISIBLE).reverse();
      setToasts((prev) => {
        const next = [...prev, ...loreToAdd.map((e) => ({ entry: e, dismissing: false }))];
        return next.slice(-MAX_VISIBLE);
      });
    }

    // Route biome discoveries to the modal handler
    if (onBiomeDiscovery) {
      // Oldest first so they queue in order
      for (const entry of newBiomeEntries.slice().reverse()) {
        onBiomeDiscovery(entry);
      }
      return;
    }

    // Fallback: show biome discoveries as toasts if no modal handler
    if (newBiomeEntries.length > 0) {
      const toAdd = newBiomeEntries.slice(0, MAX_VISIBLE).reverse();
      setToasts((prev) => {
        const next = [...prev, ...toAdd.map((e) => ({ entry: e, dismissing: false }))];
        return next.slice(-MAX_VISIBLE);
      });
    }
  }, [discoveryLog, lastSeenDiscoveryId, onSeen, onBiomeDiscovery]);

  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) =>
      prev.map((t) => (t.entry.id === id ? { ...t, dismissing: true } : t))
    );
  }, []);

  // Auto-dismiss expedition toasts after 5 seconds (lore/biome stay until clicked)
  useEffect(() => {
    for (const t of toasts) {
      if (t.dismissing || timersRef.current.has(t.entry.id)) continue;
      if (t.entry.type !== "expedition") continue;
      timersRef.current.set(
        t.entry.id,
        setTimeout(() => {
          timersRef.current.delete(t.entry.id);
          dismiss(t.entry.id);
        }, AUTO_DISMISS_MS)
      );
    }
  }, [toasts, dismiss]);

  // Remove after dismiss animation
  const handleAnimationEnd = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.entry.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.entry.id}
          className={`toast toast-${toast.entry.type}${toast.dismissing ? " toast-exit" : ""}`}
          onClick={() => dismiss(toast.entry.id)}
          onAnimationEnd={() => {
            if (toast.dismissing) handleAnimationEnd(toast.entry.id);
          }}
        >
          <span className="toast-message">{toast.entry.message}</span>
          <span className="toast-close" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="4" x2="14" y2="14" /><line x1="14" y1="4" x2="4" y2="14" /></svg>
          </span>
        </div>
      ))}
    </div>
  );
}
