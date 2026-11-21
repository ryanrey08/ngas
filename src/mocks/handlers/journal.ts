import type { Account, AccountInput } from "@/features/coa/types";
import { entryTotal, type JournalEntry, type JournalEntryInput } from "@/features/journal/types";
import { bookOfJournalType } from "@/services/api/apiTags";
import { db, logActivity, nextId, nowIso, pushHistory, todayIso, type MockRow } from "../database/db";
import { applyQuery, body, conflict, created, listParams, notFound, paginate, validationError, type Router } from "./http";

const PREFIX: Record<string, string> = {
  "General Journal (GJ)": "GJ",
  "Cash Receipts (CRJ)": "CRJ",
  "Cash Disbursements (CDJ)": "CDJ",
  "Check Disbursements (CkDJ)": "CkDJ",
};

function transactionNo(kind: JournalEntry["kind"], journalType: string, date: string) {
  const prefix = kind === "accrual" ? "ACR" : (PREFIX[journalType] ?? "GJ");
  return `${prefix}-${date.slice(0, 4)}-${String(db.seq.journal++).padStart(4, "0")}`;
}

const findEntry = (id: string) => {
  const e = db.journalEntries.find((x) => x.id === id);
  if (!e) throw notFound("journal entry");
  return e;
};

/** Server-side validation, mirroring the form's zod schema plus rules only the server can check. */
function validateEntry(input: Partial<JournalEntryInput>) {
  const errors: Record<string, string> = {};
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = "Select a date";
  if (!input.journalType) errors.journalType = "Select a type";
  if (!input.referenceNo?.trim()) errors.referenceNo = "Reference no. is required";
  if (!input.description || input.description.trim().length < 5) errors.description = "Enter a description (min. 5 characters)";
  if (!input.department) errors.department = "Select a department";
  const lines = input.lines ?? [];
  if (lines.length < 2) errors.lines = "A journal entry needs at least two lines";
  const postable = new Set(db.accounts.filter((a) => a.postable && a.status === "Active").map((a) => a.uacs));
  lines.forEach((l, i) => {
    if (!postable.has(l.accountCode)) errors[`lines.${i}.accountCode`] = "Account is not active or not postable";
    if ((l.debit > 0) === (l.credit > 0)) errors[`lines.${i}.debit`] = "Enter either a debit or a credit";
  });
  const dup = db.journalEntries.some((e) => e.referenceNo.toLowerCase() === input.referenceNo?.trim().toLowerCase() && e.journalType === input.journalType && e.status !== "Reversed");
  if (input.referenceNo && dup) errors.referenceNo = `Reference no. ${input.referenceNo} is already used for this journal type`;
  if (Object.keys(errors).length) throw validationError(errors);
}

function assertBalanced(lines: JournalEntry["lines"]) {
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  if (debit <= 0 || Math.abs(debit - credit) > 0.005) {
    throw validationError({ lines: "Entry is not balanced: total debits must equal total credits before posting." });
  }
}

/** A posted entry is also recorded in its book of original entry (and accruals in the accrual register). */
function recordInBooks(e: JournalEntry) {
  const amount = entryTotal(e);
  if (e.kind === "accrual") {
    db.records["accrual/inquiry"].unshift({ id: `accrual-inquiry-${e.id}`, no: e.transactionNo, date: e.date, type: e.journalType, description: e.description, department: e.department, amount, status: e.status });
    return;
  }
  const book = bookOfJournalType(e.journalType);
  if (!book || e.status !== "Posted") return;
  const row: MockRow = { id: `${book.replace("/", "-")}-${e.id}`, no: e.transactionNo, date: e.date, ref: e.referenceNo, particulars: e.description, fund: "101 - General Fund", amount, status: "Posted" };
  db.records[book].unshift(row);
  const gl = db.records["journals/gl"];
  const cash = e.lines.find((l) => l.accountCode === "1010202024");
  if (cash) {
    const last = Number(gl.at(-1)?.balance ?? 0);
    gl.push({ id: `journals-gl-${e.id}`, date: e.date, ref: e.transactionNo, account: "1010202024 – Cash in Bank – LBP", particulars: e.description, debit: cash.debit, credit: cash.credit, balance: last + cash.debit - cash.credit });
  }
}

function syncAccrualRegister(e: JournalEntry) {
  const row = db.records["accrual/inquiry"].find((r) => r.no === e.transactionNo);
  if (row) row.status = e.status;
}

export function registerJournalHandlers(r: Router) {
  r.on("GET", "journal-entries", (req) => {
    const p = listParams(req);
    const kind = p.filters?.kind;
    const rows = applyQuery(
      db.journalEntries.filter((e) => !kind || e.kind === kind),
      { ...p, filters: { ...p.filters, kind: undefined } },
      { searchKeys: ["transactionNo", "referenceNo", "description"], dateKey: "date", filterKeys: { journal_type: "journalType" } },
    );
    return paginate(rows, p);
  });

  r.on("GET", "journal-entries/:id", (req) => ({ data: findEntry(req.params.id) }));

  r.on("POST", "journal-entries", (req) => {
    const input = body<JournalEntryInput>(req);
    validateEntry(input);
    const titleOf = (code: string) => db.accounts.find((a) => a.uacs === code)?.title ?? "";
    const lines = input.lines.map((l) => ({ ...l, accountTitle: l.accountTitle || titleOf(l.accountCode) }));
    if (input.status === "Posted") assertBalanced(lines);
    const now = nowIso();
    const entry: JournalEntry = {
      ...input,
      lines,
      referenceNo: input.referenceNo.trim(),
      description: input.description.trim(),
      id: nextId("journal", "je"),
      transactionNo: transactionNo(input.kind, input.journalType, input.date),
      createdBy: req.user,
      createdAt: now,
      ...(input.status === "Posted" ? { postedBy: req.user, postedAt: now } : {}),
    };
    db.journalEntries.unshift(entry);
    recordInBooks(entry);
    logActivity(entry.status === "Posted" ? "Posted Journal Entry" : "Saved Journal Entry Draft", `No. ${entry.transactionNo}`);
    return created({ data: entry });
  });

  r.on("POST", "journal-entries/:id/post", (req) => {
    const e = findEntry(req.params.id);
    if (e.status !== "Draft") throw conflict(`Only draft entries can be posted (${e.transactionNo} is ${e.status}).`);
    assertBalanced(e.lines);
    Object.assign(e, { status: "Posted", postedBy: req.user, postedAt: nowIso() });
    recordInBooks(e);
    syncAccrualRegister(e);
    logActivity("Posted Journal Entry", `No. ${e.transactionNo}`);
    return { data: e };
  });

  /** Reversal: the original is flagged "Reversed" and a posted contra entry is created. */
  r.on("POST", "journal-entries/:id/reverse", (req) => {
    const e = findEntry(req.params.id);
    if (e.status !== "Posted") throw conflict(`Only posted entries can be reversed (${e.transactionNo} is ${e.status}).`);
    e.status = "Reversed";
    syncAccrualRegister(e);
    const now = nowIso();
    const contra: JournalEntry = {
      ...e,
      id: nextId("journal", "je"),
      transactionNo: transactionNo(e.kind, e.journalType, todayIso()),
      date: todayIso(),
      referenceNo: `REV-${e.transactionNo}`,
      description: `Reversal of ${e.transactionNo}: ${e.description}`.slice(0, 255),
      status: "Posted",
      lines: e.lines.map((l) => ({ ...l, debit: l.credit, credit: l.debit, remarks: `Reversal of ${e.transactionNo}` })),
      createdBy: req.user,
      createdAt: now,
      postedBy: req.user,
      postedAt: now,
    };
    db.journalEntries.unshift(contra);
    recordInBooks(contra);
    logActivity("Reversed Journal Entry", `No. ${e.transactionNo} → ${contra.transactionNo}`);
    return { data: e };
  });
}

// ── Chart of accounts ─────────────────────────────────────────────────────────

const byCode = (a: Account, b: Account) => a.code.localeCompare(b.code, undefined, { numeric: true });

function validateAccount(input: Partial<AccountInput>, editing?: Account) {
  const errors: Record<string, string> = {};
  if (!editing) {
    if (!input.code || !/^\d+(\.\d{2})*$/.test(input.code)) errors.code = "Use the RCA format, e.g. 1.01.07";
    else if (db.accounts.some((a) => a.code === input.code)) errors.code = `Account code ${input.code} already exists.`;
    if (input.parentCode && !db.accounts.some((a) => a.code === input.parentCode && !a.postable)) errors.parentCode = "Parent must be an existing header account";
    if (input.code && input.parentCode && !input.code.startsWith(`${input.parentCode}.`)) errors.code = `Code must start with the parent code ${input.parentCode}.`;
  }
  if (!input.title || input.title.trim().length < 3) errors.title = "Account title is required";
  if (input.uacs && !/^\d{10}$/.test(input.uacs)) errors.uacs = "UACS code must be 10 digits";
  if (input.uacs && db.accounts.some((a) => a.uacs === input.uacs && a.id !== editing?.id)) errors.uacs = `UACS code ${input.uacs} is already assigned.`;
  if (Object.keys(errors).length) throw validationError(errors);
}

function audit(code: string, action: string, field: string, user: string, remarks: string) {
  const d = new Date();
  const at = `${todayIso()} ${d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`;
  db.records["coa/history"].unshift({ id: nextId("record", "coa-history"), date: at, code, action, field, user, remarks });
}

export function registerCoaHandlers(r: Router) {
  r.on("GET", "coa/accounts", (req) => {
    const p = listParams(req);
    const rows = applyQuery(db.accounts, p, {
      searchKeys: ["code", "title", "uacs"],
      filterKeys: { classification: "classification", account_type: "accountType" },
    });
    return { data: [...rows].sort(byCode) };
  });

  r.on("GET", "coa/accounts/:id", (req) => {
    const a = db.accounts.find((x) => x.id === req.params.id);
    if (!a) throw notFound("account");
    return { data: { ...a, children: db.accounts.filter((x) => x.parentCode === a.code).length } };
  });

  r.on("POST", "coa/accounts", (req) => {
    const input = body<AccountInput>(req);
    validateAccount(input);
    const account: Account = { ...input, title: input.title.trim(), id: nextId("account", "acc"), level: input.code.split(".").length };
    db.accounts.push(account);
    db.accounts.sort(byCode);
    audit(account.code, "Created", "—", req.user, "New account");
    logActivity("Created Account", `${account.code} – ${account.title}`);
    return created({ data: account });
  });

  r.on("PATCH", "coa/accounts/:id", (req) => {
    const a = db.accounts.find((x) => x.id === req.params.id);
    if (!a) throw notFound("account");
    const patch = body<Partial<AccountInput>>(req);
    const next = { ...a, ...patch, code: a.code, parentCode: a.parentCode };
    validateAccount(next, a);
    const labels: Record<string, string> = { title: "Account Title", status: "Status", classification: "Account Class", accountType: "Account Type", normalBalance: "Normal Balance", uacs: "UACS Code", postable: "Allow Posting", description: "Description" };
    const changed = Object.keys(labels).filter((k) => String(a[k as keyof Account] ?? "") !== String(next[k as keyof Account] ?? ""));
    Object.assign(a, next);
    if (changed.length) {
      audit(a.code, changed.includes("status") && a.status === "Inactive" ? "Deactivated" : "Updated", changed.map((k) => labels[k]).join(", "), req.user, "Edited from Chart of Accounts");
      pushHistory("coa/accounts", a.id, { at: nowIso(), action: "update", from: null, to: a.status, by: req.user, remarks: changed.join(", ") });
    }
    return { data: a };
  });
}
