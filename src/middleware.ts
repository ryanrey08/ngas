import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, AUTH_ROUTES, PROTECTED_PREFIXES, ROUTES } from "@/lib/constants";

/**
 * First-line route guard. It only checks that the httpOnly `ngas_token` cookie exists; it cannot
 * tell whether the backend still accepts the token. The dashboard's AuthGate then verifies the
 * session with `GET /auth/me` before rendering anything, and the backend authorises every request.
 *
 * No loop is possible: when the backend rejects the token, the proxy deletes the cookie, so the
 * login page is no longer redirected back to the dashboard.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = hasSession ? ROUTES.dashboard : ROUTES.login;
    return NextResponse.redirect(url);
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.login;
    url.search = "";
    url.searchParams.set("from", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p);
  if (isAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|logo|images|icons|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
