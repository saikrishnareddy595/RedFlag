interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * RedFlag mark — a sharp, forward-leaning flag with a single fold/crease that
 * splits it into two facets, conveying speed and precision.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="rf-top" x1="8" y1="6" x2="36" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb7185" />
          <stop offset="1" stopColor="#f43f5e" />
        </linearGradient>
        <linearGradient id="rf-fold" x1="8" y1="14" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e11d48" />
          <stop offset="1" stopColor="#9f1239" />
        </linearGradient>
        <linearGradient id="rf-pole" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fafafa" />
          <stop offset="1" stopColor="#a1a1aa" />
        </linearGradient>
      </defs>

      {/* pole */}
      <rect x="7.5" y="4" width="3" height="32" rx="1.5" fill="url(#rf-pole)" />

      {/* upper facet */}
      <path d="M10.5 6 L35 10 L29 17.5 L10.5 13.5 Z" fill="url(#rf-top)" />
      {/* folded lower facet */}
      <path d="M10.5 13.5 L29 17.5 L23 26 L10.5 22 Z" fill="url(#rf-fold)" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  className?: string;
  /** Tailwind text color class for the wordmark (e.g. "text-white"). */
  wordmarkClassName?: string;
}

/** Full lockup: the sharp-fold mark plus the RedFlag wordmark. */
export function Logo({ size = 30, className, wordmarkClassName = "text-white" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      <span
        className={`font-display text-lg font-bold tracking-tight ${wordmarkClassName}`}
      >
        Red<span className="text-brand-500">Flag</span>
      </span>
    </span>
  );
}
