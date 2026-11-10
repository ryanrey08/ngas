import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  green: { wrap: "bg-green-50 border-green-100", icon: "bg-green-600 text-white" },
  blue: { wrap: "bg-blue-50 border-blue-100", icon: "bg-blue-600 text-white" },
  purple: { wrap: "bg-purple-50 border-purple-100", icon: "bg-purple-600 text-white" },
  amber: { wrap: "bg-amber-50 border-amber-100", icon: "bg-amber-500 text-white" },
  orange: { wrap: "bg-orange-50 border-orange-100", icon: "bg-orange-500 text-white" },
  red: { wrap: "bg-brand-50 border-brand-100", icon: "bg-brand-600 text-white" },
} as const;

export type StatTone = keyof typeof tones;

/** Pastel summary tile used across eNGAS module pages. */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "blue",
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
}) {
  const t = tones[tone];
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border p-3.5", t.wrap)}>
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", t.icon)}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-neutral-600">{label}</p>
        <p className="font-heading text-base leading-tight font-bold break-words text-ink-900 tabular-nums xl:text-[1.05rem]">{value}</p>
        {hint && <p className="truncate text-[0.7rem] text-neutral-500">{hint}</p>}
      </div>
    </div>
  );
}
