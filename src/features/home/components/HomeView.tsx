"use client";

import { Activity, ArrowDownToLine, ArrowUpFromLine, ChartColumn, FilePlus2, FileSpreadsheet, ListTree, Link2, Scale, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/shared/Logo";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SectionCard } from "@/components/ui/SectionCard";
import { MODULES, tabHref } from "@/config/modules";
import { hasPermission } from "@/config/navigation";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHomeSummary } from "../homeSlice";

const QUICK_LINKS = [
  { label: "New Transaction", href: "/double-entry/entry", icon: FilePlus2 },
  { label: "Generate Report", href: "/financial-reports/list", icon: ChartColumn },
  { label: "Chart of Accounts", href: "/coa/accounts", icon: ListTree },
  { label: "User Management", href: "/users", icon: Users },
];

function HeroArt() {
  return (
    <svg aria-hidden viewBox="0 0 420 220" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs>
        <linearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfe6ef" />
          <stop offset="100%" stopColor="#f5f6f8" />
        </linearGradient>
        <linearGradient id="heroStone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e3e6ea" />
          <stop offset="100%" stopColor="#aeb5bf" />
        </linearGradient>
      </defs>
      <rect width="420" height="220" fill="url(#heroSky)" />
      <g fill="url(#heroStone)">
        <polygon points="60,70 250,20 440,70" />
        <rect x="60" y="70" width="380" height="12" />
        {Array.from({ length: 9 }, (_, i) => 80 + i * 40).map((x) => (
          <rect key={x} x={x} y="88" width="18" height="100" rx="3" />
        ))}
        <rect x="50" y="188" width="400" height="12" />
        <rect x="36" y="200" width="420" height="20" />
      </g>
      <rect x="34" y="8" width="3" height="120" fill="#9ca3af" />
      <rect x="37" y="10" width="56" height="18" fill="#1d4ed8" />
      <rect x="37" y="28" width="56" height="18" fill="#d7191f" />
      <polygon points="37,10 61,28 37,46" fill="#fff" />
    </svg>
  );
}

export function HomeView() {
  const dispatch = useAppDispatch();
  const { summary, status, error } = useAppSelector((s) => s.home);
  const role = useAppSelector((s) => s.auth.user?.role);

  useEffect(() => {
    if (status === "idle") void dispatch(fetchHomeSummary());
  }, [status, dispatch]);

  const modules = MODULES.filter((m) => m.key !== "setup" && hasPermission(role, m.permission));

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
      <section className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card" aria-label="eNGAS">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:p-7">
            <Logo width={190} priority className="shrink-0" />
            <div className="hidden h-24 w-px bg-neutral-200 sm:block" aria-hidden />
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">eNGAS</h1>
              <p className="font-heading text-lg font-bold text-brand-600">New Government Accounting System</p>
              <p className="mt-2 max-w-md text-sm text-neutral-600">
                An integrated and compliant government accounting system that ensures accurate, transparent, and timely financial management
                through double entry, accrual accounting, and COA-aligned reporting.
              </p>
            </div>
          </div>
          <div className="relative hidden min-h-48 md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" style={{ zIndex: 1 }} />
            <HeroArt />
          </div>
        </div>
        <div className="h-1.5 bg-gradient-to-r from-ink-900 via-brand-600 to-brand-700" aria-hidden />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="Modules" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => {
            const Icon = m.icon;
            const wide = i === modules.length - 1 && modules.length % 3 === 2;
            return (
              <Link
                key={m.key}
                href={tabHref(m, m.tabs[0].slug)}
                className={cn(
                  "group flex gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop",
                  wide && "lg:col-span-2",
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-base font-bold text-ink-900">{m.label}</span>
                  {m.features.length ? (
                    <ul className={cn("mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-neutral-700", wide && "sm:columns-2")}>
                      {m.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="mt-1 block text-xs text-neutral-600">{m.summary}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </section>

        <aside className="space-y-4">
          <SectionCard title="Quick Links" icon={Link2} variant="accent" bodyClassName="grid grid-cols-2 gap-2 p-3">
            {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
              <Link key={label} href={href} className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2.5 py-2 text-xs font-semibold text-ink-900 hover:border-brand-300 hover:bg-brand-50/50">
                <Icon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                {label}
              </Link>
            ))}
          </SectionCard>

          <SectionCard title="System Summary" icon={ChartColumn} bodyClassName="grid grid-cols-2 gap-2 p-3">
            {status === "failed" ? (
              <div className="col-span-2">
                <ErrorState message={error} onRetry={() => dispatch(fetchHomeSummary())} />
              </div>
            ) : !summary ? (
              <div className="col-span-2 py-6 text-center">
                <LoadingSpinner label="Loading summary…" />
              </div>
            ) : (
              (
                [
                  ["Transactions Today", String(summary.transactionsToday), Scale, "bg-green-50 text-green-700"],
                  ["Total Receipts (MTD)", formatCurrency(summary.receiptsMtd), ArrowDownToLine, "bg-blue-50 text-blue-700"],
                  ["Total Disbursements (MTD)", formatCurrency(summary.disbursementsMtd), ArrowUpFromLine, "bg-orange-50 text-orange-700"],
                  ["Cash Balance", formatCurrency(summary.cashBalance), Wallet, "bg-purple-50 text-purple-700"],
                ] as const
              ).map(([label, value, Icon, tone]) => (
                <div key={label} className={cn("rounded-lg p-2.5", tone)}>
                  <Icon className="h-4 w-4" aria-hidden />
                  <p className="mt-1 font-heading text-[0.8rem] leading-tight font-bold break-words text-ink-900 tabular-nums">{value}</p>
                  <p className="text-[0.65rem] text-neutral-600">{label}</p>
                </div>
              ))
            )}
          </SectionCard>

          <SectionCard title="Recent Activities" icon={Activity} bodyClassName="p-0" actions={<Link href="/double-entry/posted" className="text-xs font-semibold text-blue-700 hover:underline">View All</Link>}>
            <ul className="divide-y divide-neutral-100">
              {(summary?.recentActivities ?? []).map((a) => (
                <li key={a.id} className="flex gap-3 px-4 py-2.5">
                  <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
                  <div className="min-w-0 text-xs">
                    <p className="font-semibold text-ink-900">
                      {a.title} <span className="font-normal text-neutral-600">({a.reference})</span>
                    </p>
                    <p className="text-neutral-500">{formatDate(a.at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
