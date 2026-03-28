/** Inline icon rendered as a small image, replacing emoji icons */
export function GameIcon({ id, size = 20 }: { id: string; size?: number }) {
  return (
    <img
      src={`/icons/${id}.png`}
      alt=""
      className="game-icon"
      width={size}
      height={size}
    />
  );
}
