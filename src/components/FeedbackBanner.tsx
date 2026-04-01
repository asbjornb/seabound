import { useState } from "react";

const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const WEB3FORMS_KEY = "b6727ec3-6cf2-443e-aa55-587b1964ec32";

export function FeedbackBanner() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [expanded, setExpanded] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: "SeaBound Feedback",
          message: text.trim(),
          from_name: "SeaBound Feedback Form",
          page_url: window.location.href,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        setText("");
        setTimeout(() => {
          setStatus("idle");
          setExpanded(false);
        }, 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <footer className="feedback-banner">
      <p className="feedback-blurb">
        This is a very early version. Find anything unintuitive, historically
        infeasible or unrealistic, a bug, something you hate or some other
        feedback or suggestion, don't hesitate:
      </p>

      {!expanded ? (
        <button className="feedback-expand-btn" onClick={() => setExpanded(true)}>
          Send anonymous feedback
        </button>
      ) : (
        <div className="feedback-form">
          <textarea
            className="feedback-textarea"
            rows={3}
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={status === "sending"}
          />
          <div className="feedback-form-actions">
            <button
              className="feedback-submit-btn"
              onClick={submit}
              disabled={!text.trim() || status === "sending"}
            >
              {status === "sending"
                ? "Sending..."
                : status === "sent"
                  ? "Sent — thank you!"
                  : status === "error"
                    ? "Failed — try again"
                    : "Send"}
            </button>
            <button
              className="feedback-cancel-btn"
              onClick={() => { setExpanded(false); setText(""); setStatus("idle"); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="feedback-alt-links">
        <a
          href="https://github.com/asbjornb/SeaBound/issues/new?title=Feedback&labels=feedback"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open a GitHub issue
        </a>
        <span className="feedback-sep">or</span>
        <a href="mailto:asbjoernbrandt+seabound@gmail.com?subject=SeaBound%20Feedback">
          Send an email
        </a>
      </div>
    </footer>
  );
}
