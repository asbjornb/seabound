import { useState, useEffect, useRef } from "react";
import { CloseIcon } from "./CloseIcon";

const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const WEB3FORMS_KEY = "b6727ec3-6cf2-443e-aa55-587b1964ec32";

function getDeviceType(): string {
  const hasTouchScreen = navigator.maxTouchPoints > 0;
  const isNarrow = window.matchMedia("(max-width: 768px)").matches;
  return hasTouchScreen && isNarrow ? "mobile" : "desktop";
}

const STORAGE_KEY = "seabound_feedbackQ";
const COOLDOWN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const PAUSE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days after 3 dismissals
const MAX_DISMISSALS = 3;
const SHOW_DELAY_MS = 15_000; // 15s after page load

// Early questions — best for players still learning the game
const EARLY_QUESTIONS = [
  "Is anything tedious in a way that actually bothers you?",
  "What was the last thing that made you feel stuck?",
  "What part of the interface felt confusing or hard to use?",
  "Is anything on screen cluttered or overwhelming right now?",
];

// Later questions — better after the player has seen more content
const LATE_QUESTIONS = [
  "What is the worst icon in the game?",
  "What part of the game would you most like more of?",
  "What part of the game feels the most unfinished?",
  "What would make you recommend SeaBound to a friend?",
  "What would make the game slightly nicer for you to play?",
];

// Direction questions — game design and feature preferences
const DIRECTION_QUESTIONS = [
  "Would adding simple combat to the game feel okay for you?",
  "Would you prefer more story and lore elements in the game?",
  "Do you have any suggestions for the user interface?",
  "Do you have any feature suggestions?",
  "Would you rather have more content or better polish at this point?",
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
  const pool =
    answeredCount === 0
      ? EARLY_QUESTIONS
      : answeredCount <= 2
        ? LATE_QUESTIONS
        : DIRECTION_QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface FeedbackQuestionProps {
  hasPlayedEnough: boolean;
  hasModalOpen: boolean;
  phaseName: string;
  discoveredBiomes: string[];
  totalPlayTimeMs: number;
  activeTab: string;
}

export function FeedbackQuestion({
  hasPlayedEnough,
  hasModalOpen,
  phaseName,
  discoveredBiomes,
  totalPlayTimeMs,
  activeTab,
}: FeedbackQuestionProps) {
  const [mode, setMode] = useState<"hidden" | "modal" | "minimized">("hidden");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const triggeredRef = useRef(false);
  const touchMovedRef = useRef(false);

  useEffect(() => {
    if (!hasPlayedEnough || hasModalOpen || triggeredRef.current) return;

    const state = loadState();
    const now = Date.now();
    if (state.pausedUntil > now) return;
    if (now - state.lastAsked < COOLDOWN_MS) return;

    const timer = setTimeout(() => {
      if (triggeredRef.current) return;
      triggeredRef.current = true;
      const s = loadState();
      setQuestion(pickQuestion(s.answeredCount));
      setMode("modal");
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [hasPlayedEnough, hasModalOpen]);

  const dismiss = () => {
    const state = loadState();
    state.lastAsked = Date.now();
    state.dismissals += 1;
    if (state.dismissals >= MAX_DISMISSALS) {
      state.pausedUntil = Date.now() + PAUSE_MS;
      state.dismissals = 0;
    }
    saveState(state);
    setMode("hidden");
  };

  const minimize = () => {
    setMode("minimized");
  };

  const formatPlaytime = (ms: number) => {
    const hours = Math.floor(ms / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const submit = async () => {
    if (!answer.trim()) return;
    setStatus("sending");
    try {
      const context = [
        `Phase: ${phaseName}`,
        `Biomes: ${discoveredBiomes.join(", ") || "none"}`,
        `Playtime: ${formatPlaytime(totalPlayTimeMs)}`,
        `Tab: ${activeTab}`,
        `Device: ${getDeviceType()}`,
      ].join(" | ");

      const res = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: "SeaBound Feedback Question",
          message: `Q: ${question}\n\nA: ${answer.trim()}\n\n---\n${context}`,
          from_name: "SeaBound Feedback Question",
          page_url: window.location.href,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        const state = loadState();
        state.lastAsked = Date.now();
        state.dismissals = 0;
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

  useEffect(() => {
    if (mode !== "modal") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mode]);

  if (mode === "hidden") return null;

  if (mode === "minimized") {
    return (
      <button className="fq-pill" onClick={() => setMode("modal")}>
        Answer a quick question?
      </button>
    );
  }

  const modal = (
    <div
      className="fq-overlay"
      onTouchMove={() => {
        touchMovedRef.current = true;
      }}
      onTouchStart={() => {
        touchMovedRef.current = false;
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget || touchMovedRef.current) return;
        dismiss();
      }}
    >
      <div className="fq-modal" onClick={(e) => e.stopPropagation()}>
        <button className="fq-close" onClick={dismiss}><CloseIcon size={14} /></button>
        <p className="fq-intro">Quick question to help improve SeaBound:</p>
        <p className="fq-question">{question}</p>
        <textarea
          className="fq-textarea"
          rows={2}
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

  return modal;
}
