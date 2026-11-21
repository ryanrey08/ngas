import type { JournalEntry } from "@/features/journal/types";
import { RECORD_FORMS } from "@/features/modules/recordForms";
import { findAction } from "@/features/modules/recordWorkflows";
import type { TransitionBody } from "@/services/api/apiTypes";
import { db, logActivity, nextId, notify, nowIso, pushHistory, todayIso, type MockRow } from "../database/db";
import { applyQuery, body, conflict, created, listParams, MockHttpError, noContent, notFound, paginate, validationError, type MockRequest, type Router } from "./http";

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const sum = (rows: MockRow[], key: string) => rows.reduce((s, r) => s + num(r[key]), 0);

function resourceOf(req: MockRequest) {
  const resource = `${req.params.module}/${req.params.tab}`;
  if (!db.records[resource]) throw notFound("resource");
  return resource;
}

function findRow(resource: string, id: string) {
  const row = db.records[resource].find((r) => r.id === id);
  if (!row) throw notFound("record");
  return row;
}

const dateKeyOf = (rows: MockRow[]) => (rows[0] && "date" in rows[0] ? "date" : rows[0] && "billing" in rows[0] ? "billing" : undefined);

// ── Summary tiles ─────────────────────────────────────────────────────────────

const bookSummary = (rows: MockRow[]) => ({
  totalAmount: sum(rows, "amount"),
  count: rows.length,
  postedAmount: sum(rows.filter((r) => r.status === "Posted"), "amount"),
  unpostedAmount: sum(rows.filter((r) => r.status !== "Posted"), "amount"),
});

const PETTY_CASH_FUND = 20_000;
/** Cash restricted for trust and donation funds (not available for operations). */
const RESTRICTED_CASH = 20_750_000;

const SUMMARIES: Record<string, (rows: MockRow[]) => Record<string, number>> = {
  "journals/crj": bookSummary,
  "journals/cdj": bookSummary,
  "journals/ckdj": bookSummary,
  "journals/gj": bookSummary,
  "cash/receipts": bookSummary,
  "cash/disbursements": bookSummary,
  "journals/gl": (rows) => ({ totalDebit: sum(rows, "debit"), totalCredit: sum(rows, "credit"), count: rows.length, endingBalance: num(rows.at(-1)?.balance) }),
  "cash/transactions": (rows) => {
    const balance = num(rows[0]?.balance);
    return {
      cashBalance: balance,
      totalReceipts: sum(rows.filter((r) => num(r.amount) > 0), "amount"),
      totalDisbursements: -sum(rows.filter((r) => num(r.amount) < 0), "amount"),
      availableCash: balance - RESTRICTED_CASH,
    };
  },
  "cash/petty-cash": (rows) => ({
    fund: PETTY_CASH_FUND,
    vouchersTotal: sum(rows, "amount"),
    pendingCount: rows.filter((r) => r.status === "Pending").length,
    balanceOnHand: PETTY_CASH_FUND - sum(rows.filter((r) => r.status === "Pending"), "amount"),
  }),
  "cash/cash-position": (rows) => ({ beginning: sum(rows, "beginning"), receipts: sum(rows, "receipts"), disbursements: sum(rows, "disbursements"), ending: sum(rows, "ending") }),
  "receivables/receivables": (rows) => ({
    totalAmount: sum(rows, "amount"),
    totalCollected: sum(rows, "collected"),
    outstanding: sum(rows, "balance"),
    overdue: sum(rows.filter((r) => r.status === "Overdue"), "balance"),
  }),
};

// ── Cross-module side effects of a status change ──────────────────────────────

function onTransition(resource: string, row: MockRow, action: string, user: string) {
  if (resource === "payables/disbursements" && action === "release") {
    // The DV is paid out of Cash in Bank: it appears in the cash book and the CDJ.
    const cash = db.records["cash/transactions"];
    const balance = num(cash[0]?.balance) - num(row.net);
    cash.unshift({ id: nextId("record", "cash-transactions"), no: `CM-2026-${String(db.seq.record).padStart(6, "0")}`, date: todayIso(), type: "Disbursement", particulars: `${row.particulars} – ${row.payee} (${row.no})`, fund: "101 - General Fund", amount: -num(row.net), balance, status: "Posted" });
    db.records["journals/cdj"].unshift({ id: nextId("record", "journals-cdj"), no: `CDJ-2026-${String(db.seq.record).padStart(6, "0")}`, date: todayIso(), ref: String(row.no), particulars: `${row.particulars} – ${row.payee}`, fund: "101 - General Fund", amount: num(row.net), status: "Posted" });
    logActivity("Released Disbursement Voucher", `DV No. ${row.no}`);
  }
  if (resource === "payables/disbursements" && action === "submit") {
    notify({ title: "Disbursement voucher for approval", message: `${row.no} (₱${num(row.gross).toLocaleString("en-PH")}) is awaiting approval.`, type: "warning", href: "/payables/disbursements" });
  }
  if (resource === "receivables/collections" && action === "deposit") {
    const ar = db.records["receivables/receivables"].find((r) => r.customer === row.customer && num(r.balance) > 0);
    if (ar) {
      const paid = Math.min(num(ar.balance), num(row.amount));
      ar.collected = num(ar.collected) + paid;
      ar.balance = num(ar.balance) - paid;
      ar.status = num(ar.balance) === 0 ? "Fully Paid" : "Partially Paid";
    }
    logActivity("Deposited Collection", `OR No. ${row.or}`);
  }
  if (resource.endsWith("/reports") && action === "generate") row.last = todayIso();
  if (resource === "financial-reports/scheduled" && action === "run") logActivity("Ran Scheduled Report", String(row.name));
  if (action === "post") logActivity("Posted Entry", `No. ${row.no ?? row.code ?? row.id}`);
  void user;
}

// ── Create / edit (resources with a form) ─────────────────────────────────────

function validateForm(resource: string, input: Record<string, string>, editing?: MockRow) {
  const form = RECORD_FORMS[resource];
  if (!form) throw new MockHttpError(405, { code: "method_not_allowed", detail: "This list is read-only." });
  const errors: Record<string, string> = {};
  for (const f of form.fields) {
    if (editing && f.lockedOnEdit) continue;
    const v = (input[f.key] ?? "").trim();
    if (f.required && !v) errors[f.key] = `${f.label} is required`;
    else if (v && f.maxLength && v.length > f.maxLength) errors[f.key] = `Max ${f.maxLength} characters`;
    else if (v && f.pattern && !new RegExp(f.pattern.regex).test(v)) errors[f.key] = f.pattern.message;
    else if (v && f.options && !f.options.includes(v)) errors[f.key] = `Select a valid ${f.label.toLowerCase()}`;
    else if (v && f.unique && db.records[resource].some((r) => String(r[f.key]).toLowerCase() === v.toLowerCase() && r.id !== editing?.id)) errors[f.key] = `${f.label} ${v} already exists`;
  }
  if (Object.keys(errors).length) throw validationError(errors);
  return Object.fromEntries(form.fields.filter((f) => !(editing && f.lockedOnEdit)).map((f) => [f.key, (input[f.key] ?? "").trim()]));
}

// ── Auto Journal ──────────────────────────────────────────────────────────────

function generateFromRules(user: string) {
  const rules = db.records["double-entry/auto-journal"].filter((r) => r.status === "Active");
  const date = todayIso();
  const entries: JournalEntry[] = rules.map((rule) => {
    const [dr, cr] = String(rule.treatment).replace(/Debit |Credit /g, "").split(" / ");
    const amount = 10_000;
    const acct = (title: string) => db.accounts.find((a) => a.postable && a.uacs && a.title.toLowerCase().includes(title.split(" ")[0].toLowerCase()));
    const debit = acct(dr) ?? db.accounts.find((a) => a.uacs === "5020402000")!;
    const credit = acct(cr) ?? db.accounts.find((a) => a.uacs === "2990101000")!;
    return {
      id: nextId("journal", "je"),
      kind: "double-entry",
      transactionNo: `GJ-${date.slice(0, 4)}-${String(db.seq.journal++).padStart(4, "0")}`,
      date,
      journalType: "General Journal (GJ)",
      referenceNo: `${rule.code}-${date.replace(/-/g, "")}`,
      description: `Auto journal: ${rule.rule} (${rule.trigger}).`,
      department: "Accounting Unit",
      projectCode: "",
      status: "Draft",
      lines: [
        { accountCode: debit.uacs!, accountTitle: debit.title, department: "Accounting Unit", debit: amount, credit: 0, remarks: String(rule.code) },
        { accountCode: credit.uacs!, accountTitle: credit.title, department: "Accounting Unit", debit: 0, credit: amount, remarks: String(rule.code) },
      ],
      createdBy: user,
      createdAt: nowIso(),
    } satisfies JournalEntry;
  });
  db.journalEntries.unshift(...entries);
  if (entries.length) logActivity("Generated Auto Journal Entries", `${entries.length} draft entries`);
  return entries;
}

export function registerRecordHandlers(r: Router) {
  r.on("POST", "double-entry/auto-journal/generate", (req) => {
    const entries = generateFromRules(req.user);
    return { data: { generated: entries.length, entries: entries.map((e) => ({ id: e.id, transactionNo: e.transactionNo })) } };
  });

  r.on("GET", ":module/:tab", (req) => {
    const resource = resourceOf(req);
    const rows = db.records[resource];
    const p = listParams(req);
    return paginate(applyQuery(rows, p, { dateKey: dateKeyOf(rows) }), p, rows);
  });

  r.on("GET", ":module/:tab/summary", (req) => {
    const resource = resourceOf(req);
    return { data: SUMMARIES[resource]?.(db.records[resource]) ?? { count: db.records[resource].length } };
  });

  /** Every row matching the filters (no pagination), for Export to Excel. */
  r.on("GET", ":module/:tab/export", (req) => {
    const resource = resourceOf(req);
    const rows = db.records[resource];
    return { data: applyQuery(rows, listParams(req), { dateKey: dateKeyOf(rows) }) };
  });

  r.on("GET", ":module/:tab/:id", (req) => {
    const resource = resourceOf(req);
    const row = findRow(resource, req.params.id);
    return { data: row, history: db.history[`${resource}::${row.id}`] ?? [] };
  });

  r.on("POST", ":module/:tab", (req) => {
    const resource = resourceOf(req);
    const values = validateForm(resource, body<Record<string, string>>(req));
    const row: MockRow = { ...values, id: nextId("record", resource.replace("/", "-")) };
    db.records[resource].unshift(row);
    pushHistory(resource, row.id, { at: nowIso(), action: "create", from: null, to: String(row.status ?? "Created"), by: req.user });
    return created({ data: row });
  });

  r.on("PATCH", ":module/:tab/:id", (req) => {
    const resource = resourceOf(req);
    const row = findRow(resource, req.params.id);
    const values = validateForm(resource, body<Record<string, string>>(req), row);
    const before = String(row.status ?? "");
    Object.assign(row, values);
    pushHistory(resource, row.id, { at: nowIso(), action: "edit", from: before || null, to: String(row.status ?? ""), by: req.user });
    return { data: row };
  });

  r.on("DELETE", ":module/:tab/:id", (req) => {
    const resource = resourceOf(req);
    const row = findRow(resource, req.params.id);
    const action = findAction(resource, "delete");
    if (!action || !action.from.includes(String(row.status))) throw conflict(`A ${row.status} record cannot be deleted.`);
    db.records[resource] = db.records[resource].filter((x) => x.id !== row.id);
    return noContent();
  });

  r.on("POST", ":module/:tab/:id/:action", (req) => {
    const resource = resourceOf(req);
    const row = findRow(resource, req.params.id);
    const action = findAction(resource, req.params.action);
    if (!action || action.key === "delete") throw new MockHttpError(404, { code: "not_found", detail: "Unknown action." });
    const from = String(row.status);
    if (!action.from.includes(from)) throw conflict(`“${action.label}” is not allowed for a record that is ${from}.`);
    const { remarks } = body<TransitionBody>(req);
    if (action.remarks && !remarks?.trim()) throw validationError({ remarks: "Enter the reason" });
    row.status = action.to;
    pushHistory(resource, row.id, { at: nowIso(), action: action.key, from, to: action.to, by: req.user, remarks: remarks?.trim() || undefined });
    onTransition(resource, row, action.key, req.user);
    return { data: row };
  });
}
