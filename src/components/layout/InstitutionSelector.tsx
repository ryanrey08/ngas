"use client";

import { Check, ChevronDown, Landmark } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useCurrentInstitution } from "@/hooks/useCurrentInstitution";
import { useGetInstitutionsQuery } from "@/services/api/endpoints/settingsApi";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { setInstitution, showToast } from "@/store/slices/uiSlice";

export function InstitutionSelector() {
  const dispatch = useAppDispatch();
  const current = useCurrentInstitution();
  const { data: institutions = [], isLoading, isError, refetch } = useGetInstitutionsQuery();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Institution: ${current.name}`}
        className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-ink-900 hover:bg-neutral-100"
      >
        <Landmark className="h-5 w-5 text-ink-800" aria-hidden />
        <span className="hidden max-w-56 truncate md:inline">{current.name}</span>
        <span className="md:hidden">{current.shortName}</span>
        <ChevronDown className={cn("h-4 w-4 text-neutral-500 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul role="listbox" aria-label="Select institution" className="absolute right-0 z-40 mt-1 w-72 animate-scale-in rounded-xl border border-neutral-200 bg-white p-1 shadow-pop">
          {isLoading && <li className="px-3 py-2 text-sm text-neutral-500">Loading institutions…</li>}
          {isError && (
            <li className="px-3 py-2 text-sm text-neutral-500">
              Couldn&apos;t load institutions.{" "}
              <button type="button" className="font-semibold text-brand-700 underline" onClick={() => void refetch()}>
                Retry
              </button>
            </li>
          )}
          {institutions.map((i) => {
            const selected = i.id === current.id;
            return (
              <li key={i.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(setInstitution(i.id));
                    setOpen(false);
                    if (!selected) dispatch(showToast({ variant: "info", title: "Institution switched", description: i.name }));
                  }}
                  className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50", selected && "font-semibold text-brand-700")}
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 text-[0.6rem] font-bold text-white">{i.shortName}</span>
                    {i.name}
                  </span>
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
