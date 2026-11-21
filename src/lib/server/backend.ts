/**
 * SERVER-ONLY helpers for the same-origin proxy to the eNGAS backend (src/app/api/backend).
 * Never import this from a client component: it reads server-only env vars and the auth cookie.
 *
 * Why a proxy:
 *  - The backend authenticates with bearer tokens and its README says not to keep them in
 *    localStorage. Here the token lives in an httpOnly cookie that browser JavaScript cannot read,
 *    and it survives a page refresh.
 *  - The backend only allows browser origins listed in its CORS_ALLOWED_ORIGINS. Calling it
 *    server-to-server avoids changing backend configuration.
 */
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/constants";

const DEFAULT_TIMEOUT_MS = 15_000;

/** e.g. http://localhost:8080/api/v1/engas (no trailing slash). */
export function backendBaseUrl(): string | null {
  const raw = process.env.NGAS_BACKEND_API_URL?.trim();
  return raw ? raw.replace(/\/+$/, "") : null;
}

function timeoutMs(): number {
  const n = Number(process.env.NGAS_BACKEND_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

/** problem+json in the same shape the backend uses, for errors raised by the proxy itself. */
export function problem(status: number, code: string, detail: string): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title: code, status, code, detail },
    { status, headers: { "Content-Type": "application/problem+json", "Cache-Control": "no-store" } },
  );
}

/**
 * CSRF guard for state-changing requests: the auth cookie is sent automatically, so require the
 * browser's Origin header to match this host. (SameSite=Lax already blocks most cross-site POSTs.)
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function readToken(req: NextRequest): string | null {
  return req.cookies.get(AUTH_COOKIE)?.value ?? null;
}

/** Secure cookies whenever the site is served over HTTPS (directly or behind a TLS-terminating proxy). */
const isSecure = (req: NextRequest) =>
  req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https";

/** Stores the backend token. `expiresAt` makes it persistent ("remember me"); otherwise it is a session cookie. */
export function setTokenCookie(res: NextResponse, req: NextRequest, token: string, expiresAt: Date | null): void {
  res.cookies.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: isSecure(req),
    sameSite: "lax",
    path: "/",
    ...(expiresAt ? { expires: expiresAt } : {}),
  });
  res.cookies.delete(LEGACY_SESSION_COOKIE);
}

export function clearTokenCookie(res: NextResponse): void {
  res.cookies.delete(AUTH_COOKIE);
  res.cookies.delete(LEGACY_SESSION_COOKIE);
}

export interface BackendResult {
  status: number;
  /** Raw response body (JSON text) or null for 204. */
  body: string | null;
  headers: Headers;
}

/**
 * Calls the backend. Returns null when it cannot be reached (down, DNS, timeout) so callers
 * can answer with a clean 503/504 instead of leaking connection details.
 */
export async function callBackend(
  path: string,
  init: { method: string; token?: string | null; body?: BodyInit | null; contentType?: string | null; institutionId?: string | null },
): Promise<BackendResult | { error: "unavailable" | "timeout" | "not_configured" }> {
  const base = backendBaseUrl();
  if (!base) return { error: "not_configured" };

  const headers = new Headers({ Accept: "application/json" });
  if (init.contentType) headers.set("Content-Type", init.contentType);
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  // Selected agency/institution (only a short, safe identifier is forwarded).
  if (init.institutionId && /^[A-Za-z0-9_-]{1,64}$/.test(init.institutionId)) headers.set("X-Institution-Id", init.institutionId);

  try {
    const res = await fetch(`${base}${path}`, {
      method: init.method,
      headers,
      body: init.body ?? undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs()),
    });
    const body = res.status === 204 ? null : await res.text();
    return { status: res.status, body, headers: res.headers };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    return { error: name === "TimeoutError" || name === "AbortError" ? "timeout" : "unavailable" };
  }
}

export function unreachable(error: "unavailable" | "timeout" | "not_configured"): NextResponse {
  if (error === "timeout") return problem(504, "backend_timeout", "The eNGAS service did not respond in time.");
  if (error === "not_configured") return problem(503, "backend_unavailable", "The eNGAS service is not configured.");
  return problem(503, "backend_unavailable", "The eNGAS service is currently unavailable.");
}

/** Response headers worth passing back to the browser. */
const PASS_HEADERS = ["content-type", "retry-after", "x-request-id", "location"];

export function relay(result: BackendResult, bodyOverride?: string | null): NextResponse {
  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const h of PASS_HEADERS) {
    const v = result.headers.get(h);
    if (v) headers.set(h, v);
  }
  const body = bodyOverride !== undefined ? bodyOverride : result.body;
  return new NextResponse(result.status === 204 ? null : body, { status: result.status, headers });
}
