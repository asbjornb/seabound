import { GameLog } from "../engine/useGame";

export function LogPanel({ logs }: { logs: GameLog[] }) {
  if (logs.length === 0) {
    return <div className="empty-message">No activity yet. Start gathering!</div>;
  }

  return (
    <div>
      {logs.map((log) => {
        const time = new Date(log.timestamp);
        const ts = time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        return (
          <div key={log.id} className="log-entry">
            <span className="log-time">{ts}</span>
            {log.message}
          </div>
        );
      })}
    </div>
  );
}
