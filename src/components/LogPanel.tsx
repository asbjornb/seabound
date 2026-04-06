import { useEffect, useMemo, useState } from "react";
import { DiscoveryEntry, DiscoveryType } from "../data/types";

const TYPE_LABELS: Record<string, string> = {
  biome: "Exploration",
  level: "Milestone",
  craft: "Crafting",
  building: "Settlement",
  resource: "Discovery",
  tool: "Tooling",
  lore: "Omen",
};

const FILTER_ORDER: DiscoveryType[] = ["biome", "resource", "lore", "building", "craft", "tool", "level"];

export function LogPanel({ entries }: { entries: DiscoveryEntry[] }) {
  const [includedTypes, setIncludedTypes] = useState<DiscoveryType[]>([]);

  const availableFilters = useMemo(() => {
    const types = new Set<DiscoveryType>(entries.map((entry) => entry.type));
    return FILTER_ORDER.filter((type) => types.has(type));
  }, [entries]);

  useEffect(() => {
    setIncludedTypes((prev) => {
      if (prev.length === 0) return availableFilters;
      const next = prev.filter((type) => availableFilters.includes(type));
      return next.length > 0 ? next : availableFilters;
    });
  }, [availableFilters]);

  const toggleType = (type: DiscoveryType) => {
    setIncludedTypes((prev) => {
      if (prev.includes(type)) {
        // Keep at least one included type so the log never gets stuck empty.
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const filteredEntries = useMemo(() => {
    if (includedTypes.length === 0) return entries;
    const includedSet = new Set(includedTypes);
    return entries.filter((entry) => includedSet.has(entry.type));
  }, [entries, includedTypes]);

  if (entries.length === 0) {
    return (
      <div className="empty-message">
        No discoveries yet. Start exploring!
      </div>
    );
  }

  return (
    <div>
      <div className="filter-bar">
        <button
          className={`filter-toggle${includedTypes.length === availableFilters.length ? " active" : ""}`}
          onClick={() => setIncludedTypes(availableFilters)}
        >
          Include All
        </button>
        <button
          className="filter-toggle"
          onClick={() => {
            if (availableFilters.length > 0) {
              setIncludedTypes([availableFilters[0]]);
            }
          }}
        >
          Exclude All But One
        </button>
        {availableFilters.map((type) => (
          <button
            key={type}
            className={`filter-toggle${includedTypes.includes(type) ? " active" : ""}`}
            onClick={() => toggleType(type)}
          >
            {includedTypes.includes(type) ? "Included: " : "Excluded: "}
            {TYPE_LABELS[type] ?? type}
          </button>
        ))}
      </div>
      {filteredEntries.length === 0 && (
        <div className="empty-message">
          No entries in this category yet.
        </div>
      )}
      {filteredEntries.map((entry) => {
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
