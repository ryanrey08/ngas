import type { NextRequest } from "next/server";
import { callBackend, clearTokenCookie, isSameOrigin, problem, readToken, relay, unreachable } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

const SAFE_SEGMENT = /^[A-Za-z0-9._~-]+$/;

/**
 * Generic authenticated proxy: /api/backend/<path> → {NGAS_BACKEND_API_URL}/<path>,
 * adding `Authorization: Bearer <token>` from the httpOnly cookie. Used for GET /auth/me and any
 * other eNGAS endpoint. A backend 401 clears the cookie so middleware stops treating the user as signed in.
 */
async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  if (!path.length || path.some((s) => !SAFE_SEGMENT.test(s) || s === "." || s === "..")) {
    return problem(404, "not_found", "The requested resource was not found.");
  }

  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD", "DELETE"].includes(method);
  if (method !== "GET" && method !== "HEAD" && !isSameOrigin(req)) {
    return problem(403, "forbidden", "Cross-origin request rejected.");
  }

  const token = readToken(req);
  // No cookie: answer like the backend would, without a round trip.
  if (!token) return problem(401, "unauthenticated", "Authentication is required.");

  const result = await callBackend(`/${path.join("/")}${req.nextUrl.search}`, {
    method,
    token,
    contentType: hasBody ? req.headers.get("content-type") : null,
    body: hasBody ? await req.arrayBuffer() : null,
    institutionId: req.headers.get("x-institution-id"),
  });
  if ("error" in result) return unreachable(result.error);

  const res = relay(result);
  if (result.status === 401) clearTokenCookie(res);
  return res;
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
