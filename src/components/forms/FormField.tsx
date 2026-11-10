import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared label / hint / error wrapper for all form controls. */
export function FormField({
  id,
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink-800">
        {label}
        {required && (
          <span className="ml-0.5 text-brand-600" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-brand-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function controlClasses(hasError?: boolean, extra?: string) {
  return cn(
    "w-full rounded-lg border bg-white px-3 text-sm text-ink-900 placeholder:text-neutral-400 transition-colors",
    "focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
    hasError
      ? "border-brand-600 focus:border-brand-600 focus:ring-brand-600/25"
      : "border-neutral-300 hover:border-neutral-400 focus:border-brand-600 focus:ring-brand-600/20",
    extra,
  );
}

export function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}
