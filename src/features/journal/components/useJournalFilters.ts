"use client";

import { useState } from "react";
import type { JournalQuery } from "@/services/api/endpoints/journalApi";

export interface JournalFilters {
  from: string;
  to: string;
  journalType: string;
  department: string;
  status: string;
  keyword: string;
}

export const EMPTY_FILTERS: JournalFilters = { from: "2026-10-01", to: "2026-12-31", journalType: "", department: "", status: "", keyword: "" };

/**
 * Draft/applied filter pair: inputs edit the draft, "Search" applies it (as in the mockups).
 * The applied filters become `GET /journal-entries` query parameters — filtering is server-side.
 */
export function useJournalFilters(initial: Partial<JournalFilters> = {}) {
  const start = { ...EMPTY_FILTERS, ...initial };
  const [draft, setDraft] = useState<JournalFilters>(start);
  const [applied, setApplied] = useState<JournalFilters>(start);

  const params: JournalQuery = {
    dateFrom: applied.from || undefined,
    dateTo: applied.to || undefined,
    journalType: applied.journalType || undefined,
    department: applied.department || undefined,
    status: applied.status || undefined,
    search: applied.keyword || undefined,
  };

  return {
    draft,
    applied,
    params,
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
  };
}
