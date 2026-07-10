"use client";

/**
 * BlockExchange.Buzz brand components.
 *
 * Logo: gold "B" + cyan "E" interlocked, with bidirectional arrows
 * (gold/cyan) forming an exchange symbol, plus three candlestick icons.
 * Wordmark: BLOCKEXCHANGE (white BLOCK + gold EXCHANGE) with .BUZZ below.
 * Tagline: TRADE SMARTER. GROW FASTER.
 */

type LogoSize = "xs" | "sm" | "md" | "lg";

export function BlockExchangeLogo({ size = "md" }: { size?: LogoSize }) {
  const dims =
    size === "lg" ? "w-16 h-16"
    : size === "md" ? "w-12 h-12"
    : size === "sm" ? "w-9 h-9"
    : "w-7 h-7";
  const gid = `bx-${size}`;
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
        {/* Thin gold arc curving above B and E */}
        <path d="M 18 38 A 38 38 0 0 1 82 38" fill="none" stroke={`url(#${gid}-gold)`} strokeWidth="2.5" strokeLinecap="round" />
        {/* B (gold) */}
        <text x="18" y="62" fontFamily="Geist, sans-serif" fontSize="32" fontWeight="900" fill={`url(#${gid}-gold)`}>B</text>
        {/* E (cyan) */}
        <text x="50" y="62" fontFamily="Geist, sans-serif" fontSize="32" fontWeight="900" fill={`url(#${gid}-cyan)`}>E</text>
        {/* Bidirectional arrows: gold arrow up-right, cyan arrow down-left */}
        <path d="M 22 66 L 48 40 M 48 40 L 40 40 M 48 40 L 48 48" stroke={`url(#${gid}-gold)`} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 78 34 L 52 60 M 52 60 L 60 60 M 52 60 L 52 52" stroke={`url(#${gid}-cyan)`} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Three candlestick charts on the right */}
        <rect x="70" y="66" width="4" height="10" fill={`url(#${gid}-gold)`} rx="1" />
        <line x1="72" y1="62" x2="72" y2="80" stroke={`url(#${gid}-gold)`} strokeWidth="1" />
        <rect x="78" y="68" width="4" height="8" fill={`url(#${gid}-cyan)`} rx="1" />
        <line x1="80" y1="64" x2="80" y2="80" stroke={`url(#${gid}-cyan)`} strokeWidth="1" />
        <rect x="86" y="64" width="4" height="12" fill={`url(#${gid}-gold)`} rx="1" />
        <line x1="88" y1="60" x2="88" y2="80" stroke={`url(#${gid}-gold)`} strokeWidth="1" />
      </svg>
    </div>
  );
}

export function BlockExchangeWordmark({ size = "md" }: { size?: LogoSize }) {
  const textSize =
    size === "lg" ? "text-2xl"
    : size === "md" ? "text-base"
    : size === "sm" ? "text-sm"
    : "text-xs";
  const subSize = size === "lg" ? "text-xs" : size === "md" ? "text-[10px]" : "text-[8px]";
  const tagSize = size === "lg" ? "text-[10px]" : size === "md" ? "text-[8px]" : "text-[7px]";
  return (
    <div className="leading-tight">
      <div className={`${textSize} font-bold tracking-tight`}>
        <span className="text-white">BLOCK</span>
        <span className="brock-text-gold">EXCHANGE</span>
      </div>
      <div className={`${subSize} tracking-[0.3em] flex items-center gap-1 mt-0.5`}>
        <span className="flex-1 h-px bg-brock-gold/30" />
        <span className="brock-text-gold font-semibold">.BUZZ</span>
        <span className="flex-1 h-px bg-brock-gold/30" />
      </div>
      <div className={`${tagSize} tracking-widest mt-0.5`}>
        <span className="text-white">TRADE SMARTER.</span> <span className="brock-text-gold">GROW FASTER.</span>
      </div>
    </div>
  );
}

export function BlockExchangeTagline() {
  return (
    <div className="text-[10px] tracking-widest text-muted-foreground">
      <span className="text-white">TRADE SMARTER.</span> <span className="brock-text-gold">GROW FASTER.</span>
    </div>
  );
}

// Combined compact header logo (icon + wordmark side by side)
export function BlockExchangeHeader({ size = "sm" }: { size?: LogoSize }) {
  return (
    <div className="flex items-center gap-2">
      <BlockExchangeLogo size={size} />
      <BlockExchangeWordmark size={size === "lg" ? "md" : size === "md" ? "sm" : "xs"} />
    </div>
  );
}
