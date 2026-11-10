"use client";

import { ChartColumn, ChartPie, CircleAlert, CircleCheck, FileText, Hourglass, ListOrdered, Receipt, Wallet } from "lucide-react";
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { CHART_COLORS, axisTick, tooltipStyle } from "@/components/shared/charts";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { renderCell } from "@/features/modules/components/cells";
import type { Row } from "@/features/modules/types";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageCommand } from "@/hooks/usePageCommand";
import { downloadCsv, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { moduleService } from "@/services/moduleService";

const COLS: Array<[string, string, Parameters<typeof renderCell>[0], ("right" | "center")?]> = [
  ["no", "Collection No.", "mono"],
  ["or", "OR No.", "mono"],
  ["customer", "Customer / Agency", "strong"],
  ["particulars", "Particulars", "text"],
  ["date", "Collection Date", "date"],
  ["amount", "Amount Collected (₱)", "currency", "right"],
  ["mode", "Mode of Payment", "text"],
  ["status", "Status", "status", "center"],
];

export function ReceivablesOverviewView() {
  const { data, loading, error, reload } = useAsyncData(moduleService.getReceivablesOverview);

  usePageCommand("export", () => data && downloadCsv("engas-collections.csv", data.collections.map((r) => Object.fromEntries(COLS.map(([k, h]) => [h, r[k] ?? ""])))));

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <PageLoader label="Loading collections overview…" />;

  const total = data.byCustomer.reduce((s, x) => s + x.value, 0);
  const columns: Column<Row>[] = COLS.map(([key, header, kind, align]) => ({ key, header, align, sortValue: (r) => r[key], cell: (r) => renderCell(kind, r[key]) }));

  return (
    <>
      <section aria-label="Collections summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Total Billed (YTD)" value={formatCurrency(data.totalBilled)} icon={Receipt} tone="blue" />
        <StatTile label="Total Collected (YTD)" value={formatCurrency(data.totalCollected)} icon={CircleCheck} tone="green" />
        <StatTile label="Collection Rate" value={`${data.collectionRate}%`} icon={Hourglass} tone="amber" />
        <StatTile label="Uncollected Balance" value={formatCurrency(data.uncollected)} icon={FileText} tone="blue" />
        <StatTile label="Overdue Receivables" value={formatCurrency(data.overdue)} icon={CircleAlert} tone="red" />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SectionCard title="Collections Trend" icon={ChartColumn}>
          <div className="h-64" role="img" aria-label="Monthly billed and collected amounts with collection rate">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trend} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} />
                <YAxis yAxisId="amt" tickLine={false} axisLine={false} width={56} tick={axisTick} tickFormatter={(v: number) => formatCompactCurrency(v)} />
                <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} width={36} tick={axisTick} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => (n === "Collection Rate" ? `${v}%` : formatCurrency(Number(v)))} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="amt" dataKey="billed" name="Billed Amount" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar yAxisId="amt" dataKey="collected" name="Collected Amount" fill="#16a34a" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Line yAxisId="rate" type="monotone" dataKey="rate" name="Collection Rate" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Collections by Customer / Agency" icon={ChartPie}>
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[180px_1fr]">
            <div className="relative h-44" role="img" aria-label="Donut chart of collections by customer">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byCustomer} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="95%" stroke="none" paddingAngle={1}>
                    {data.byCustomer.map((d, i) => (
                      <Cell key={d.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-ink-900">{formatCompactCurrency(total)}</span>
                <span className="text-[0.6rem] text-neutral-500">Total Collected</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs">
              {data.byCustomer.map((d, i) => (
                <li key={d.name} className="grid grid-cols-[12px_1fr_auto_auto] items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden />
                  <span className="truncate text-ink-800">{d.name}</span>
                  <span className="text-neutral-500 tabular-nums">{((d.value / total) * 100).toFixed(1)}%</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(d.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Collections List" icon={ListOrdered} bodyClassName="p-0" actions={<span className="flex items-center gap-1 text-xs text-neutral-600"><Wallet className="h-3.5 w-3.5" aria-hidden /> Total Collected: <b className="text-ink-900">{formatCurrency(data.collections.reduce((s, r) => s + Number(r.amount), 0))}</b></span>}>
        <DataTable caption="Collections" data={data.collections} columns={columns} getRowId={(r) => String(r.no)} />
      </SectionCard>
    </>
  );
}
