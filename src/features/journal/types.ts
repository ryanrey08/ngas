export const JOURNAL_TYPES = [
  "General Journal (GJ)",
  "Cash Receipts (CRJ)",
  "Cash Disbursements (CDJ)",
  "Check Disbursements (CkDJ)",
] as const;

export const ACCRUAL_TYPES = ["Accrued Expense", "Accrued Revenue", "Prepaid Expense", "Unearned Revenue"] as const;

export const DEPARTMENTS = [
  "Administrative Services",
  "Finance Office",
  "Accounting Unit",
  "Academic Affairs",
  "Research & Extension",
  "Student Services",
] as const;

export const PROJECT_CODES = ["PRJ-2026-001 – Campus ICT Upgrade", "PRJ-2026-002 – Laboratory Equipment", "PRJ-2026-003 – Extension Program"] as const;

export type JournalKind = "double-entry" | "accrual";
export type EntryStatus = "Draft" | "Posted" | "Reversed";

export interface JournalLine {
  accountCode: string;
  accountTitle: string;
  department: string;
  debit: number;
  credit: number;
  remarks: string;
}

export interface JournalEntry {
  id: string;
  kind: JournalKind;
  transactionNo: string;
  date: string; // yyyy-mm-dd
  /** Journal type (double entry) or accrual type (accrual) */
  journalType: string;
  referenceNo: string;
  description: string;
  department: string;
  projectCode: string;
  status: EntryStatus;
  lines: JournalLine[];
  createdBy: string;
  createdAt: string;
  postedBy?: string;
  postedAt?: string;
}

export type JournalEntryInput = Omit<JournalEntry, "id" | "transactionNo" | "createdBy" | "createdAt" | "postedBy" | "postedAt">;

export const entryTotal = (e: Pick<JournalEntry, "lines">) => e.lines.reduce((s, l) => s + l.debit, 0);
