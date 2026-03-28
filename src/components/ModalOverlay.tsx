import { ReactNode, useEffect } from "react";

interface Props {
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ModalOverlay({ onClose, title, icon, className, children }: Props) {
  // Prevent background scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className={`modal-overlay${className ? ` ${className}` : ""}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{icon}{icon && " "}{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
