import { type NextRequest, NextResponse } from "next/server";
import { callBackend, clearTokenCookie, isSameOrigin, problem, readToken } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

/**
 * POST /api/backend/auth/logout → backend POST /auth/logout (revokes the current token).
 * The cookie is cleared whatever the backend answers, so local sign-out always works.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return problem(403, "forbidden", "Cross-origin request rejected.");

  const token = readToken(req);
  if (token) await callBackend("/auth/logout", { method: "POST", token });

  const res = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  clearTokenCookie(res);
  return res;
}
