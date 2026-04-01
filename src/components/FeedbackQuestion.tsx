import { useState, useEffect } from "react";

const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const WEB3FORMS_KEY = "b6727ec3-6cf2-443e-aa55-587b1964ec32";

const STORAGE_KEY = "seabound_feedbackQ";
const COOLDOWN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const MAX_DISMISSALS = 3;
const SHOW_DELAY_MS = 3000; // let the player see the game first

const QUESTIONS = [
  "What is the worst icon in the game?",
  "What building do you like the best — and worst?",
  "If you could extend any feature, what would it be?",
  "What was the most confusing moment when you first started playing?",
  "What resource feels the most tedious to gather?",
  "What skill is the most fun to level?",
  "Is there anything you expected to be able to craft but couldn't?",
  "What would make you recommend this game to a friend?",
];

interface FeedbackQState {
  lastAsked: number;
  dismissals: number; // consecutive dismissals without answering
  stopped: boolean;
}

function loadState(): FeedbackQState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { lastAsked: 0, dismissals: 0, stopped: false };
}

function saveState(s: FeedbackQState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function pickQuestion(): string {
  return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
}

export function FeedbackQuestion() {
  const [visible, setVisible] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    const state = loadState();
    if (state.stopped) return;
    if (Date.now() - state.lastAsked < COOLDOWN_MS) return;

    const timer = setTimeout(() => {
      setQuestion(pickQuestion());
      setVisible(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    const state = loadState();
    state.lastAsked = Date.now();
    state.dismissals += 1;
    if (state.dismissals >= MAX_DISMISSALS) state.stopped = true;
    saveState(state);
    setVisible(false);
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
        saveState(state);
        setTimeout(() => setVisible(false), 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!visible) return null;

  return (
    <div className="fq-overlay" onClick={dismiss}>
      <div className="fq-modal" onClick={(e) => e.stopPropagation()}>
        <button className="fq-close" onClick={dismiss}>✕</button>
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
          <button className="fq-skip" onClick={dismiss}>Skip</button>
        </div>
      </div>
    </div>
  );
}
