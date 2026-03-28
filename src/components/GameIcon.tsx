import { getModIconUrl } from "../data/modding";

/** Inline icon rendered as a small image. Checks mod-provided icons first. */
export function GameIcon({ id, size = 20 }: { id: string; size?: number }) {
  const modUrl = getModIconUrl(id);
  const src = modUrl ?? `/icons/${id}.png`;
  return (
    <img
      src={src}
      alt=""
      className="game-icon"
      width={size}
      height={size}
    />
  );
}
