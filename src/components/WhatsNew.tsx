import { useState } from "react";
import changelogData from "../data/changelog.json";
import { CloseIcon } from "./CloseIcon";

const STORAGE_KEY = "seabound_lastSeenChangelog";

interface ChangelogMeta {
  newestReviewed: string;
}

interface ChangelogEntry {
  date: string;
  changes: string[];
}

interface ChangelogData {
  meta: ChangelogMeta;
  entries: ChangelogEntry[];
}

function getNewEntries(): ChangelogEntry[] {
  const data = changelogData as ChangelogData;
  const lastSeen = localStorage.getItem(STORAGE_KEY);
  if (lastSeen === data.meta.newestReviewed) return [];
  if (!lastSeen) {
    // First visit ever — mark as seen, don't show banner
    localStorage.setItem(STORAGE_KEY, data.meta.newestReviewed);
    return [];
  }
  // Show the most recent day's entries (the latest batch since they last visited)
  return data.entries.length > 0 ? [data.entries[0]] : [];
}

export function WhatsNew() {
  const [newEntries] = useState(getNewEntries);
  const [dismissed, setDismissed] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const data = changelogData as ChangelogData;
  const totalChanges = newEntries.reduce((sum, e) => sum + e.changes.length, 0);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, data.meta.newestReviewed);
    setDismissed(true);
  };

  if (showFull) {
    return <ChangelogModal onClose={() => { dismiss(); setShowFull(false); }} />;
  }

  if (dismissed || newEntries.length === 0) return null;

  return (
    <div className="whats-new-bar">
      <div className="whats-new-header">
        <span className="whats-new-title">
          What's New — {totalChanges} update{totalChanges !== 1 ? "s" : ""}
        </span>
        <button className="whats-new-close" onClick={dismiss}>
          <CloseIcon size={12} />
        </button>
      </div>
      <ul className="whats-new-list">
        {newEntries[0].changes.map((change, i) => (
          <li key={i}>{change}</li>
        ))}
      </ul>
      <button
        className="whats-new-full-link"
        onClick={() => setShowFull(true)}
      >
        View full changelog
      </button>
    </div>
  );
}

export function ChangelogModal({ onClose }: { onClose: () => void }) {
  const data = changelogData as ChangelogData;

  return (
    <div className="log-overlay" onClick={onClose}>
      <div className="log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal-header">
          <span className="log-modal-title">Changelog</span>
          <button className="log-modal-close" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="log-modal-body">
          {data.entries.map((entry, i) => (
            <div key={i} className="changelog-entry">
              <div className="changelog-date">{entry.date}</div>
              <ul className="changelog-changes">
                {entry.changes.map((change, j) => (
                  <li key={j}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
