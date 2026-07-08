"use client";

/**
 * BuzzCryp brand components.
 *
 * Logo: gold "B" + cyan "C" interlocked, with an upward arrow
 * symbolizing growth, plus three candlestick chart icons.
 * Wordmark: BUZZ (white) + CRYP (gold).
 * Tagline: TRADE SMARTER. GROW FASTER.
 */

type LogoSize = "xs" | "sm" | "md" | "lg";

export function BuzzCrypLogo({ size = "md" }: { size?: LogoSize }) {
  const dims =
    size === "lg" ? "w-16 h-16"
    : size === "md" ? "w-12 h-12"
    : size === "sm" ? "w-9 h-9"
    : "w-7 h-7";
  const gid = `bc-${size}`;
  return (
    <div className={`relative ${dims}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={`${gid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd54f" />
            <stop offset="100%" stopColor="#f5b400" />
          </linearGradient>
          <linearGradient id={`${gid}-cyan`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#00b8d4" />
          </linearGradient>
        </defs>
        {/* Thin gold arc curving above B and C */}
        <path d="M 18 38 A 38 38 0 0 1 82 38" fill="none" stroke={`url(#${gid}-gold)`} strokeWidth="2.5" strokeLinecap="round" />
        {/* B (gold) */}
        <text x="16" y="62" fontFamily="Geist, sans-serif" fontSize="34" fontWeight="900" fill={`url(#${gid}-gold)`}>B</text>
        {/* C (cyan) */}
        <text x="50" y="62" fontFamily="Geist, sans-serif" fontSize="34" fontWeight="900" fill={`url(#${gid}-cyan)`}>C</text>
        {/* Upward arrow through B and C (growth symbol) */}
        <path d="M 25 68 L 50 35 L 75 68 M 50 35 L 50 72" stroke={`url(#${gid}-gold)`} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Three candlestick charts below arrow */}
        <rect x="36" y="76" width="5" height="8" fill={`url(#${gid}-gold)`} rx="1" />
        <line x1="38.5" y1="72" x2="38.5" y2="86" stroke={`url(#${gid}-gold)`} strokeWidth="1" />
        <rect x="46" y="73" width="5" height="11" fill={`url(#${gid}-cyan)`} rx="1" />
        <line x1="48.5" y1="69" x2="48.5" y2="86" stroke={`url(#${gid}-cyan)`} strokeWidth="1" />
        <rect x="56" y="70" width="5" height="14" fill={`url(#${gid}-gold)`} rx="1" />
        <line x1="58.5" y1="66" x2="58.5" y2="86" stroke={`url(#${gid}-gold)`} strokeWidth="1" />
      </svg>
    </div>
  );
}

export function BuzzCrypWordmark({ size = "md" }: { size?: LogoSize }) {
  const textSize =
    size === "lg" ? "text-2xl"
    : size === "md" ? "text-base"
    : size === "sm" ? "text-sm"
    : "text-xs";
  const tagSize = size === "lg" ? "text-[10px]" : size === "md" ? "text-[8px]" : "text-[7px]";
  return (
    <div className="leading-tight">
      <div className={`${textSize} font-bold tracking-tight`}>
        <span className="text-white">BUZZ</span>
        <span className="brock-text-gold">CRYP</span>
      </div>
      <div className={`${tagSize} tracking-widest mt-0.5`}>
        <span className="text-white">TRADE SMARTER.</span> <span className="brock-text-gold">GROW FASTER.</span>
      </div>
    </div>
  );
}

export function BuzzCrypTagline() {
  return (
    <div className="text-[10px] tracking-widest text-muted-foreground">
      <span className="text-white">TRADE SMARTER.</span> <span className="brock-text-gold">GROW FASTER.</span>
    </div>
  );
}

// Combined compact header logo (icon + wordmark side by side)
export function BuzzCrypHeader({ size = "sm" }: { size?: LogoSize }) {
  return (
    <div className="flex items-center gap-2">
      <BuzzCrypLogo size={size} />
      <BuzzCrypWordmark size={size === "lg" ? "md" : size === "md" ? "sm" : "xs"} />
    </div>
  );
}

// Backward-compat aliases (so existing imports keep working during migration)
export const BlockExchangeLogo = BuzzCrypLogo;
export const BlockExchangeWordmark = BuzzCrypWordmark;
export const BlockExchangeTagline = BuzzCrypTagline;
