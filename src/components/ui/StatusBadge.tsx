import { CircleCheck, Clock3, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  gray: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
  red: "bg-brand-50 text-brand-700 ring-brand-200",
  dark: "bg-ink-900 text-white ring-ink-900",
} as const;

export type BadgeTone = keyof typeof tones;

const STATUS_TONES: Record<string, BadgeTone> = {
  Posted: "green",
  Active: "green",
  Approved: "green",
  "Fully Paid": "green",
  Paid: "green",
  Current: "green",
  Reconciled: "green",
  Ready: "green",
  Balanced: "green",
  "For Posting": "green",
  Released: "green",
  Draft: "blue",
  "Partially Paid": "blue",
  Receipt: "blue",
  "For Deposit": "blue",
  Scheduled: "gray",
  Inactive: "gray",
  Outstanding: "gray",
  Closed: "gray",
  Pending: "amber",
  Unposted: "amber",
  Processing: "amber",
  Invited: "amber",
  "For Approval": "amber",
  "1 – 30 days": "amber",
  "31 – 60 days": "amber",
  "61 – 90 days": "orange",
  Disbursement: "purple",
  Overdue: "red",
  "Over 90 days": "red",
  Reversed: "red",
  Rejected: "red",
  Unreconciled: "red",
  Cancelled: "red",
};

const ICONS: Record<string, typeof CircleCheck> = {
  Posted: CircleCheck,
  Active: CircleCheck,
  Reconciled: CircleCheck,
  Unposted: Clock3,
  Pending: Clock3,
  Reversed: RotateCcw,
};

export function StatusBadge({ status, tone, className }: { status: string; tone?: BadgeTone; className?: string }) {
  const t = tone ?? STATUS_TONES[status] ?? "gray";
  const Icon = ICONS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap ring-1 ring-inset",
        tones[t],
        className,
      )}
    >
      {Icon ? <Icon className="h-3 w-3" aria-hidden /> : <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {status}
    </span>
  );
}
