"use client";

import { CalendarClock, ChartLine, ChartPie, CircleAlert, CircleCheck, Clock3, FilePlus2, FileText, ListOrdered, Percent, Receipt, Send } from "lucide-react";
import Link from "next/link";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AGING_COLORS, axisTick, tooltipStyle } from "@/components/shared/charts";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageCommand } from "@/hooks/usePageCommand";
import { downloadCsv, formatCompactCurrency, formatCurrency, formatDate } from "@/lib/utils";
import { moduleService } from "@/services/moduleService";

const QUICK = [
  { label: "Create AP Invoice", href: "/payables/invoices", icon: FilePlus2 },
  { label: "Process Disbursement (DV)", href: "/payables/disbursements", icon: Send },
  { label: "Record Withholding Tax", href: "/payables/withholding-tax", icon: Percent },
  { label: "Generate AP Aging Report", href: "/payables/reports", icon: FileText },
];

export function PayablesOverviewView() {
  const { data, loading, error, reload } = useAsyncData(moduleService.getPayablesOverview);
  usePageCommand("export", () => data && downloadCsv("engas-ap-aging.csv", data.agingBySupplier));

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <PageLoader label="Loading payables overview…" />;

  const pct = (n: number) => `${((n / data.total) * 100).toFixed(1)}%`;
  const sum = (k: string) => data.agingBySupplier.reduce((s, r) => s + Number(r[k]), 0);
  const money = (n: number) => formatCurrency(n).replace("₱", "");

  return (
    <>
      <section aria-label="Payables summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Total AP Balance" value={formatCurrency(data.total)} icon={Receipt} tone="blue" />
        <StatTile label="Current (0 – 30 days)" value={formatCurrency(data.buckets.current)} icon={CircleCheck} tone="green" hint={pct(data.buckets.current)} />
        <StatTile label="31 – 60 days" value={formatCurrency(data.buckets.d30)} icon={CalendarClock} tone="amber" hint={pct(data.buckets.d30)} />
        <StatTile label="61 – 90 days" value={formatCurrency(data.buckets.d60)} icon={Clock3} tone="orange" hint={pct(data.buckets.d60)} />
        <StatTile label="Over 90 days" value={formatCurrency(data.buckets.d90)} icon={CircleAlert} tone="red" hint={pct(data.buckets.d90)} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <SectionCard title="Payables Aging by Supplier" icon={ListOrdered} bodyClassName="p-0">
            <div className="scrollbar-thin relative overflow-x-auto">
              <table className="w-full min-w-[680px] text-xs">
                <caption className="sr-only">Payables aging by supplier</caption>
                <thead className="bg-navy-900 text-white">
                  <tr>
                    <th rowSpan={2} scope="col" className="px-3 py-2 text-left">No.</th>
                    <th rowSpan={2} scope="col" className="px-3 py-2 text-left">Supplier</th>
                    <th rowSpan={2} scope="col" className="px-3 py-2 text-right">Total Balance (₱)</th>
                    <th colSpan={4} scope="colgroup" className="border-b border-white/15 px-3 py-1.5 text-center">Aging of Payables (₱)</th>
                  </tr>
                  <tr>
                    {["Current (0 – 30 days)", "31 – 60 days", "61 – 90 days", "Over 90 days"].map((h) => (
                      <th key={h} scope="col" className="px-3 py-1.5 text-right font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.agingBySupplier.map((r, i) => (
                    <tr key={String(r.supplier)} className="border-b border-neutral-100">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2 font-semibold">{r.supplier}</td>
                      {["total", "current", "d30", "d60", "d90"].map((k) => (
                        <td key={k} className="px-3 py-2 text-right tabular-nums">{money(Number(r[k]))}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 font-bold">
                    <td colSpan={2} className="px-3 py-2 text-center">Total</td>
                    {["total", "current", "d30", "d60", "d90"].map((k) => (
                      <td key={k} className="px-3 py-2 text-right tabular-nums">{formatCurrency(sum(k))}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title="AP Aging Distribution" icon={ChartPie}>
              <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[150px_1fr]">
                <div className="relative h-36" role="img" aria-label="Donut chart of payables by age bracket">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.distribution} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="95%" stroke="none">
                        {data.distribution.map((d, i) => (
                          <Cell key={d.name} fill={AGING_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[0.7rem] font-bold">{formatCompactCurrency(data.total)}</span>
                    <span className="text-[0.6rem] text-neutral-500">Total AP</span>
                  </div>
                </div>
                <ul className="space-y-1.5 text-xs">
                  {data.distribution.map((d, i) => (
                    <li key={d.name} className="grid grid-cols-[10px_1fr_auto] items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: AGING_COLORS[i] }} aria-hidden />
                      <span>{d.name}</span>
                      <span className="font-semibold tabular-nums">{pct(d.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>
            <SectionCard title="AP Trend (Total Balance)" icon={ChartLine}>
              <div className="h-40" role="img" aria-label="Line chart of total payables balance over six months">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceff3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} tickFormatter={(v: string) => v.slice(0, 3)} />
                    <YAxis tickLine={false} axisLine={false} width={50} tick={axisTick} tickFormatter={(v: number) => formatCompactCurrency(v)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                    <Line type="monotone" dataKey="balance" name="Total AP" stroke="#d7191f" strokeWidth={2.5} dot={{ r: 3, fill: "#d7191f" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        </div>

        <aside className="space-y-4">
          <SectionCard title="Quick Actions" icon={Send} variant="accent" bodyClassName="space-y-2 p-3">
            {QUICK.map(({ label, href, icon: Icon }) => (
              <Link key={label} href={href} className="flex items-center gap-2.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-ink-900 hover:border-brand-300 hover:bg-brand-50/50">
                <Icon className="h-4 w-4 text-brand-600" aria-hidden /> {label}
              </Link>
            ))}
          </SectionCard>
          <SectionCard title="Recent Transactions" icon={FileText} bodyClassName="p-0" actions={<Link href="/payables/invoices" className="text-xs font-semibold text-blue-700 hover:underline">View All</Link>}>
            <ul className="divide-y divide-neutral-100">
              {data.recent.map((r) => (
                <li key={r.ref} className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{r.ref} – {r.party}</p>
                    <p className="text-neutral-500">{formatCurrency(r.amount)} · {formatDate(r.date)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          </SectionCard>
        </aside>
      </div>
    </>
  );
}
