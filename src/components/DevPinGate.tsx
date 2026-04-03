import { useState, type ReactNode } from "react";

const DEV_PIN = import.meta.env.VITE_DEV_PIN as string | undefined;
const SESSION_KEY = "seabound_dev_authed";

/**
 * Gates dev pages behind a 6-digit PIN when VITE_DEV_PIN is set.
 * In local dev (no PIN configured), passes through immediately.
 * Successful auth is stored in sessionStorage for the browser session.
 */
export function DevPinGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(
    () => !DEV_PIN || sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  if (authed) return <>{children}</>;

  const submit = () => {
    if (input === DEV_PIN) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
    } else {
      setError(true);
      setInput("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c1a1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: "#132626",
        borderRadius: 12,
        padding: "2rem",
        width: 300,
        textAlign: "center",
      }}>
        <h2 style={{ color: "#f0a050", marginBottom: "0.5rem" }}>Dev Access</h2>
        <p style={{ color: "#7a9a8a", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Enter PIN to continue
        </p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={input}
          onChange={(e) => {
            setInput(e.target.value.replace(/\D/g, ""));
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1.5rem",
            textAlign: "center",
            letterSpacing: "0.5em",
            background: "#1e3a3a",
            border: error ? "2px solid #de7a7a" : "2px solid #2d4a3e",
            borderRadius: 8,
            color: "#e8e4d8",
            outline: "none",
            boxSizing: "border-box",
          }}
          placeholder="------"
        />
        {error && (
          <p style={{ color: "#de7a7a", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            Incorrect PIN
          </p>
        )}
        <button
          onClick={submit}
          disabled={input.length < 1}
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "0.6rem",
            background: input.length >= 1 ? "#f0a050" : "#3a4a4a",
            color: "#0c1a1a",
            border: "none",
            borderRadius: 8,
            fontSize: "1rem",
            fontWeight: 600,
            cursor: input.length >= 1 ? "pointer" : "default",
          }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
