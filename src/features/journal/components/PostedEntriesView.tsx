"use client";

import { CircleCheck, Eye, Info, ListOrdered, Printer, RotateCcw, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePageCommand } from "@/hooks/usePageCommand";
import { usePermission } from "@/hooks/usePermission";
import { downloadCsv, formatCurrency, formatDate } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { fetchJournalEntries, reverseJournalEntry } from "../journalSlice";
import { entryTotal, type JournalEntry } from "../types";
import { EntryInfoList, EntryLinesTable } from "./EntryDetails";
import { JournalFilterCard } from "./JournalFilterCard";
import { useJournalFilters } from "./useJournalFilters";

const iconBtn = "inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 hover:text-ink-900";

export function PostedEntriesView() {
  const dispatch = useAppDispatch();
  const { items, status, error, mutationStatus } = useAppSelector((s) => s.journal);
  const canManage = usePermission("transactions:manage");
  const entries = items.filter((e) => e.kind === "double-entry");
  const { draft, setField, apply, clear, filtered } = useJournalFilters(entries);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<JournalEntry | null>(null);
  const [reversing, setReversing] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (status === "idle") void dispatch(fetchJournalEntries());
  }, [status, dispatch]);

  const q = search.trim().toLowerCase();
  const rows = filtered.filter((e) => !q || [e.transactionNo, e.description, e.referenceNo].some((v) => v.toLowerCase().includes(q)));

  usePageCommand("export", () => {
    downloadCsv(
      "engas-posted-entries.csv",
      rows.map((e) => ({ "Transaction No.": e.transactionNo, Date: e.date, "Journal Type": e.journalType, Description: e.description, Department: e.department, Debit: entryTotal(e), Credit: entryTotal(e), Status: e.status })),
    );
    dispatch(showToast({ variant: "success", title: "Export ready", description: `${rows.length} entries exported.` }));
  });

  const columns: Column<JournalEntry>[] = [
    { key: "transactionNo", header: "Transaction No.", sortValue: (e) => e.transactionNo, cell: (e) => <span className="font-mono text-[0.72rem] font-semibold whitespace-nowrap">{e.transactionNo}</span> },
    { key: "date", header: "Transaction Date", sortValue: (e) => e.date, cell: (e) => <span className="whitespace-nowrap">{formatDate(e.date)}</span> },
    { key: "journalType", header: "Journal Type", sortValue: (e) => e.journalType, cell: (e) => <span className="whitespace-nowrap">{e.journalType}</span> },
    { key: "description", header: "Description", cell: (e) => <span className="line-clamp-2 max-w-64">{e.description}</span> },
    { key: "department", header: "Department / Cost Center", hideOnMobile: true, sortValue: (e) => e.department },
    { key: "debit", header: "Total Debit (₱)", align: "right", sortValue: (e) => entryTotal(e), cell: (e) => <span className="tabular-nums">{formatCurrency(entryTotal(e)).replace("₱", "")}</span> },
    { key: "credit", header: "Total Credit (₱)", align: "right", hideOnMobile: true, sortValue: (e) => entryTotal(e), cell: (e) => <span className="tabular-nums">{formatCurrency(entryTotal(e)).replace("₱", "")}</span> },
    { key: "status", header: "Status", align: "center", sortValue: (e) => e.status, cell: (e) => <StatusBadge status={e.status} /> },
  ];

  return (
    <>
      <JournalFilterCard
        draft={draft}
        setField={setField}
        onSearch={() => {
          apply();
          setPage(1);
        }}
        onClear={() => {
          clear();
          setPage(1);
        }}
      />

      <SectionCard
        title="Posted Journal Entries"
        icon={ListOrdered}
        bodyClassName="p-0"
        actions={
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            label="Search posted entries"
            placeholder="Search by Transaction No., Description or Reference…"
            className="w-full sm:w-80"
          />
        }
      >
        {status === "failed" ? (
          <ErrorState message={error} onRetry={() => dispatch(fetchJournalEntries())} />
        ) : (
          <DataTable
            caption="Posted journal entries"
            data={rows}
            columns={columns}
            getRowId={(e) => e.id}
            loading={status === "loading" || status === "idle"}
            pageSize={8}
            page={page}
            onPageChange={setPage}
            initialSort={{ key: "date", direction: "desc" }}
            emptyState={<EmptyState icon={SearchX} title="No journal entries found" description="Adjust the date range or filters, then click Search." />}
            rowActions={(e) => (
              <div className="inline-flex gap-1">
                <button type="button" className={iconBtn} onClick={() => setViewing(e)} aria-label={`View ${e.transactionNo}`} title="View">
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => {
                    setViewing(e);
                    setTimeout(() => window.print(), 300);
                  }}
                  aria-label={`Print ${e.transactionNo}`}
                  title="Print"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                </button>
                {canManage && (
                  <button
                    type="button"
                    className={`${iconBtn} border-brand-200 text-brand-600 hover:bg-brand-50 disabled:opacity-40`}
                    onClick={() => setReversing(e)}
                    disabled={e.status !== "Posted"}
                    aria-label={`Reverse ${e.transactionNo}`}
                    title="Reverse"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </div>
            )}
          />
        )}
      </SectionCard>

      <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" aria-hidden /> <b className="text-ink-900">Note:</b> Posted entries are locked from editing and are already reflected in the General Ledger.
        </p>
        <p className="flex flex-wrap gap-4">
          <span className="flex items-center gap-1"><CircleCheck className="h-3.5 w-3.5 text-green-600" aria-hidden /> <b>Posted</b> – Accounted and reflected in the books</span>
          <span className="flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5 text-brand-600" aria-hidden /> <b>Reversed</b> – Entry has been reversed with a contra entry</span>
        </p>
      </div>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? `Journal Entry ${viewing.transactionNo}` : ""} icon={<ListOrdered />} size="xl">
        {viewing && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <EntryInfoList entry={viewing} />
            <EntryLinesTable entry={viewing} />
          </div>
        )}
      </Modal>

      <ConfirmationDialog
        open={Boolean(reversing)}
        onClose={() => setReversing(null)}
        loading={mutationStatus === "loading"}
        title="Reverse journal entry?"
        confirmLabel="Reverse Entry"
        description={
          <>
            A contra entry will be created for <b className="font-mono text-ink-900">{reversing?.transactionNo}</b> ({reversing && formatCurrency(entryTotal(reversing))}) and the
            original will be marked <b>Reversed</b>. This cannot be undone.
          </>
        }
        onConfirm={async () => {
          if (!reversing) return;
          const res = await dispatch(reverseJournalEntry(reversing.id));
          dispatch(
            reverseJournalEntry.fulfilled.match(res)
              ? showToast({ variant: "success", title: "Entry reversed", description: reversing.transactionNo })
              : showToast({ variant: "error", title: "Reversal failed", description: res.payload?.message }),
          );
          setReversing(null);
        }}
      />
    </>
  );
}
