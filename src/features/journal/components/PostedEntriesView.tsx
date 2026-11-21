"use client";

import { CircleCheck, Eye, Info, ListOrdered, Printer, RotateCcw, SearchX, Send } from "lucide-react";
import { useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageCommand } from "@/hooks/usePageCommand";
import { usePermission } from "@/hooks/usePermission";
import { downloadCsv, formatCurrency, formatDate } from "@/lib/utils";
import { errorMessage } from "@/services/api/errors";
import {
  journalApi,
  useGetJournalEntriesQuery,
  useGetJournalEntryQuery,
  usePostJournalEntryMutation,
  useReverseJournalEntryMutation,
} from "@/services/api/endpoints/journalApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import type { SortDirection } from "@/types";
import { entryTotal, type JournalEntry } from "../types";
import { EntryInfoList, EntryLinesTable } from "./EntryDetails";
import { JournalFilterCard } from "./JournalFilterCard";
import { useJournalFilters } from "./useJournalFilters";

const iconBtn = "inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 hover:text-ink-900";
const PAGE_SIZE = 8;
const SORT_FIELD: Record<string, string> = { debit: "transactionNo", credit: "transactionNo" };

export function PostedEntriesView() {
  const dispatch = useAppDispatch();
  const canManage = usePermission("transactions:manage");
  const { draft, setField, apply, clear, params } = useJournalFilters();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({ key: "date", direction: "desc" });
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [printOnLoad, setPrintOnLoad] = useState(false);
  const [reversing, setReversing] = useState<JournalEntry | null>(null);
  const [posting, setPosting] = useState<JournalEntry | null>(null);
  const keyword = useDebounce(search, 300).trim();

  const query = { ...params, kind: "double-entry" as const, search: keyword || undefined, page, perPage: PAGE_SIZE, sort: SORT_FIELD[sort.key] ?? sort.key, order: sort.direction };
  const { data, error, isLoading, isFetching, refetch } = useGetJournalEntriesQuery(query);
  const viewing = useGetJournalEntryQuery(viewingId ?? "", { skip: !viewingId });
  const [reverse, reverseState] = useReverseJournalEntryMutation();
  const [postEntry, postState] = usePostJournalEntryMutation();
  const rows = data?.data ?? [];

  usePageCommand("export", async () => {
    const res = await dispatch(journalApi.endpoints.getJournalEntries.initiate({ ...query, page: 1, perPage: 1000 }, { subscribe: false, forceRefetch: true }));
    if (res.error || !res.data) {
      dispatch(showToast({ variant: "error", title: "Export failed", description: errorMessage(res.error) }));
      return;
    }
    downloadCsv(
      "engas-posted-entries.csv",
      res.data.data.map((e) => ({ "Transaction No.": e.transactionNo, Date: e.date, "Journal Type": e.journalType, Description: e.description, Department: e.department, Debit: entryTotal(e), Credit: entryTotal(e), Status: e.status })),
    );
    dispatch(showToast({ variant: "success", title: "Export ready", description: `${res.data.data.length} entries exported.` }));
  });

  const columns: Column<JournalEntry>[] = [
    { key: "transactionNo", header: "Transaction No.", sortValue: (e) => e.transactionNo, cell: (e) => <span className="font-mono text-[0.72rem] font-semibold whitespace-nowrap">{e.transactionNo}</span> },
    { key: "date", header: "Transaction Date", sortValue: (e) => e.date, cell: (e) => <span className="whitespace-nowrap">{formatDate(e.date)}</span> },
    { key: "journalType", header: "Journal Type", sortValue: (e) => e.journalType, cell: (e) => <span className="whitespace-nowrap">{e.journalType}</span> },
    { key: "description", header: "Description", cell: (e) => <span className="line-clamp-2 max-w-64">{e.description}</span> },
    { key: "department", header: "Department / Cost Center", hideOnMobile: true, sortValue: (e) => e.department },
    { key: "debit", header: "Total Debit (₱)", align: "right", cell: (e) => <span className="tabular-nums">{formatCurrency(entryTotal(e)).replace("₱", "")}</span> },
    { key: "credit", header: "Total Credit (₱)", align: "right", hideOnMobile: true, cell: (e) => <span className="tabular-nums">{formatCurrency(entryTotal(e)).replace("₱", "")}</span> },
    { key: "status", header: "Status", align: "center", sortValue: (e) => e.status, cell: (e) => <StatusBadge status={e.status} /> },
  ];

  const detail = viewing.data;

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
        {error && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : (
          <DataTable
            caption="Posted journal entries"
            data={rows}
            columns={columns}
            getRowId={(e) => e.id}
            loading={isLoading}
            fetching={isFetching}
            pageSize={PAGE_SIZE}
            page={page}
            onPageChange={setPage}
            server={{ total: data?.meta.total ?? 0, sort, onSortChange: (s) => (setSort(s), setPage(1)) }}
            emptyState={<EmptyState icon={SearchX} title="No journal entries found" description="Adjust the date range or filters, then click Search." />}
            rowActions={(e) => (
              <div className="inline-flex gap-1">
                <button type="button" className={iconBtn} onClick={() => setViewingId(e.id)} aria-label={`View ${e.transactionNo}`} title="View">
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => {
                    setViewingId(e.id);
                    setPrintOnLoad(true);
                  }}
                  aria-label={`Print ${e.transactionNo}`}
                  title="Print"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                </button>
                {canManage && e.status === "Draft" && (
                  <button
                    type="button"
                    className={`${iconBtn} border-green-200 text-green-700 hover:bg-green-50`}
                    onClick={() => setPosting(e)}
                    aria-label={`Post ${e.transactionNo}`}
                    title="Post to books"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
                {canManage && e.status !== "Draft" && (
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

      <Modal
        open={Boolean(viewingId)}
        onClose={() => {
          setViewingId(null);
          setPrintOnLoad(false);
        }}
        title={detail ? `Journal Entry ${detail.transactionNo}` : "Journal Entry"}
        icon={<ListOrdered />}
        size="xl"
      >
        {viewing.isFetching && !detail ? (
          <div className="py-10 text-center">
            <LoadingSpinner label="Loading entry…" />
          </div>
        ) : viewing.error ? (
          <ErrorState message={errorMessage(viewing.error)} onRetry={viewing.refetch} />
        ) : detail ? (
          <div
            className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]"
            ref={(el) => {
              if (el && printOnLoad) {
                setPrintOnLoad(false);
                setTimeout(() => window.print(), 200);
              }
            }}
          >
            <EntryInfoList entry={detail} />
            <EntryLinesTable entry={detail} />
          </div>
        ) : null}
      </Modal>

      <ConfirmationDialog
        open={Boolean(reversing)}
        onClose={() => setReversing(null)}
        loading={reverseState.isLoading}
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
          const res = await reverse(reversing);
          dispatch(
            "error" in res && res.error
              ? showToast({ variant: "error", title: "Reversal failed", description: errorMessage(res.error) })
              : showToast({ variant: "success", title: "Entry reversed", description: reversing.transactionNo }),
          );
          setReversing(null);
        }}
      />

      <ConfirmationDialog
        open={Boolean(posting)}
        onClose={() => setPosting(null)}
        loading={postState.isLoading}
        variant="primary"
        title="Post draft entry?"
        confirmLabel="Post Entry"
        description={
          <>
            <b className="font-mono text-ink-900">{posting?.transactionNo}</b> ({posting && formatCurrency(entryTotal(posting))}) will be posted to the books and locked from editing.
          </>
        }
        onConfirm={async () => {
          if (!posting) return;
          const res = await postEntry(posting);
          dispatch(
            "error" in res && res.error
              ? showToast({ variant: "error", title: "Posting failed", description: errorMessage(res.error) })
              : showToast({ variant: "success", title: "Entry posted to the books", description: posting.transactionNo }),
          );
          setPosting(null);
        }}
      />
    </>
  );
}
