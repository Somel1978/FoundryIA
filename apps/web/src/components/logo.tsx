/** FoundryVTTAI brand mark: a d20-style hexagon forged in violet → ember. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="fvtt-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.62 0.23 285)" />
          <stop offset="0.55" stopColor="oklch(0.62 0.24 330)" />
          <stop offset="1" stopColor="oklch(0.75 0.17 55)" />
        </linearGradient>
      </defs>
      <path d="M16 1.5 28.6 8.75v14.5L16 30.5 3.4 23.25V8.75Z" fill="url(#fvtt-g)" />
      <path
        d="M16 1.5v8.2m0 0L7.2 22.2h17.6L16 9.7ZM3.4 8.75l3.8 13.45M28.6 8.75l-3.8 13.45M16 30.5l-8.8-8.3M16 30.5l8.8-8.3"
        fill="none"
        stroke="white"
        strokeOpacity=".55"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="17" r="2.2" fill="white" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="font-display text-[1.05rem] font-semibold tracking-tight">
      FoundryVTT<span className="text-gradient">AI</span>
    </span>
  );
}
