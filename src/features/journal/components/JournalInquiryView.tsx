"use client";

import { FileText, Layers, ListOrdered, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePageCommand } from "@/hooks/usePageCommand";
import { downloadCsv, formatCurrency, formatDate } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJournalEntries } from "../journalSlice";
import { entryTotal, type JournalEntry } from "../types";
import { EntryInfoList, EntryLinesTable } from "./EntryDetails";
import { JournalFilterCard } from "./JournalFilterCard";
import { useJournalFilters } from "./useJournalFilters";

export function JournalInquiryView() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => s.journal);
  const { draft, setField, apply, clear, filtered } = useJournalFilters(items);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === "idle") void dispatch(fetchJournalEntries());
  }, [status, dispatch]);

  const selected = filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  usePageCommand("export", () =>
    downloadCsv(
      "engas-journal-inquiry.csv",
      filtered.flatMap((e) => e.lines.map((l) => ({ "Transaction No.": e.transactionNo, Date: e.date, "Account Code": l.accountCode, "Account Title": l.accountTitle, Debit: l.debit, Credit: l.credit, Status: e.status }))),
    ),
  );

  const columns: Column<JournalEntry>[] = [
    { key: "transactionNo", header: "Transaction No.", sortValue: (e) => e.transactionNo, cell: (e) => <span className="font-mono text-[0.72rem] font-semibold">{e.transactionNo}</span> },
    { key: "date", header: "Transaction Date", sortValue: (e) => e.date, cell: (e) => <span className="whitespace-nowrap">{formatDate(e.date)}</span> },
    { key: "journalType", header: "Journal Type", sortValue: (e) => e.journalType },
    { key: "description", header: "Description", cell: (e) => <span className="line-clamp-1 max-w-72">{e.description}</span> },
    { key: "department", header: "Department / Cost Center", hideOnMobile: true, sortValue: (e) => e.department },
    { key: "debit", header: "Total Debit (₱)", align: "right", sortValue: (e) => entryTotal(e), cell: (e) => <span className="tabular-nums">{formatCurrency(entryTotal(e)).replace("₱", "")}</span> },
    { key: "status", header: "Status", align: "center", cell: (e) => <StatusBadge status={e.status} /> },
  ];

  return (
    <>
      <JournalFilterCard
        title="Search Criteria"
        withKeyword
        draft={draft}
        setField={setField}
        onSearch={() => {
          apply();
          setPage(1);
          setSelectedId(null);
        }}
        onClear={() => {
          clear();
          setPage(1);
        }}
      />
      <SectionCard title={`Journal Entries (${filtered.length})`} icon={ListOrdered} bodyClassName="p-0">
        <DataTable
          caption="Journal entries — select a row to view its details"
          data={filtered}
          columns={columns}
          getRowId={(e) => e.id}
          loading={status === "loading" || status === "idle"}
          pageSize={6}
          page={page}
          onPageChange={setPage}
          onRowClick={(e) => setSelectedId(e.id)}
          selectedId={selected?.id}
          initialSort={{ key: "date", direction: "desc" }}
          emptyState={<EmptyState icon={SearchX} title="No journal entries match your criteria" />}
        />
      </SectionCard>
      {selected && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
          <SectionCard title="Journal Entry Details" icon={FileText}>
            <EntryInfoList entry={selected} />
          </SectionCard>
          <SectionCard title="Accounting Entries" icon={Layers} bodyClassName="p-0">
            <EntryLinesTable entry={selected} />
          </SectionCard>
        </div>
      )}
    </>
  );
}
