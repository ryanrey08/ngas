"use client";

import { cn } from "@/lib/utils";

function pageList(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | "…"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn =
    "inline-flex h-7 min-w-7 items-center justify-center rounded border px-2 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-2 px-3 py-2.5 sm:flex-row" data-print-hide>
      <p className="text-xs text-neutral-600">
        Showing {from} to {to} of {total} entries
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className={cn(btn, "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50")} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          « Prev
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-xs text-neutral-400" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={cn(btn, p === page ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-200 bg-white text-ink-800 hover:bg-neutral-50")}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className={cn(btn, "border-neutral-200 bg-white text-ink-800 hover:bg-neutral-50")} onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          Next »
        </button>
      </div>
    </nav>
  );
}
