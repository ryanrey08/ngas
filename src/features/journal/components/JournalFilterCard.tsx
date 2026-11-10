"use client";

import { Filter, RotateCcw, Search } from "lucide-react";
import { DatePicker, FormInput, FormSelect } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { DEPARTMENTS, JOURNAL_TYPES } from "../types";
import type { JournalFilters } from "./useJournalFilters";

export function JournalFilterCard({
  title = "Filter Criteria",
  draft,
  setField,
  onSearch,
  onClear,
  withKeyword,
}: {
  title?: string;
  draft: JournalFilters;
  setField: <K extends keyof JournalFilters>(key: K, value: JournalFilters[K]) => void;
  onSearch: () => void;
  onClear: () => void;
  withKeyword?: boolean;
}) {
  return (
    <SectionCard title={title} icon={Filter} bodyClassName="p-3">
      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        {withKeyword && (
          <FormInput
            label="Keyword"
            placeholder="Transaction no., reference or description"
            value={draft.keyword}
            onChange={(e) => setField("keyword", e.target.value)}
            containerClassName="sm:col-span-2 lg:col-span-6"
          />
        )}
        <DatePicker label="Date From" required value={draft.from} onChange={(e) => setField("from", e.target.value)} />
        <DatePicker label="Date To" required value={draft.to} onChange={(e) => setField("to", e.target.value)} />
        <FormSelect label="Journal Type" placeholder="All Journal Types" options={JOURNAL_TYPES} value={draft.journalType} onChange={(e) => setField("journalType", e.target.value)} />
        <FormSelect label="Department / Cost Center" placeholder="All Departments" options={DEPARTMENTS} value={draft.department} onChange={(e) => setField("department", e.target.value)} />
        <FormSelect label="Status" placeholder="All" options={["Posted", "Draft", "Reversed"]} value={draft.status} onChange={(e) => setField("status", e.target.value)} />
        <div className="flex items-end gap-2">
          <Button variant="outline" leftIcon={<RotateCcw />} onClick={onClear}>
            Clear
          </Button>
          <Button type="submit" variant="blue" leftIcon={<Search />}>
            Search
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
