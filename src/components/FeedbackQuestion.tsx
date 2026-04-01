import { useState, useEffect, useRef } from "react";

const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const WEB3FORMS_KEY = "b6727ec3-6cf2-443e-aa55-587b1964ec32";

const STORAGE_KEY = "seabound_feedbackQ";
const COOLDOWN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const PAUSE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days after 3 dismissals
const MAX_DISMISSALS = 3;
const ACTIVE_PLAY_MS = 60_000; // show after 60s of active play

// Early questions — best for players still learning the game
const EARLY_QUESTIONS = [
  "What was the most confusing moment when you first started playing?",
  "What resource feels the most tedious to gather?",
  "What was the last thing that made you feel stuck?",
];

// Later questions — better after the player has seen more content
const LATE_QUESTIONS = [
  "What is the worst icon in the game?",
  "What feature would you most want expanded?",
  "What part of the game feels the most unfinished?",
  "What would make you recommend SeaBound to a friend?",
];

interface FeedbackQState {
  lastAsked: number;
  dismissals: number; // consecutive dismissals without answering
  pausedUntil: number; // 0 = not paused; timestamp = resume after this
  answeredCount: number; // total answers submitted (drives early → late)
}

function loadState(): FeedbackQState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate old "stopped: true" → pausedUntil far future
      if (parsed.stopped) {
        return {
          lastAsked: parsed.lastAsked ?? 0,
          dismissals: parsed.dismissals ?? 0,
          pausedUntil: parsed.lastAsked ? parsed.lastAsked + PAUSE_MS : 0,
          answeredCount: parsed.answeredCount ?? 0,
        };
      }
      return {
        lastAsked: parsed.lastAsked ?? 0,
        dismissals: parsed.dismissals ?? 0,
        pausedUntil: parsed.pausedUntil ?? 0,
        answeredCount: parsed.answeredCount ?? 0,
      };
    }
  } catch { /* ignore */ }
  return { lastAsked: 0, dismissals: 0, pausedUntil: 0, answeredCount: 0 };
}

function saveState(s: FeedbackQState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function pickQuestion(answeredCount: number): string {
  // After at least one answer, switch to late/depth questions
  const pool = answeredCount > 0 ? LATE_QUESTIONS : EARLY_QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface FeedbackQuestionProps {
  hasPlayedEnough: boolean; // e.g. has unlocked raft recipe
}

export function FeedbackQuestion({ hasPlayedEnough }: FeedbackQuestionProps) {
  const [mode, setMode] = useState<"hidden" | "modal" | "minimized">("hidden");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const activeTimeRef = useRef(0);
  const lastTickRef = useRef(0);
  const triggeredRef = useRef(false);

  // Track active play time via pointer/key activity, then show after threshold
  useEffect(() => {
    if (!hasPlayedEnough) return;

    const state = loadState();
    const now = Date.now();
    if (state.pausedUntil > now) return;
    if (now - state.lastAsked < COOLDOWN_MS) return;

    const onActivity = () => {
      const t = Date.now();
      // Count time since last activity tick, but cap gaps at 2s
      // so AFK time doesn't count
      if (lastTickRef.current > 0) {
        const delta = Math.min(t - lastTickRef.current, 2000);
        activeTimeRef.current += delta;
      }
      lastTickRef.current = t;

      if (!triggeredRef.current && activeTimeRef.current >= ACTIVE_PLAY_MS) {
        triggeredRef.current = true;
        const s = loadState();
        setQuestion(pickQuestion(s.answeredCount));
        setMode("modal");
      }
    };

    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [hasPlayedEnough]);

  const dismiss = () => {
    const state = loadState();
    state.lastAsked = Date.now();
    state.dismissals += 1;
    if (state.dismissals >= MAX_DISMISSALS) {
      state.pausedUntil = Date.now() + PAUSE_MS;
      state.dismissals = 0; // reset so the cycle can repeat
    }
    saveState(state);
    setMode("hidden");
  };

  const minimize = () => {
    setMode("minimized");
  };

  const submit = async () => {
    if (!answer.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: "SeaBound Feedback Question",
          message: `Q: ${question}\n\nA: ${answer.trim()}`,
          from_name: "SeaBound Feedback Question",
          page_url: window.location.href,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        const state = loadState();
        state.lastAsked = Date.now();
        state.dismissals = 0; // reset streak — they engaged
        state.answeredCount += 1;
        saveState(state);
        setTimeout(() => setMode("hidden"), 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (mode === "hidden") return null;

  if (mode === "minimized") {
    return (
      <button className="fq-pill" onClick={() => setMode("modal")}>
        Answer a quick question?
      </button>
    );
  }

  return (
    <div className="fq-overlay" onClick={dismiss}>
      <div className="fq-modal" onClick={(e) => e.stopPropagation()}>
        <button className="fq-close" onClick={dismiss}>✕</button>
        <p className="fq-intro">Quick question to help improve SeaBound:</p>
        <p className="fq-question">{question}</p>
        <textarea
          className="fq-textarea"
          rows={3}
          placeholder="Your thoughts (anonymous)..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={status === "sending" || status === "sent"}
        />
        <div className="fq-actions">
          <button
            className="fq-submit"
            onClick={submit}
            disabled={!answer.trim() || status === "sending" || status === "sent"}
          >
            {status === "sending"
              ? "Sending..."
              : status === "sent"
                ? "Thanks!"
                : status === "error"
                  ? "Failed — retry"
                  : "Send"}
          </button>
          <button className="fq-check" onClick={minimize}>Let me check</button>
          <button className="fq-skip" onClick={dismiss}>Skip</button>
        </div>
      </div>
    </div>
  );
}
