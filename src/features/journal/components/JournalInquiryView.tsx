"use client";

import { FileText, Layers, ListOrdered, SearchX } from "lucide-react";
import { useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePageCommand } from "@/hooks/usePageCommand";
import { downloadCsv, formatCurrency, formatDate } from "@/lib/utils";
import { errorMessage } from "@/services/api/errors";
import { journalApi, useGetJournalEntriesQuery, useGetJournalEntryQuery } from "@/services/api/endpoints/journalApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import type { SortDirection } from "@/types";
import { entryTotal, type JournalEntry } from "../types";
import { EntryInfoList, EntryLinesTable } from "./EntryDetails";
import { JournalFilterCard } from "./JournalFilterCard";
import { useJournalFilters } from "./useJournalFilters";

export function JournalInquiryView() {
  const dispatch = useAppDispatch();
  const { draft, setField, apply, clear, params } = useJournalFilters();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({ key: "date", direction: "desc" });

  const query = { ...params, page, perPage: 6, sort: sort.key === "debit" ? "transactionNo" : sort.key, order: sort.direction };
  const { data, error, isLoading, isFetching, refetch } = useGetJournalEntriesQuery(query);
  const rows = data?.data ?? [];
  const activeId = selectedId ?? rows[0]?.id ?? null;
  // The details panels read the record by id (GET /journal-entries/{id}).
  const detail = useGetJournalEntryQuery(activeId ?? "", { skip: !activeId });
  const selected = detail.data ?? rows.find((e) => e.id === activeId) ?? null;

  usePageCommand("export", async () => {
    const res = await dispatch(journalApi.endpoints.getJournalEntries.initiate({ ...query, page: 1, perPage: 1000 }, { subscribe: false, forceRefetch: true }));
    if (res.error || !res.data) {
      dispatch(showToast({ variant: "error", title: "Export failed", description: errorMessage(res.error) }));
      return;
    }
    downloadCsv(
      "engas-journal-inquiry.csv",
      res.data.data.flatMap((e) => e.lines.map((l) => ({ "Transaction No.": e.transactionNo, Date: e.date, "Account Code": l.accountCode, "Account Title": l.accountTitle, Debit: l.debit, Credit: l.credit, Status: e.status }))),
    );
  });

  const columns: Column<JournalEntry>[] = [
    { key: "transactionNo", header: "Transaction No.", sortValue: (e) => e.transactionNo, cell: (e) => <span className="font-mono text-[0.72rem] font-semibold">{e.transactionNo}</span> },
    { key: "date", header: "Transaction Date", sortValue: (e) => e.date, cell: (e) => <span className="whitespace-nowrap">{formatDate(e.date)}</span> },
    { key: "journalType", header: "Journal Type", sortValue: (e) => e.journalType },
    { key: "description", header: "Description", cell: (e) => <span className="line-clamp-1 max-w-72">{e.description}</span> },
    { key: "department", header: "Department / Cost Center", hideOnMobile: true, sortValue: (e) => e.department },
    { key: "debit", header: "Total Debit (₱)", align: "right", cell: (e) => <span className="tabular-nums">{formatCurrency(entryTotal(e)).replace("₱", "")}</span> },
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
      <SectionCard title={`Journal Entries (${data?.meta.total ?? 0})`} icon={ListOrdered} bodyClassName="p-0">
        {error && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : (
          <DataTable
            caption="Journal entries — select a row to view its details"
            data={rows}
            columns={columns}
            getRowId={(e) => e.id}
            loading={isLoading}
            fetching={isFetching}
            pageSize={6}
            page={page}
            onPageChange={(p) => {
              setPage(p);
              setSelectedId(null);
            }}
            onRowClick={(e) => setSelectedId(e.id)}
            selectedId={activeId}
            server={{ total: data?.meta.total ?? 0, sort, onSortChange: (s) => (setSort(s), setPage(1)) }}
            emptyState={<EmptyState icon={SearchX} title="No journal entries match your criteria" />}
          />
        )}
      </SectionCard>
      {detail.isFetching && !detail.data && activeId && (
        <div className="py-6 text-center">
          <LoadingSpinner label="Loading entry details…" />
        </div>
      )}
      {detail.error && <ErrorState message={errorMessage(detail.error)} onRetry={detail.refetch} />}
      {selected && !detail.error && (
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
