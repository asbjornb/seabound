import { useEffect, useRef, useState } from "react";
import { DiscoveryEntry } from "../data/types";

const MAX_VISIBLE = 5;

interface Toast {
  entry: DiscoveryEntry;
  dismissing: boolean;
}

export function NotificationToast({ discoveryLog }: { discoveryLog: DiscoveryEntry[] }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSeenId = useRef<number>(-1);

  // Watch for new discovery log entries
  useEffect(() => {
    if (discoveryLog.length === 0) return;

    // discoveryLog is newest-first (unshift), so index 0 is newest
    const newEntries: DiscoveryEntry[] = [];
    for (const entry of discoveryLog) {
      if (entry.id <= lastSeenId.current) break;
      newEntries.push(entry);
    }

    if (newEntries.length === 0) return;

    lastSeenId.current = discoveryLog[0].id;

    // Add new toasts
    const toAdd = newEntries.slice(0, MAX_VISIBLE).reverse();
    setToasts((prev) => {
      const next = [...prev, ...toAdd.map((e) => ({ entry: e, dismissing: false }))];
      // Keep only the most recent toasts if too many pile up
      return next.slice(-MAX_VISIBLE);
    });
  }, [discoveryLog]);

  // Remove after dismiss animation
  const handleAnimationEnd = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.entry.id !== id));
  };

  const dismiss = (id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.entry.id === id ? { ...t, dismissing: true } : t))
    );
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
          <span className="toast-close">&times;</span>
        </div>
      ))}
    </div>
  );
}
