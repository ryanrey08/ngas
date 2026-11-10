"use client";

import {
  CalendarClock,
  FileBarChart2,
  FileSpreadsheet,
  FileStack,
  FileText,
  FolderTree,
  History,
  Play,
  Printer,
  Search,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FormSelect } from "@/components/forms/FormSelect";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { SectionCard } from "@/components/ui/SectionCard";
import { getInstitution } from "@/config/institutions";
import { useAsyncData } from "@/hooks/useAsyncData";
import { cn, downloadCsv, formatCurrency, formatDate } from "@/lib/utils";
import { SAMPLE_BALANCE_SHEET } from "@/mocks/financialReports";
import { moduleService } from "@/services/moduleService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import type { ReportCategory, ReportDef } from "../types";

const CATEGORY_ICON: Record<ReportCategory, LucideIcon> = {
  "Financial Statements": FileText,
  "Budgetary Reports": FileBarChart2,
  "Cash Management": FileSpreadsheet,
  "Receivables & Payables": FileStack,
  "Trial Balances": FolderTree,
  "Audit & Compliance": History,
};
const ICON_TONES = ["bg-green-600", "bg-blue-600", "bg-brand-600", "bg-purple-600", "bg-orange-500", "bg-teal-600", "bg-pink-600"];

export function FinancialReportsView() {
  const dispatch = useAppDispatch();
  const institution = getInstitution(useAppSelector((s) => s.ui.institutionId));
  const { data, loading, error, reload } = useAsyncData(moduleService.getFinancialReports);
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("November 2026");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["FR-001", "FR-007"]));
  const [preview, setPreview] = useState<ReportDef | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const reports = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.reports ?? []).filter((r) => (!category || r.category === category) && (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)));
  }, [data, category, query]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <PageLoader label="Loading report catalog…" />;

  const categories = Object.keys(CATEGORY_ICON) as ReportCategory[];
  const countOf = (c: ReportCategory) => data.reports.filter((r) => r.category === c).length;

  const generate = async (r: ReportDef) => {
    setGenerating(r.code);
    await new Promise((res) => setTimeout(res, 600));
    setGenerating(null);
    setPreview(r);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[210px_minmax(0,1fr)_250px]">
        <nav aria-label="Report categories" className="h-fit overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card">
          <p className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 text-sm font-bold">
            <FolderTree className="h-4 w-4 text-brand-600" aria-hidden /> Report Categories
          </p>
          <ul className="space-y-0.5 p-2 text-xs">
            {[["", "All Reports", data.reports.length, FileSpreadsheet] as const, ...categories.map((c) => [c, c, countOf(c), CATEGORY_ICON[c]] as const)].map(([value, label, n, Icon]) => {
              const active = category === value;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setCategory(value as ReportCategory | "")}
                    aria-pressed={active}
                    className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left font-semibold", active ? "bg-brand-50 text-brand-700" : "text-ink-800 hover:bg-neutral-50")}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" aria-hidden /> {label}
                    </span>
                    <span className={cn("rounded-full px-1.5 text-[0.65rem]", active ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600")}>{n}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-label="Reports" className="min-w-0 space-y-3">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-card sm:grid-cols-[minmax(0,1fr)_150px_170px]">
            <label className="relative self-end">
              <span className="sr-only">Search report name or code</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search report name or code…" className="h-10 w-full rounded-lg border border-neutral-300 pr-3 pl-9 text-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none" />
            </label>
            <FormSelect label="Fiscal Year" options={["2026", "2025"]} defaultValue="2026" />
            <FormSelect label="Period" options={["November 2026", "October 2026", "Q3 2026", "FY 2025"]} value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>

          {reports.length === 0 ? (
            <EmptyState title="No reports found" description="Try another category or keyword." />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {reports.map((r, i) => {
                const Icon = CATEGORY_ICON[r.category];
                const fav = favorites.has(r.code);
                return (
                  <li key={r.code} className="flex flex-col rounded-xl border border-neutral-200 bg-white p-3.5 shadow-card">
                    <div className="flex items-start gap-3">
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white", ICON_TONES[i % ICON_TONES.length])}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink-900">{r.name}</p>
                        <p className="text-[0.7rem] text-neutral-500">{r.code}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={fav ? `Remove ${r.name} from favorites` : `Add ${r.name} to favorites`}
                        aria-pressed={fav}
                        onClick={() => setFavorites((s) => {
                          const n = new Set(s);
                          if (n.has(r.code)) n.delete(r.code);
                          else n.add(r.code);
                          return n;
                        })}
                        className="rounded p-1 text-neutral-400 hover:text-amber-500"
                      >
                        <Star className={cn("h-4 w-4", fav && "fill-amber-400 text-amber-500")} aria-hidden />
                      </button>
                    </div>
                    <p className="mt-2 flex-1 text-xs text-neutral-600">{r.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex gap-1">
                        {r.formats.map((f) => (
                          <span key={f} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-neutral-700">{f}</span>
                        ))}
                      </span>
                      <Button size="xs" variant="blue" loading={generating === r.code} onClick={() => generate(r)} aria-label={`Generate ${r.name}`}>
                        Generate
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <SectionCard title="Quick Actions" icon={Zap} bodyClassName="space-y-2 p-3">
            <Button fullWidth leftIcon={<Play />} onClick={() => generate(data.reports[0])}>
              Generate Report
            </Button>
            <Link href="/financial-reports/templates" className="flex h-9 items-center justify-center gap-2 rounded-lg border border-brand-600 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              <FileStack className="h-4 w-4" aria-hidden /> View Report Templates
            </Link>
            <Link href="/financial-reports/scheduled" className="flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-300 text-sm font-semibold hover:bg-neutral-50">
              <CalendarClock className="h-4 w-4" aria-hidden /> Scheduled Reports
            </Link>
            <Button
              fullWidth
              variant="outline"
              leftIcon={<FileSpreadsheet className="text-green-700" />}
              onClick={() => downloadCsv("engas-report-catalog.csv", data.reports.map((r) => ({ Code: r.code, Name: r.name, Category: r.category, Formats: r.formats.join("/") })))}
            >
              Export to Excel
            </Button>
          </SectionCard>
          <SectionCard title="Recent Reports" icon={History} bodyClassName="p-0">
            <ul className="divide-y divide-neutral-100">
              {data.recent.map((r) => (
                <li key={r.name + r.at} className="flex items-start gap-2.5 px-4 py-2.5 text-xs">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
                  <div>
                    <p className="font-semibold text-ink-900">{r.name}</p>
                    <p className="text-neutral-500">{formatDate(r.at, { month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </aside>
      </div>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Report Preview"
        icon={<FileText />}
        size="lg"
        footer={
          <>
            <Button variant="outline" leftIcon={<Printer />} onClick={() => window.print()}>
              Print
            </Button>
            <Button
              variant="excel"
              leftIcon={<FileSpreadsheet />}
              onClick={() => {
                downloadCsv(`${preview?.code}-${period.replace(/\s+/g, "-")}.csv`, SAMPLE_BALANCE_SHEET.map((l) => ({ Particulars: l.label, Amount: l.amount ?? "" })));
                dispatch(showToast({ variant: "success", title: "Report exported", description: `${preview?.name} – ${period}` }));
              }}
            >
              Export to Excel
            </Button>
          </>
        }
      >
        {preview && (
          <article className="text-xs">
            <header className="mb-4 flex items-center gap-4 border-b border-neutral-200 pb-3">
              <Logo width={90} />
              <div>
                <p className="font-heading text-sm font-bold text-ink-900">{institution.name}</p>
                <p className="text-neutral-600">New Government Accounting System (eNGAS)</p>
                <p className="mt-1 font-heading text-base font-bold text-brand-700">{preview.name}</p>
                <p className="text-neutral-600">For the period: {period} · All Funds</p>
              </div>
            </header>
            <table className="w-full">
              <caption className="sr-only">{preview.name}</caption>
              <thead>
                <tr className="bg-navy-900 text-white">
                  <th scope="col" className="px-3 py-2 text-left">Particulars</th>
                  <th scope="col" className="px-3 py-2 text-right">Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_BALANCE_SHEET.map((l) => (
                  <tr key={l.label} className={cn("border-b border-neutral-100", l.total && "bg-blue-50 font-bold", l.level === 0 && !l.total && "font-bold")}>
                    <td className="px-3 py-1.5" style={{ paddingLeft: 12 + l.level * 16 }}>{l.label}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{l.amount !== undefined ? formatCurrency(l.amount).replace("₱", "") : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[0.65rem] text-neutral-500">Sample data generated in demo mode. Figures are illustrative.</p>
          </article>
        )}
      </Modal>
    </>
  );
}
