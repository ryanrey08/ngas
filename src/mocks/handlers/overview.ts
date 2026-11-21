import type { HomeSummary } from "@/features/home/types";
import type { PayablesOverview } from "@/features/payables/types";
import type { ReceivablesOverview } from "@/features/receivables/types";
import type { GeneratedReport } from "@/features/financial-reports/types";
import { db, nowIso, todayIso } from "../database/db";
import { SAMPLE_BALANCE_SHEET } from "../fixtures/financialReports";
import { PAYABLES_TREND_HISTORY, RECEIVABLES_TREND_HISTORY } from "../fixtures/organization";
import { body, notFound, type Router } from "./http";

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

/** Home dashboard: computed from the live journal and cash books, so it reflects every change. */
function dashboardSummary(): HomeSummary {
  const today = todayIso();
  const month = today.slice(0, 7);
  const books = ["journals/crj", "journals/cdj", "journals/ckdj", "journals/gj", "cash/receipts", "cash/disbursements"];
  const transactionsToday =
    db.journalEntries.filter((e) => e.date === today || e.createdAt.slice(0, 10) === today).length +
    books.reduce((n, b) => n + db.records[b].filter((r) => r.date === today).length, 0);
  const cash = db.records["cash/transactions"].filter((r) => String(r.date).startsWith(month));
  return {
    transactionsToday,
    receiptsMtd: cash.filter((r) => num(r.amount) > 0).reduce((s, r) => s + num(r.amount), 0),
    disbursementsMtd: -cash.filter((r) => num(r.amount) < 0).reduce((s, r) => s + num(r.amount), 0),
    cashBalance: num(db.records["cash/transactions"][0]?.balance),
    recentActivities: db.activities.slice(0, 6),
  };
}

function receivablesOverview(): ReceivablesOverview {
  const ar = db.records["receivables/receivables"];
  const collections = db.records["receivables/collections"];
  const totalBilled = ar.reduce((s, r) => s + num(r.amount), 0);
  const totalCollected = ar.reduce((s, r) => s + num(r.collected), 0);
  const byCustomer = new Map<string, number>();
  for (const c of collections) byCustomer.set(String(c.customer), (byCustomer.get(String(c.customer)) ?? 0) + num(c.amount));
  const h = RECEIVABLES_TREND_HISTORY;
  const trend = h.months.map((month, i) => ({ month, billed: Math.round(h.billed[i] * 1e6), collected: Math.round(h.collected[i] * 1e6), rate: Math.round((h.collected[i] / h.billed[i]) * 1000) / 10 }));
  trend.push({ month: "Nov", billed: totalBilled, collected: totalCollected, rate: totalBilled ? Math.round((totalCollected / totalBilled) * 1000) / 10 : 0 });
  return {
    totalBilled,
    totalCollected,
    collectionRate: totalBilled ? Math.round((totalCollected / totalBilled) * 1000) / 10 : 0,
    uncollected: ar.reduce((s, r) => s + num(r.balance), 0),
    overdue: ar.filter((r) => r.status === "Overdue").reduce((s, r) => s + num(r.balance), 0),
    trend,
    byCustomer: Array.from(byCustomer, ([name, value]) => ({ name, value })),
    collections,
  };
}

function payablesOverview(): PayablesOverview {
  const aging = db.records["payables/aging"];
  const b = { current: 0, d30: 0, d60: 0, d90: 0 };
  for (const r of aging) for (const k of Object.keys(b) as Array<keyof typeof b>) b[k] += num(r[k]);
  const total = aging.reduce((s, r) => s + num(r.total), 0);
  const recent = [
    ...db.records["payables/invoices"].map((r) => ({ ref: String(r.no), party: String(r.supplier), amount: num(r.amount), date: String(r.date), status: String(r.status) })),
    ...db.records["payables/disbursements"].map((r) => ({ ref: String(r.no), party: String(r.payee), amount: num(r.gross), date: String(r.date), status: String(r.status) })),
  ]
    .sort((x, y) => y.date.localeCompare(x.date))
    .slice(0, 4);
  return {
    total,
    buckets: b,
    agingBySupplier: aging,
    distribution: [
      { name: "Current (0 – 30 days)", value: b.current },
      { name: "31 – 60 days", value: b.d30 },
      { name: "61 – 90 days", value: b.d60 },
      { name: "Over 90 days", value: b.d90 },
    ],
    trend: [...PAYABLES_TREND_HISTORY, { month: "Nov 2026", balance: total }],
    recent,
  };
}

// ── Financial reports ─────────────────────────────────────────────────────────

function generate(code: string, period: string, fiscalYear: string): GeneratedReport {
  const def = db.reports.defs.find((d) => d.code === code);
  if (!def) throw notFound("report");
  let columns: GeneratedReport["columns"] = ["Particulars", "Amount (₱)"];
  let lines: GeneratedReport["lines"];
  if (code === "FR-007") {
    // Trial balance from posted journal entries.
    columns = ["Account", "Debit (₱)", "Credit (₱)"];
    const totals = new Map<string, { title: string; debit: number; credit: number }>();
    for (const e of db.journalEntries.filter((x) => x.status !== "Draft")) {
      for (const l of e.lines) {
        const t = totals.get(l.accountCode) ?? { title: l.accountTitle, debit: 0, credit: 0 };
        t.debit += l.debit;
        t.credit += l.credit;
        totals.set(l.accountCode, t);
      }
    }
    const rows = Array.from(totals, ([acc, t]) => ({ acc, ...t, net: t.debit - t.credit })).sort((a, b) => a.acc.localeCompare(b.acc));
    lines = rows.map((r) => ({ label: `${r.acc} – ${r.title}`, level: 2 as const, debit: r.net > 0 ? r.net : 0, credit: r.net < 0 ? -r.net : 0 }));
    lines.push({ label: "Total", level: 0, total: true, debit: rows.reduce((s, r) => s + Math.max(0, r.net), 0), credit: rows.reduce((s, r) => s + Math.max(0, -r.net), 0) });
  } else if (code === "FR-010") {
    lines = db.records["payables/aging"].map((r) => ({ label: String(r.supplier), level: 2 as const, amount: num(r.total) }));
    lines.push({ label: "Total Accounts Payable", level: 0, total: true, amount: lines.reduce((s, l) => s + (l.amount ?? 0), 0) });
  } else if (code === "FR-011") {
    lines = db.records["receivables/receivables"].map((r) => ({ label: `${r.no} – ${r.customer}`, level: 2 as const, amount: num(r.balance) }));
    lines.push({ label: "Total Receivables", level: 0, total: true, amount: lines.reduce((s, l) => s + (l.amount ?? 0), 0) });
  } else if (code === "FR-013") {
    lines = db.records["receivables/collections"].map((r) => ({ label: `${r.or} – ${r.customer} (${r.status})`, level: 2 as const, amount: num(r.amount) }));
    lines.push({ label: "Total Collections", level: 0, total: true, amount: lines.reduce((s, l) => s + (l.amount ?? 0), 0) });
  } else if (code === "FR-014") {
    lines = db.records["cash/cash-position"].map((r) => ({ label: `${r.fund} (${r.bank})`, level: 2 as const, amount: num(r.ending) }));
    lines.push({ label: "Total Cash Position", level: 0, total: true, amount: lines.reduce((s, l) => s + (l.amount ?? 0), 0) });
  } else {
    lines = SAMPLE_BALANCE_SHEET;
  }
  const generatedAt = nowIso();
  db.reports.recent.unshift({ name: def.name, at: generatedAt });
  db.reports.recent = db.reports.recent.slice(0, 8);
  return { code, name: def.name, period, fiscalYear, generatedAt, columns, lines, sample: lines === SAMPLE_BALANCE_SHEET };
}

export function registerOverviewHandlers(r: Router) {
  r.on("GET", "dashboard/summary", () => ({ data: dashboardSummary() }));
  r.on("GET", "receivables/overview", () => ({ data: receivablesOverview() }));
  r.on("GET", "payables/overview", () => ({ data: payablesOverview() }));

  r.on("GET", "notifications", () => ({ data: db.notifications }));
  r.on("POST", "notifications/read-all", () => {
    db.notifications.forEach((n) => (n.read = true));
    return { data: db.notifications };
  });
  r.on("POST", "notifications/:id/read", (req) => {
    const n = db.notifications.find((x) => x.id === req.params.id);
    if (!n) throw notFound("notification");
    n.read = true;
    return { data: n };
  });

  r.on("GET", "institutions", () => ({ data: db.institutions }));
  r.on("GET", "settings", () => ({ data: db.settings }));

  r.on("GET", "financial-reports/catalog", () => ({
    data: { reports: db.reports.defs.map((d) => ({ ...d, favorite: db.reports.favorites.has(d.code) })), recent: db.reports.recent },
  }));
  r.on("POST", "financial-reports/:code/generate", (req) => {
    const { period, fiscal_year } = body<{ period: string; fiscal_year: string }>(req);
    return { data: generate(req.params.code, period, fiscal_year) };
  });
  r.on("PUT", "financial-reports/:code/favorite", (req) => {
    if (!db.reports.defs.some((d) => d.code === req.params.code)) throw notFound("report");
    const { favorite } = body<{ favorite: boolean }>(req);
    if (favorite) db.reports.favorites.add(req.params.code);
    else db.reports.favorites.delete(req.params.code);
    return { data: { code: req.params.code, favorite } };
  });
}

