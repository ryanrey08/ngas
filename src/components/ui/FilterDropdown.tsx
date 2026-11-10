"use client";

import { Check, ChevronDown, Filter } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  allLabel = "All",
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const all: FilterOption[] = [{ label: allLabel, value: "" }, ...options];
  const current = all.find((o) => o.value === value) ?? all[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-sm sm:w-auto",
          value ? "border-brand-600 text-brand-700" : "border-neutral-300 text-ink-900 hover:border-neutral-400",
        )}
      >
        <span className="inline-flex items-center gap-2">
          <Filter className="h-4 w-4" aria-hidden />
          <span className="text-neutral-500">{label}:</span>
          <span className="font-semibold">{current.label}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-30 mt-1 w-full min-w-48 animate-scale-in overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-pop sm:w-auto"
        >
          {all.map((opt) => {
            const selected = opt.value === value;
            return (
              <li key={opt.value || "__all"} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-neutral-50",
                    selected && "font-semibold text-brand-700",
                  )}
                >
                  {opt.label}
                  {selected && <Check className="h-4 w-4" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
