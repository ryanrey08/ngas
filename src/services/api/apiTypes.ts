/**
 * Shared request/response shapes for every RTK Query endpoint.
 *
 * The envelopes follow the conventions the eNGAS Laravel backend already uses
 * (`JsonResource` → `{ data }`, `paginate()` → `{ data, links, meta }`), so mock and real
 * responses are interchangeable. See docs/API_INTEGRATION.md → "Expected backend contracts".
 */
import type { ApiError } from "@/types";

export type { ApiError };

export type SortOrder = "asc" | "desc";

/** Laravel paginator `meta`, plus two optional extensions used by the module list screens. */
export interface PageMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  /** Sums of numeric columns over the whole filtered result (not just this page). */
  totals?: Record<string, number>;
  /** Distinct values of the requested facet columns (drives the filter dropdowns). */
  facets?: Record<string, string[]>;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

/** `{ data: T }`, the Laravel JsonResource envelope. */
export interface Envelope<T> {
  data: T;
}

/** Typed, reusable list parameters. Every key is optional; empty values are not sent. */
export interface ListParams {
  page?: number;
  perPage?: number;
  search?: string;
  sort?: string;
  order?: SortOrder;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Module-specific column filters, sent as `filter[key]=value`. */
  filters?: Record<string, string | undefined>;
  /** Columns whose distinct values should be returned in `meta.facets`. */
  facets?: string[];
}

/**
 * Serialises {@link ListParams} into the query-string convention of the expected contracts:
 * `page`, `per_page`, `search`, `sort=-field` (minus = descending), `filter[status]`,
 * `filter[date_from]`, `filter[date_to]`, `filter[<key>]`, `facets=a,b`.
 */
export function toQueryParams(p: ListParams = {}): Record<string, string> {
  const q: Record<string, string> = {};
  if (p.page) q.page = String(p.page);
  if (p.perPage) q.per_page = String(p.perPage);
  if (p.search?.trim()) q.search = p.search.trim();
  if (p.sort) q.sort = `${p.order === "desc" ? "-" : ""}${p.sort}`;
  if (p.status) q["filter[status]"] = p.status;
  if (p.dateFrom) q["filter[date_from]"] = p.dateFrom;
  if (p.dateTo) q["filter[date_to]"] = p.dateTo;
  for (const [k, v] of Object.entries(p.filters ?? {})) if (v) q[`filter[${k}]`] = v;
  if (p.facets?.length) q.facets = p.facets.join(",");
  return q;
}

/** Inverse of {@link toQueryParams}, used by the mock server. */
export function fromQueryParams(q: Record<string, string>): Required<Pick<ListParams, "page" | "perPage">> & ListParams {
  const filters: Record<string, string> = {};
  for (const [k, v] of Object.entries(q)) {
    const m = /^filter\[(.+)]$/.exec(k);
    if (m && !["status", "date_from", "date_to"].includes(m[1])) filters[m[1]] = v;
  }
  const sortRaw = q.sort ?? "";
  return {
    page: Math.max(1, Number(q.page) || 1),
    perPage: Math.min(1000, Math.max(1, Number(q.per_page) || 15)),
    search: q.search,
    sort: sortRaw.replace(/^-/, "") || undefined,
    order: sortRaw.startsWith("-") ? "desc" : "asc",
    status: q["filter[status]"],
    dateFrom: q["filter[date_from]"],
    dateTo: q["filter[date_to]"],
    filters,
    facets: q.facets ? q.facets.split(",").filter(Boolean) : undefined,
  };
}

/** Body of a workflow transition (`POST /<resource>/<id>/<action>`). */
export interface TransitionBody {
  remarks?: string;
}

/** One entry in a record's status history. */
export interface HistoryEntry {
  at: string;
  action: string;
  from: string | null;
  to: string;
  by: string;
  remarks?: string;
}
