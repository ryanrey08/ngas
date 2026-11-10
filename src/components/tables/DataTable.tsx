"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/types";
import { Pagination } from "./Pagination";

export interface Column<T> {
  key: string;
  header: string;
  /** Render a cell. Defaults to `String(row[key])`. */
  cell?: (row: T) => ReactNode;
  /** Value used for sorting. Providing it makes the column sortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
  /** Hide on small screens */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  caption: string;
  loading?: boolean;
  pageSize?: number;
  /** Controlled page (optional). */
  page?: number;
  onPageChange?: (page: number) => void;
  initialSort?: { key: string; direction: SortDirection };
  rowActions?: (row: T) => ReactNode;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  selectedId?: string | null;
  /** Rendered as a final summary row (e.g. totals). */
  footer?: ReactNode;
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function DataTable<T>({
  data,
  columns,
  getRowId,
  caption,
  loading,
  pageSize,
  page: controlledPage,
  onPageChange,
  initialSort,
  rowActions,
  emptyState,
  onRowClick,
  selectedId,
  footer,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [internalPage, setInternalPage] = useState(1);
  const page = controlledPage ?? internalPage;
  const setPage = onPageChange ?? setInternalPage;

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    const get = col.sortValue;
    return [...data].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [data, columns, sort]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const visible = pageSize ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize) : sorted;

  const toggleSort = (key: string) => {
    setSort((prev) =>
      prev?.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
    );
    setPage(1);
  };

  const colCount = columns.length + (rowActions ? 1 : 0);

  return (
    <div>
      <div className="scrollbar-thin relative overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-navy-900">
              {columns.map((col) => {
                const active = sort?.key === col.key;
                const ariaSort = active ? (sort.direction === "asc" ? "ascending" : "descending") : "none";
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={col.sortValue ? ariaSort : undefined}
                    className={cn(
                      "px-3 py-2.5 text-[0.72rem] font-semibold whitespace-nowrap text-white",
                      alignClass[col.align ?? "left"],
                      col.hideOnMobile && "hidden md:table-cell",
                      col.className,
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-brand-200",
                          active && "text-white",
                          col.align === "right" && "flex-row-reverse",
                        )}
                      >
                        {col.header}
                        {active ? (
                          sort.direction === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {rowActions && (
                <th scope="col" className="px-3 py-2.5 text-center text-[0.72rem] font-semibold text-white">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="py-16 text-center">
                  <LoadingSpinner size="lg" label="Loading records…" />
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={colCount}>{emptyState ?? <EmptyState title="No records found" />}</td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={getRowId(row)} className={cn("border-b border-neutral-100 transition-colors last:border-0 hover:bg-brand-50/40", selectedId && getRowId(row) === selectedId && "bg-brand-50/70", onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-3 py-2 align-middle text-xs text-ink-800",
                        alignClass[col.align ?? "left"],
                        col.hideOnMobile && "hidden md:table-cell",
                        col.className,
                      )}
                    >
                      {col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-3 py-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {footer && !loading && visible.length > 0 && <tfoot>{footer}</tfoot>}
        </table>
      </div>
      {pageSize && !loading && sorted.length > 0 && (
        <div className="border-t border-neutral-100">
          <Pagination page={safePage} pageSize={pageSize} total={sorted.length} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
