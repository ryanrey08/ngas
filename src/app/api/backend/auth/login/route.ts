import { NextResponse, type NextRequest } from "next/server";
import {
  callBackend,
  isSameOrigin,
  problem,
  relay,
  setTokenCookie,
  unreachable,
} from "@/lib/server/backend";

export const dynamic = "force-dynamic";

/** Device name recorded on the backend token (must match the backend's `[\pL\pN ._-]+`). */
const DEVICE_NAME = "eNGAS Web";

interface BackendLoginResponse {
  token_type: string;
  access_token: string;
  expires_at: string;
  user: unknown;
}

/**
 * POST /api/backend/auth/login → backend POST /auth/login.
 * On success, the token goes into the httpOnly cookie and only `{ user, expires_at }` is returned.
 * Errors (422 validation / invalid credentials, 429 throttle) are relayed unchanged.
 * Credentials are never logged.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return problem(403, "forbidden", "Cross-origin request rejected.");

  let input: { email?: unknown; password?: unknown; remember?: unknown };
  try {
    input = await req.json();
  } catch {
    return problem(400, "bad_request", "The request is malformed.");
  }

  const result = await callBackend("/auth/login", {
    method: "POST",
    contentType: "application/json",
    body: JSON.stringify({ email: input.email, password: input.password, device_name: DEVICE_NAME }),
  });
  if ("error" in result) return unreachable(result.error);
  if (result.status !== 200 || !result.body) return relay(result);

  let data: BackendLoginResponse;
  try {
    data = JSON.parse(result.body) as BackendLoginResponse;
  } catch {
    return problem(502, "bad_gateway", "Unexpected response from the eNGAS service.");
  }
  if (!data.access_token) return problem(502, "bad_gateway", "Unexpected response from the eNGAS service.");

  const expires = new Date(data.expires_at);
  const res = NextResponse.json(
    { user: data.user, expires_at: data.expires_at },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
  setTokenCookie(res, req, data.access_token, input.remember === true && !Number.isNaN(expires.getTime()) ? expires : null);
  return res;
}
