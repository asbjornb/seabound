import { forwardRef, ReactNode } from "react";

interface Props {
  name: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  summary?: string;
  children: ReactNode;
}

export const AccordionSection = forwardRef<HTMLElement, Props>(
  function AccordionSection({ name, icon, expanded, onToggle, summary, children }, ref) {
    return (
      <section ref={ref} className={`accordion-section${expanded ? " expanded" : ""}`}>
        <button className="accordion-header" onClick={onToggle}>
          <span className="accordion-chevron">{expanded ? "\u25BE" : "\u25B8"}</span>
          <span className="accordion-icon">{icon}</span>
          <span className="accordion-name">{name}</span>
          {summary && <span className="accordion-summary">{summary}</span>}
        </button>
        <div className="accordion-body">
          <div className="accordion-inner">
            {children}
          </div>
        </div>
      </section>
    );
  }
);
