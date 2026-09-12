import { clsx } from "@/lib/clsx";

type LogoTheme = "light" | "dark";

/**
 * The Creditxora mark, redrawn as SVG so it stays crisp at 24px and inverts
 * cleanly on the dark navy surfaces: the navy "C" ring holding a rising bar
 * chart, with the green confirmation sweep rising out of its opening.
 *
 * The full lockup's X lives in the wordmark ("Credit-x-ora") rather than the
 * mark — at header size the extra strokes turned the glyph into a blob.
 */
export function LogoMark({
  className,
  theme = "light",
}: {
  className?: string;
  theme?: LogoTheme;
}) {
  const navy = theme === "dark" ? "#ffffff" : "#16305b";
  const uid = theme === "dark" ? "d" : "l";

  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Creditxora"
      className={clsx("shrink-0", className)}
    >
      <defs>
        <linearGradient id={`cx-green-${uid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#16873c" />
          <stop offset="55%" stopColor="#22a757" />
          <stop offset="100%" stopColor="#3fc072" />
        </linearGradient>
      </defs>

      {/* Open "C" ring */}
      <path
        d="M34.6 13.4 A 15 15 0 1 0 34.6 34.6"
        fill="none"
        stroke={navy}
        strokeWidth="6.6"
        strokeLinecap="round"
      />

      {/* Rising bars inside the ring */}
      <g fill={`url(#cx-green-${uid})`}>
        <rect x="15" y="24" width="4" height="7" rx="1.2" />
        <rect x="20.5" y="19.5" width="4" height="11.5" rx="1.2" />
        <rect x="26" y="15.5" width="4" height="15.5" rx="1.2" />
      </g>

      {/* Green confirmation sweep, rising out of the ring's opening */}
      <path
        d="M30.5 30 L 36.5 37 L 45.5 8"
        fill="none"
        stroke={`url(#cx-green-${uid})`}
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  theme = "light",
  showTagline = false,
  className,
  markClassName,
}: {
  theme?: LogoTheme;
  showTagline?: boolean;
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <LogoMark theme={theme} className={clsx("h-9 w-9", markClassName)} />
      <span className="flex flex-col leading-none">
        <span
          className={clsx(
            "font-display text-[1.28rem] font-extrabold tracking-tight",
            theme === "dark" ? "text-white" : "text-navy-800",
          )}
        >
          Credit
          <span className={theme === "dark" ? "text-brand-300" : "text-brand-600"}>
            x
          </span>
          ora
        </span>
        {showTagline ? (
          <span
            className={clsx(
              "mt-1 text-[0.6rem] font-medium uppercase tracking-[0.14em]",
              theme === "dark" ? "text-navy-200/80" : "text-muted",
            )}
          >
            Building stronger credit
          </span>
        ) : null}
      </span>
    </span>
  );
}
