"use client";

import { Eye, Filter, MoreVertical, RotateCcw, SearchX } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { FormSelect } from "@/components/forms/FormSelect";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageCommand } from "@/hooks/usePageCommand";
import { cn, downloadCsv, formatCurrency } from "@/lib/utils";
import { moduleService } from "@/services/moduleService";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { LIST_CONFIGS } from "../listConfigs";
import type { Row } from "../types";
import { plainCell, renderCell } from "./cells";

const iconBtn = "inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-ink-900";

/**
 * Config-driven list screen used by most module tabs: optional stat tiles, a filter card,
 * a sortable / paginated table with totals, a details dialog and CSV export.
 */
export function RecordListView({ listKey, aside }: { listKey: string; aside?: ReactNode }) {
  const config = LIST_CONFIGS[listKey];
  const dispatch = useAppDispatch();
  const fetcher = useCallback(() => moduleService.getList(listKey), [listKey]);
  const { data, loading, error, reload } = useAsyncData(fetcher);
  const rows = useMemo(() => data ?? [], [data]);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Row | null>(null);
  const q = useDebounce(query).trim().toLowerCase();

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          Object.entries(filters).every(([k, v]) => !v || String(r[k]) === v) &&
          (!q || config.searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q))),
      ),
    [rows, filters, q, config.searchKeys],
  );

  usePageCommand("export", () => {
    if (filtered.length === 0) {
      dispatch(showToast({ variant: "info", title: "Nothing to export" }));
      return;
    }
    downloadCsv(
      `engas-${listKey.replace("/", "-")}.csv`,
      filtered.map((r) => Object.fromEntries(config.columns.map((c) => [c.header, plainCell(c.kind, r[c.key])]))),
    );
    dispatch(showToast({ variant: "success", title: "Export ready", description: `${filtered.length} records exported to CSV (Excel).` }));
  });

  const columns: Column<Row>[] = config.columns.map((c) => ({
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
        <td
          key={c.key}
          className={cn("px-3 py-2 text-xs text-ink-900 tabular-nums", c.align === "right" && "text-right", c.hideOnMobile && "hidden md:table-cell")}
        >
          {config.totals!.includes(c.key)
            ? formatCurrency(filtered.reduce((s, r) => s + Number(r[c.key] ?? 0), 0))
            : i === 0
              ? "Total"
              : ""}
        </td>
      ))}
      <td />
    </tr>
  ) : undefined;

  const filterOptions = (key: string) =>
    Array.from(new Set(rows.map((r) => String(r[key])))).sort().map((v) => ({ label: v, value: v }));

  const activeFilters = Boolean(query) || Object.values(filters).some(Boolean);

  if (error) {
    return (
      <SectionCard title={config.title} icon={config.icon}>
        <ErrorState message={error} onRetry={reload} />
      </SectionCard>
    );
  }

  const main = (
    <div className="min-w-0 space-y-4">
      {config.tiles && (
        <section aria-label="Summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {config.tiles.map((t) => (
            <StatTile key={t.label} label={t.label} icon={t.icon} tone={t.tone} value={loading ? "…" : t.value(rows)} />
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
              options={filterOptions(f.key)}
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
        actions={<span className="text-xs text-neutral-600">Total Records: <span className="font-bold text-ink-900">{loading ? "…" : filtered.length}</span></span>}
      >
        <DataTable
          caption={config.title}
          data={filtered}
          columns={columns}
          getRowId={(r) => JSON.stringify(Object.values(r).slice(0, 3))}
          loading={loading}
          pageSize={config.pageSize ?? 8}
          page={page}
          onPageChange={setPage}
          footer={totalsRow}
          emptyState={<EmptyState icon={SearchX} title="No matching records" description="Try a different keyword or filter." />}
          rowActions={(r) => (
            <div className="inline-flex gap-1">
              <button type="button" className={iconBtn} onClick={() => setViewing(r)} aria-label="View details" title="View">
                <Eye className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                className={iconBtn}
                aria-label="More actions"
                title="More"
                onClick={() => dispatch(showToast({ variant: "info", title: "More actions", description: "Available once connected to the backend." }))}
              >
                <MoreVertical className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )}
        />
      </SectionCard>
    </div>
  );

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
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={`${config.title} – Details`} icon={<config.icon />} size="md">
        {viewing && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-[minmax(0,180px)_1fr]">
            {config.columns.map((c) => (
              <div key={c.key} className="contents">
                <dt className="font-semibold text-neutral-600">{c.header}</dt>
                <dd className="text-ink-900">{renderCell(c.kind, viewing[c.key])}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </>
  );
}
