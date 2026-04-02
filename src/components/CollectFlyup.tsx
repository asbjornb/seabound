import { useEffect, useState } from "react";

export interface FlyupItem {
  id: number;
  text: string;
  x: number;
  y: number;
}

let flyupId = 0;

/** Trigger a flyup at the given screen coordinates. Returns a unique ID. */
export function createFlyup(text: string, x: number, y: number): FlyupItem {
  return { id: ++flyupId, text, x, y };
}

/** Renders animated "+N resource" flyups on screen. */
export function CollectFlyup({ items, onDone }: { items: FlyupItem[]; onDone: (id: number) => void }) {
  return (
    <div className="flyup-container" aria-hidden="true">
      {items.map((item) => (
        <FlyupEntry key={item.id} item={item} onDone={onDone} />
      ))}
    </div>
  );
}

function FlyupEntry({ item, onDone }: { item: FlyupItem; onDone: (id: number) => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone(item.id), 100);
    }, 900);
    return () => clearTimeout(timer);
  }, [item.id, onDone]);

  if (!visible) return null;

  return (
    <div
      className="flyup-item"
      style={{ left: item.x, top: item.y }}
    >
      {item.text}
    </div>
  );
}
