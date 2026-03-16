import { DiscoveryEntry } from "../data/types";

const TYPE_LABELS: Record<string, string> = {
  biome: "Exploration",
  level: "Milestone",
  craft: "Crafting",
  building: "Settlement",
  resource: "Discovery",
};

export function LogPanel({ entries }: { entries: DiscoveryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="empty-message">
        No discoveries yet. Start exploring!
      </div>
    );
  }

  return (
    <div>
      {entries.map((entry) => {
        const time = new Date(entry.timestamp);
        const ts = time.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
        return (
          <div key={entry.id} className={`log-entry log-${entry.type}`}>
            <span className="log-time">{ts}</span>
            <span className="log-type">{TYPE_LABELS[entry.type] ?? entry.type}</span>
            {entry.message}
          </div>
        );
      })}
    </div>
  );
}
