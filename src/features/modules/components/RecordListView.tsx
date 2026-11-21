"use client";

import { Eye, Filter, History, RotateCcw, SearchX } from "lucide-react";
import { useState, type ReactNode } from "react";
import { FormSelect } from "@/components/forms/FormSelect";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageCommand } from "@/hooks/usePageCommand";
import { usePermission } from "@/hooks/usePermission";
import { cn, downloadCsv, formatCurrency, formatDate } from "@/lib/utils";
import { errorMessage } from "@/services/api/errors";
import {
  useDeleteRecordMutation,
  useGenerateAutoJournalMutation,
  useGetRecordQuery,
  useGetRecordSummaryQuery,
  useGetRecordsQuery,
  useLazyExportRecordsQuery,
  useTransitionRecordMutation,
  type RecordRow,
} from "@/services/api/endpoints/recordsApi";
import type { SortDirection } from "@/types";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { LIST_CONFIGS } from "../listConfigs";
import { RECORD_FORMS } from "../recordForms";
import { RECORD_WORKFLOWS, actionsFor, type RecordAction } from "../recordWorkflows";
import { ActionConfirmDialog } from "./ActionConfirmDialog";
import { plainCell, renderCell } from "./cells";
import { RecordActionsMenu } from "./RecordActionsMenu";
import { RecordFormModal } from "./RecordFormModal";

const iconBtn = "inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-ink-900";

const labelOf = (r: RecordRow) => String(r.no ?? r.code ?? r.name ?? r.account ?? r.customer ?? r.supplier ?? r.fund ?? r.id);

/**
 * Config-driven list screen used by most module tabs. Data comes from `GET /<module>/<tab>` with
 * server-side search, filters, sorting and pagination; tiles from `/summary`; the details dialog
 * from `/<id>`; row actions are workflow transitions; Export pulls every filtered row.
 */
export function RecordListView({ listKey, aside }: { listKey: string; aside?: ReactNode }) {
  const config = LIST_CONFIGS[listKey];
  const form = RECORD_FORMS[listKey];
  const dispatch = useAppDispatch();
  const canManage = usePermission("transactions:manage");
  const perPage = config.pageSize ?? 8;

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ row: RecordRow; action: RecordAction } | null>(null);
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const search = useDebounce(query, 300).trim();

  const params = {
    resource: listKey,
    page,
    perPage,
    search,
    sort: sort?.key,
    order: sort?.direction,
    filters,
    facets: config.filters?.map((f) => f.key),
  };
  const { data, error, isLoading, isFetching, refetch } = useGetRecordsQuery(params);
  const summary = useGetRecordSummaryQuery(listKey, { skip: !config.tiles });
  const [exportRows, exportState] = useLazyExportRecordsQuery();
  const [transition, transitionState] = useTransitionRecordMutation();
  const [remove, removeState] = useDeleteRecordMutation();
  const [generate, generateState] = useGenerateAutoJournalMutation({ fixedCacheKey: "auto-journal-generate" });
  const viewing = useGetRecordQuery({ resource: listKey, id: viewingId ?? "" }, { skip: !viewingId });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totals = data?.meta.totals ?? {};
  const facets = data?.meta.facets ?? {};
  // Read-only registers (ledgers, aging, cash position…) have no row actions, so no "More" button.
  const showMore = canManage && (Boolean(form) || listKey in RECORD_WORKFLOWS);

  usePageCommand("export", async () => {
    const result = await exportRows(params);
    if (result.error) {
      dispatch(showToast({ variant: "error", title: "Export failed", description: errorMessage(result.error) }));
      return;
    }
    const all = result.data ?? [];
    if (all.length === 0) {
      dispatch(showToast({ variant: "info", title: "Nothing to export" }));
      return;
    }
    downloadCsv(
      `engas-${listKey.replace("/", "-")}.csv`,
      all.map((r) => Object.fromEntries(config.columns.map((c) => [c.header, plainCell(c.kind, r[c.key])]))),
    );
    dispatch(showToast({ variant: "success", title: "Export ready", description: `${all.length} records exported to CSV (Excel).` }));
  });

  usePageCommand("new", () => {
    if (!form) return;
    setEditing(null);
    setFormOpen(true);
  });

  usePageCommand("generate", () => {
    if (listKey === "double-entry/auto-journal") setConfirmGenerate(true);
  });

  const runAction = async (row: RecordRow, action: RecordAction, remarks?: string) => {
    const label = labelOf(row);
    const result =
      action.key === "delete"
        ? await remove({ resource: listKey, id: row.id })
        : await transition({ resource: listKey, id: row.id, action: action.key, to: action.to, remarks });
    if ("error" in result && result.error) {
      dispatch(showToast({ variant: "error", title: `${action.label} failed`, description: errorMessage(result.error) }));
      return false;
    }
    dispatch(showToast({ variant: "success", title: action.key === "delete" ? "Record deleted" : `${action.label} – done`, description: action.key === "delete" ? label : `${label} is now ${action.to}.` }));
    return true;
  };

  const columns: Column<RecordRow>[] = config.columns.map((c) => ({
    key: c.key,
    header: c.header,
    align: c.align,
    hideOnMobile: c.hideOnMobile,
    sortValue: (r) => r[c.key] ?? "",
    cell: (r) => renderCell(c.kind, r[c.key]),
  }));

  const totalsRow = config.totals?.length ? (
    <tr className="bg-blue-50 font-semibold">
      {config.columns.map((c, i) => (
        <td key={c.key} className={cn("px-3 py-2 text-xs text-ink-900 tabular-nums", c.align === "right" && "text-right", c.hideOnMobile && "hidden md:table-cell")}>
          {config.totals!.includes(c.key) ? formatCurrency(totals[c.key] ?? 0) : i === 0 ? "Total" : ""}
        </td>
      ))}
      <td />
    </tr>
  ) : undefined;

  const activeFilters = Boolean(query) || Object.values(filters).some(Boolean);

  if (error && !data) {
    return (
      <SectionCard title={config.title} icon={config.icon}>
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      </SectionCard>
    );
  }

  const tileValue = (metric: string, format?: "currency" | "count") => {
    if (summary.isLoading) return "…";
    if (summary.isError) return "—";
    const v = summary.data?.[metric] ?? 0;
    return format === "count" ? v.toLocaleString("en-PH") : formatCurrency(v);
  };

  const main = (
    <div className="min-w-0 space-y-4">
      {config.tiles && (
        <section aria-label="Summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {config.tiles.map((t) => (
            <StatTile key={t.label} label={t.label} icon={t.icon} tone={t.tone} value={tileValue(t.metric, t.format)} />
          ))}
        </section>
      )}

      <SectionCard title="Search / Filter" icon={Filter} bodyClassName="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <p className="mb-1.5 text-xs font-semibold text-ink-800">Keyword</p>
            <SearchInput
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              label={`Search ${config.title}`}
              placeholder="Search by number, name, or description…"
            />
          </div>
          {config.filters?.map((f) => (
            <FormSelect
              key={f.key}
              label={f.label}
              placeholder="All"
              options={(facets[f.key] ?? (filters[f.key] ? [filters[f.key]] : [])).map((v) => ({ label: v, value: v }))}
              value={filters[f.key] ?? ""}
              onChange={(e) => {
                setFilters((s) => ({ ...s, [f.key]: e.target.value }));
                setPage(1);
              }}
              containerClassName="lg:w-48"
            />
          ))}
          <Button
            variant="outline"
            leftIcon={<RotateCcw />}
            disabled={!activeFilters}
            onClick={() => {
              setQuery("");
              setFilters({});
              setPage(1);
            }}
          >
            Reset
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title={config.title}
        icon={config.icon}
        bodyClassName="p-0"
        actions={
          <span className="text-xs text-neutral-600">
            Total Records: <span className="font-bold text-ink-900">{isLoading ? "…" : total}</span>
          </span>
        }
      >
        {error && <p role="alert" className="border-b border-brand-100 bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-800">{errorMessage(error)} <button type="button" className="underline" onClick={refetch}>Retry</button></p>}
        <DataTable
          caption={config.title}
          data={rows}
          columns={columns}
          getRowId={(r) => r.id}
          loading={isLoading}
          fetching={isFetching}
          pageSize={perPage}
          page={page}
          onPageChange={setPage}
          server={{
            total,
            sort,
            onSortChange: (s) => {
              setSort(s);
              setPage(1);
            },
          }}
          footer={totalsRow}
          emptyState={
            activeFilters ? (
              <EmptyState icon={SearchX} title="No matching records" description="Try a different keyword or filter." />
            ) : (
              <EmptyState title="No records yet" description={form ? `Use “New” to add the first ${form.title.toLowerCase()}.` : "Records will appear here once they are recorded."} />
            )
          }
          rowActions={(r) => (
            <div className="inline-flex gap-1">
              <button type="button" className={iconBtn} onClick={() => setViewingId(r.id)} aria-label={`View details of ${labelOf(r)}`} title="View">
                <Eye className="h-3.5 w-3.5" aria-hidden />
              </button>
              {showMore && (
                <RecordActionsMenu
                  label={labelOf(r)}
                  actions={actionsFor(listKey, r.status === undefined ? undefined : String(r.status))}
                  canEdit={Boolean(form)}
                  busy={(transitionState.isLoading && transitionState.originalArgs?.id === r.id) || (removeState.isLoading && removeState.originalArgs?.id === r.id)}
                  onEdit={() => {
                    setEditing(r);
                    setFormOpen(true);
                  }}
                  onAction={(action) => (action.confirm ? setPending({ row: r, action }) : void runAction(r, action))}
                />
              )}
            </div>
          )}
        />
      </SectionCard>
    </div>
  );

  const detail = viewing.data;
  return (
    <>
      {aside ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
          {aside}
          {main}
        </div>
      ) : (
        main
      )}

      <Modal open={Boolean(viewingId)} onClose={() => setViewingId(null)} title={`${config.title} – Details`} icon={<config.icon />} size="md">
        {viewing.isLoading || (viewing.isFetching && !detail) ? (
          <div className="py-10 text-center">
            <LoadingSpinner label="Loading record…" />
          </div>
        ) : viewing.error ? (
          <ErrorState title={viewing.error && "status" in viewing.error && viewing.error.status === 404 ? "Record not found" : undefined} message={errorMessage(viewing.error)} onRetry={viewing.refetch} />
        ) : detail ? (
          <div className="space-y-5">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-[minmax(0,180px)_1fr]">
              {config.columns.map((c) => (
                <div key={c.key} className="contents">
                  <dt className="font-semibold text-neutral-600">{c.header}</dt>
                  <dd className="text-ink-900">{renderCell(c.kind, detail.data[c.key])}</dd>
                </div>
              ))}
            </dl>
            {detail.history.length > 0 && (
              <section aria-label="Status history">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold text-ink-900">
                  <History className="h-4 w-4 text-brand-600" aria-hidden /> Status History
                </p>
                <ol className="space-y-2 border-l-2 border-neutral-200 pl-3 text-xs">
                  {detail.history.map((h, i) => (
                    <li key={i}>
                      <span className="font-semibold text-ink-900">{h.action}</span>
                      {h.from && h.from !== h.to ? <> · {h.from} → </> : " · "}
                      <StatusBadge status={h.to} /> <span className="text-neutral-500">by {h.by}, {formatDate(h.at, { month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                      {h.remarks && <p className="text-neutral-600">“{h.remarks}”</p>}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        ) : null}
      </Modal>

      <ActionConfirmDialog
        action={pending?.action ?? null}
        recordLabel={pending ? labelOf(pending.row) : ""}
        loading={transitionState.isLoading || removeState.isLoading}
        onClose={() => setPending(null)}
        onConfirm={async (remarks) => {
          if (!pending) return;
          if (await runAction(pending.row, pending.action, remarks)) setPending(null);
        }}
      />

      {form && <RecordFormModal resource={listKey} open={formOpen} editing={editing} onClose={() => setFormOpen(false)} />}

      <ConfirmationDialog
        open={confirmGenerate}
        onClose={() => setConfirmGenerate(false)}
        loading={generateState.isLoading}
        variant="primary"
        title="Generate journal entries?"
        confirmLabel="Generate Entries"
        description="Draft General Journal entries will be created from every active auto journal rule. Review and post them from Posted Entries / Journal Inquiry."
        onConfirm={async () => {
          const res = await generate();
          setConfirmGenerate(false);
          dispatch(
            "error" in res && res.error
              ? showToast({ variant: "error", title: "Generation failed", description: errorMessage(res.error) })
              : showToast({ variant: "success", title: `${res.data?.generated ?? 0} draft entries generated`, description: res.data?.entries.map((e) => e.transactionNo).join(", ") }),
          );
        }}
      />
      {exportState.isFetching && <span className="sr-only" role="status">Preparing export…</span>}
    </>
  );
}
