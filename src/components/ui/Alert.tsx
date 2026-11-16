import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "error" | "warning" | "info" | "success";

const styles: Record<Tone, string> = {
  error: "border-brand-200 bg-brand-50 text-brand-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};
const icons = { error: CircleAlert, warning: TriangleAlert, info: Info, success: CircleCheck };

/** Inline form/page message. Errors are announced immediately (role="alert"); others politely. */
export function Alert({ tone = "error", id, children, className }: { tone?: Tone; id?: string; children: ReactNode; className?: string }) {
  const Icon = icons[tone];
  return (
    <div
      id={id}
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", styles[tone], className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
