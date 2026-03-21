import { useEffect, useState } from "react";
import { PhaseInfo } from "../engine/phases";

interface Props {
  phase: PhaseInfo;
  onDismiss: () => void;
}

export function ChapterCard({ phase, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Fade in after mount
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 600);
  };

  return (
    <div
      className={`chapter-overlay${visible ? " visible" : ""}${exiting ? " exiting" : ""}`}
      onClick={dismiss}
    >
      <div className={`chapter-card phase-chapter-${phase.id}`}>
        <div className="chapter-index">Chapter {phase.index + 1}</div>
        <div className="chapter-name">{phase.name}</div>
        <div className="chapter-divider" />
        <div className="chapter-tagline">{phase.tagline}</div>
        <div className="chapter-tap">tap to continue</div>
      </div>
    </div>
  );
}
