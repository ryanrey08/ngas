import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** White panel with the red icon + bold title header used throughout the mockups. */
export function SectionCard({
  title,
  icon: Icon,
  actions,
  children,
  className,
  bodyClassName,
  variant = "default",
}: {
  title: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** "accent" renders a solid red header (e.g. Quick Actions / Quick Links). */
  variant?: "default" | "accent";
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 px-4 py-2.5",
          variant === "accent" ? "bg-gradient-to-r from-brand-700 to-brand-600 text-white" : "border-b border-neutral-100 bg-neutral-50/60",
        )}
      >
        <h2 className={cn("flex items-center gap-2 text-sm font-bold", variant === "accent" ? "text-white" : "text-ink-900")}>
          {Icon && <Icon className={cn("h-4 w-4", variant === "accent" ? "text-white" : "text-brand-600")} aria-hidden />}
          {title}
        </h2>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
