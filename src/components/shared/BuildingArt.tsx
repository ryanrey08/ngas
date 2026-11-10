import { cn } from "@/lib/utils";

/** Decorative government-building silhouette with a red swoosh (sidebar footer art). */
export function SidebarBuildingArt({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 260 200" className={cn("w-full", className)} preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="bldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#1b1b1b" />
        </linearGradient>
      </defs>
      <g fill="url(#bldg)" opacity="0.9">
        <polygon points="40,70 130,28 220,70" />
        <rect x="46" y="72" width="168" height="10" />
        {[58, 86, 114, 142, 170, 198].map((x) => (
          <rect key={x} x={x - 6} y="86" width="12" height="70" rx="2" />
        ))}
        <rect x="38" y="156" width="184" height="10" />
        <rect x="30" y="166" width="200" height="10" />
      </g>
      <path d="M0 196 C 70 150, 150 205, 260 150 L 260 200 L 0 200 Z" fill="#a81218" />
      <path d="M0 186 C 80 140, 160 200, 260 138" fill="none" stroke="#d7191f" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

/** Decorative banner for page headers: classical façade fading in from the right. */
export function HeaderBannerArt({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-y-0 right-0 w-[46%] overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" style={{ zIndex: 1 }} />
      <svg viewBox="0 0 520 140" preserveAspectRatio="xMaxYMax slice" className="h-full w-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8edf4" />
            <stop offset="100%" stopColor="#f7f8fa" />
          </linearGradient>
          <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9dde3" />
            <stop offset="100%" stopColor="#b9bfc8" />
          </linearGradient>
        </defs>
        <rect width="520" height="140" fill="url(#sky)" />
        <g fill="url(#stone)">
          <polygon points="150,40 340,6 530,40" />
          <rect x="150" y="40" width="380" height="9" />
          {Array.from({ length: 10 }, (_, i) => 168 + i * 36).map((x) => (
            <rect key={x} x={x} y="52" width="14" height="74" rx="2" />
          ))}
          <rect x="140" y="126" width="400" height="14" />
        </g>
        <rect x="120" y="10" width="2" height="70" fill="#9ca3af" />
        <rect x="122" y="12" width="34" height="11" fill="#1d4ed8" />
        <rect x="122" y="23" width="34" height="11" fill="#d7191f" />
        <polygon points="122,12 136,23 122,34" fill="#ffffff" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-brand-600 to-brand-700" style={{ zIndex: 2 }} />
    </div>
  );
}
