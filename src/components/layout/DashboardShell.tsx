"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/Toaster";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { logout } from "@/features/auth/authSlice";
import { ROUTES } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNotifications } from "@/store/slices/notificationsSlice";
import { getInstitution } from "@/config/institutions";
import { Breadcrumbs } from "./Breadcrumbs";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const expiresAt = useAppSelector((s) => s.auth.expiresAt);
  const notificationsStatus = useAppSelector((s) => s.notifications.status);
  const institution = getInstitution(useAppSelector((s) => s.ui.institutionId));

  // Middleware guards by cookie; this guards the client state (e.g. cleared storage, expired session).
  useEffect(() => {
    if (!user || (expiresAt && expiresAt < Date.now())) {
      void dispatch(logout()).then(() => router.replace(ROUTES.login));
    }
  }, [user, expiresAt, dispatch, router]);

  useEffect(() => {
    if (user && notificationsStatus === "idle") void dispatch(fetchNotifications());
  }, [user, notificationsStatus, dispatch]);

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-brand-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <Breadcrumbs />
        <main id="main-content" className="flex-1">
          {user ? children : <PageLoader label="Checking session…" />}
        </main>
        <footer className="flex flex-col items-center justify-between gap-1 border-t border-neutral-200 bg-white px-4 py-2.5 text-[0.7rem] text-neutral-500 sm:flex-row sm:px-6">
          <span>
            <span className="font-semibold text-ink-900">eNGAS</span> | New Government Accounting System
          </span>
          <span>
            {institution.name} | v1.0.0
          </span>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
