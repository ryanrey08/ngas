/** Minimal request router + response helpers for the mock API. */
import { fromQueryParams, type ListParams, type Paginated } from "@/services/api/apiTypes";

export interface MockRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  /** Display name of the signed-in user (from the auth slice). */
  user: string;
}

/** Throw from a handler to answer with an error status and problem+json body. */
export class MockHttpError extends Error {
  constructor(
    public status: number,
    public body: { code?: string; detail: string; errors?: Record<string, string[]> },
  ) {
    super(body.detail);
  }
}

export const notFound = (what = "record") => new MockHttpError(404, { code: "not_found", detail: `The requested ${what} was not found.` });

export function validationError(errors: Record<string, string>): MockHttpError {
  return new MockHttpError(422, {
    code: "validation_failed",
    detail: "The given data was invalid.",
    errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, [v]])),
  });
}

export const conflict = (detail: string) => new MockHttpError(422, { code: "invalid_state", detail });

/** A handler returns the JSON body (200), or `{ status, body }` for another status. */
export type HandlerResult = unknown | { __status: number; body: unknown };
export const created = (body: unknown) => ({ __status: 201, body });
export const noContent = () => ({ __status: 204, body: null });

type Handler = (req: MockRequest) => HandlerResult;
interface Route {
  method: string;
  parts: string[];
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];
  on(method: string, pattern: string, handler: Handler) {
    this.routes.push({ method, parts: pattern.split("/"), handler });
    return this;
  }
  match(method: string, path: string): { handler: Handler; params: Record<string, string> } | null {
    const segs = path.split("/");
    for (const r of this.routes) {
      if (r.method !== method || r.parts.length !== segs.length) continue;
      const params: Record<string, string> = {};
      const ok = r.parts.every((p, i) => {
        if (p.startsWith(":")) {
          params[p.slice(1)] = decodeURIComponent(segs[i]);
          return true;
        }
        return p === segs[i];
      });
      if (ok) return { handler: r.handler, params };
    }
    return null;
  }
}

export function body<T>(req: MockRequest): T {
  return (req.body ?? {}) as T;
}

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));

function compare(a: unknown, b: unknown) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return str(a).localeCompare(str(b), undefined, { numeric: true });
}

interface QueryOptions<T> {
  /** Fields searched by `search` (default: every string field). */
  searchKeys?: (keyof T & string)[];
  /** Field compared against `filter[date_from]` / `filter[date_to]`. */
  dateKey?: keyof T & string;
  /** Map a filter key to a different field name. */
  filterKeys?: Record<string, keyof T & string>;
}

/** Filter + search + sort without paginating (used by lists, exports and summaries). */
export function applyQuery<T extends object>(rows: T[], p: ListParams, opts: QueryOptions<T> = {}): T[] {
  const q = p.search?.trim().toLowerCase();
  const get = (r: T, k: string) => (r as Record<string, unknown>)[k];
  let out = rows.filter((r) => {
    if (p.status && str(get(r, "status")) !== p.status) return false;
    if (opts.dateKey && p.dateFrom && str(get(r, opts.dateKey)) < p.dateFrom) return false;
    if (opts.dateKey && p.dateTo && str(get(r, opts.dateKey)).slice(0, 10) > p.dateTo) return false;
    for (const [k, v] of Object.entries(p.filters ?? {})) {
      if (v && str(get(r, opts.filterKeys?.[k] ?? k)) !== v) return false;
    }
    if (q) {
      const keys = opts.searchKeys ?? Object.keys(r).filter((k) => typeof get(r, k) === "string");
      if (!keys.some((k) => str(get(r, k)).toLowerCase().includes(q))) return false;
    }
    return true;
  });
  if (p.sort) {
    const key = p.sort;
    const dir = p.order === "desc" ? -1 : 1;
    out = [...out].sort((a, b) => compare(get(a, key), get(b, key)) * dir);
  }
  return out;
}

/** Laravel-style paginator response, with `meta.totals` and `meta.facets`. */
export function paginate<T extends object>(all: T[], p: ListParams, facetSource: T[] = all): Paginated<T> {
  const page = p.page ?? 1;
  const perPage = p.perPage ?? 15;
  const total = all.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, lastPage);
  const start = (current - 1) * perPage;
  const data = all.slice(start, start + perPage);
  const totals: Record<string, number> = {};
  for (const r of all) for (const [k, v] of Object.entries(r)) if (typeof v === "number") totals[k] = (totals[k] ?? 0) + v;
  const facets = p.facets?.length
    ? Object.fromEntries(p.facets.map((f) => [f, Array.from(new Set(facetSource.map((r) => str((r as Record<string, unknown>)[f])))).filter(Boolean).sort()]))
    : undefined;
  return {
    data,
    meta: { current_page: current, per_page: perPage, total, last_page: lastPage, from: total ? start + 1 : null, to: total ? start + data.length : null, totals, facets },
  };
}

export const listParams = (req: MockRequest) => fromQueryParams(req.query);
