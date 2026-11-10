"use client";

import { useMemo, useState } from "react";
import type { JournalEntry } from "../types";

export interface JournalFilters {
  from: string;
  to: string;
  journalType: string;
  department: string;
  status: string;
  keyword: string;
}

export const EMPTY_FILTERS: JournalFilters = { from: "2026-10-01", to: "2026-12-31", journalType: "", department: "", status: "", keyword: "" };

/** Draft/applied filter pair: inputs edit the draft, "Search" applies it (as in the mockups). */
export function useJournalFilters(entries: JournalEntry[], initial: Partial<JournalFilters> = {}) {
  const start = { ...EMPTY_FILTERS, ...initial };
  const [draft, setDraft] = useState<JournalFilters>(start);
  const [applied, setApplied] = useState<JournalFilters>(start);

  const filtered = useMemo(() => {
    const k = applied.keyword.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (!applied.from || e.date >= applied.from) &&
        (!applied.to || e.date <= applied.to) &&
        (!applied.journalType || e.journalType === applied.journalType) &&
        (!applied.department || e.department === applied.department) &&
        (!applied.status || e.status === applied.status) &&
        (!k || [e.transactionNo, e.referenceNo, e.description].some((v) => v.toLowerCase().includes(k))),
    );
  }, [entries, applied]);

  return {
    draft,
    setField: <K extends keyof JournalFilters>(key: K, value: JournalFilters[K]) => setDraft((d) => ({ ...d, [key]: value })),
    apply: (patch?: Partial<JournalFilters>) => {
      const next = { ...draft, ...patch };
      setDraft(next);
      setApplied(next);
    },
    clear: () => {
      const reset = { ...EMPTY_FILTERS, ...initial };
      setDraft(reset);
      setApplied(reset);
    },
    filtered,
  };
}
