import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" } as const;

export function LoadingSpinner({
  size = "md",
  className,
  label = "Loading…",
}: {
  size?: keyof typeof sizes;
  className?: string;
  /** Visually hidden label for screen readers. Pass "" when used inside a labelled control. */
  label?: string;
}) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex items-center">
      <LoaderCircle aria-hidden className={cn("animate-spin text-brand-600", sizes[size], className)} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-neutral-500">
      <LoadingSpinner size="lg" label={label} />
      <span aria-hidden>{label}</span>
    </div>
  );
}
