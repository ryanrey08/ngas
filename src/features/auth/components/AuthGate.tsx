"use client";

import { LogIn, RefreshCw, TriangleAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { SplashScreen } from "@/components/shared/SplashScreen";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCurrentUser, logout } from "../authSlice";
import { loginUrl } from "../authUtils";
import type { ApiError } from "@/types";

/**
 * Wraps every authenticated page. Nothing protected renders until the backend has confirmed the
 * session with `GET /auth/me` (or the user just signed in), so there is no flash of protected content.
 *
 *  - 401 → the axios interceptor clears state and redirects to /login?from=…&reason=expired
 *  - backend down / network error → a retry screen (no redirect, so no redirect loop)
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized } = useAppSelector((s) => s.auth);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [retrying, setRetrying] = useState(false);

  const check = useCallback(async () => {
    setFailure(null);
    const result = await dispatch(fetchCurrentUser());
    if (fetchCurrentUser.rejected.match(result) && result.payload && result.payload.status !== 401) {
      setFailure(result.payload);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isInitialized) void check();
  }, [isInitialized, check]);

  // Signed out in this tab (or the session was cleared): go to the login page.
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !failure) router.replace(loginUrl(pathname));
  }, [isInitialized, isAuthenticated, failure, router, pathname]);

  if (failure) {
    const retry = async () => {
      setRetrying(true);
      await check();
      setRetrying(false);
    };
    const signInAgain = async () => {
      await dispatch(logout());
      router.replace(loginUrl(pathname));
    };
    return (
      <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white px-6 text-center">
        <Logo width={200} priority />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <TriangleAlert className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-lg font-bold text-ink-900">We couldn&apos;t verify your session</h1>
          <p className="mt-1 max-w-sm text-sm text-neutral-500">{failure.message}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={signInAgain} leftIcon={<LogIn className="h-4 w-4" />}>
            Sign in again
          </Button>
          <Button onClick={retry} loading={retrying} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return <SplashScreen />;
  return <>{children}</>;
}
