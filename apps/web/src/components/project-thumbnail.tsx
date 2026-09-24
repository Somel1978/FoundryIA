/** Hue derived from a string, for per-project placeholder art. */
function hueOf(seed: string): number {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** Project cover: the chosen thumbnail image, or generated art with initials. */
export function ProjectThumbnail({
  name,
  mediaId,
  className = "",
  initialsClassName = "text-4xl",
}: {
  name: string;
  mediaId: string | null;
  className?: string;
  /** Size of the fallback initials; scale with the thumbnail. */
  initialsClassName?: string;
}) {
  if (mediaId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/media/${mediaId}`} alt={`${name} thumbnail`} className={`object-cover ${className}`} loading="lazy" />
    );
  }
  const hue = hueOf(name);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <div
      className={`relative grid place-items-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 20%, oklch(0.7 0.18 ${hue}) 0%, transparent 55%), radial-gradient(circle at 80% 90%, oklch(0.65 0.2 ${(hue + 60) % 360}) 0%, transparent 50%), oklch(0.3 0.08 ${hue})`,
      }}
      aria-hidden
    >
      <div className="bg-grid absolute inset-0 opacity-40" />
      <span className={`relative font-display font-bold text-white/90 drop-shadow ${initialsClassName}`}>{initials || "?"}</span>
    </div>
  );
}
