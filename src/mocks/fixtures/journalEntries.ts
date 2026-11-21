import type { JournalEntry, JournalLine } from "@/features/journal/types";

function line(accountCode: string, accountTitle: string, department: string, debit: number, credit: number, remarks: string): JournalLine {
  return { accountCode, accountTitle, department, debit, credit, remarks };
}

type Seed = [no: string, date: string, type: string, ref: string, desc: string, dept: string, amount: number, dr: [string, string], cr: [string, string], status?: JournalEntry["status"]];

const SEEDS: Seed[] = [
  ["GJ-2026-1048", "2026-10-28", "General Journal (GJ)", "RV-2026-0154", "Recognition of utility expense (Meralco) for October 2026.", "Administrative Services", 10000, ["5020402000", "Utilities Expense – Electricity"], ["1010202024", "Cash in Bank – LBP"]],
  ["CDJ-2026-0389", "2026-10-27", "Cash Disbursements (CDJ)", "DV-2026-0389", "Payment of office supplies to ABC Office Depot.", "Administrative Services", 25500, ["5020301000", "Office Supplies Expense"], ["1010202024", "Cash in Bank – LBP"]],
  ["CRJ-2026-0275", "2026-10-27", "Cash Receipts (CRJ)", "OR-2026-56431", "Collection of student fees (OR No. 2026-56431).", "Finance Office", 150000, ["1010101000", "Cash – Collecting Officers"], ["4020201000", "School Fees"]],
  ["GJ-2026-1047", "2026-10-26", "General Journal (GJ)", "JV-2026-0311", "Reclassification of expense account.", "Accounting Unit", 5000, ["5020503000", "Internet Subscription Expense"], ["5020301000", "Office Supplies Expense"]],
  ["CkDJ-2026-0126", "2026-10-25", "Check Disbursements (CkDJ)", "CHK-0012456", "Payment to supplier (Check No. 0012456).", "Administrative Services", 75000, ["2010101000", "Accounts Payable – Suppliers"], ["1010202024", "Cash in Bank – LBP"]],
  ["CRJ-2026-0274", "2026-10-24", "Cash Receipts (CRJ)", "OR-2026-56420", "Collection of laboratory fees.", "Finance Office", 60000, ["1010101000", "Cash – Collecting Officers"], ["4020201000", "School Fees"]],
  ["CDJ-2026-0388", "2026-10-23", "Cash Disbursements (CDJ)", "DV-2026-0388", "Payment of internet subscription – PLDT Inc.", "Administrative Services", 18500, ["5020503000", "Internet Subscription Expense"], ["1010202024", "Cash in Bank – LBP"]],
  ["GJ-2026-1046", "2026-10-22", "General Journal (GJ)", "JV-2026-0309", "Depreciation of ICT equipment – October 2026.", "Accounting Unit", 42300, ["5050105003", "Depreciation – ICT Equipment"], ["1060503100", "Accumulated Depreciation – ICT Equipment"]],
  ["CRJ-2026-0273", "2026-10-21", "Cash Receipts (CRJ)", "OR-2026-56411", "Income from rental of facilities.", "Finance Office", 40000, ["1010101000", "Cash – Collecting Officers"], ["4020211000", "Rent / Lease Income"]],
  ["CkDJ-2026-0125", "2026-10-20", "Check Disbursements (CkDJ)", "CHK-0012451", "Payment to Canon Marketing Philippines – printer consumables.", "Academic Affairs", 142500, ["2010101000", "Accounts Payable – Suppliers"], ["1010202024", "Cash in Bank – LBP"]],
  ["GJ-2026-1045", "2026-10-18", "General Journal (GJ)", "JV-2026-0305", "Accrual of salaries – 2nd half of October.", "Administrative Services", 1250000, ["5010101001", "Salaries and Wages – Regular"], ["2990101000", "Accrued Expenses – Utilities"], "Reversed"],
  ["CDJ-2026-0387", "2026-10-16", "Cash Disbursements (CDJ)", "DV-2026-0387", "Training and seminar expenses – Research & Extension.", "Research & Extension", 32750, ["5020301000", "Office Supplies Expense"], ["1010202024", "Cash in Bank – LBP"]],
  ["CRJ-2026-0272", "2026-10-15", "Cash Receipts (CRJ)", "OR-2026-56398", "Collection – application fees.", "Student Services", 10500, ["1010101000", "Cash – Collecting Officers"], ["4020201000", "School Fees"]],
  ["GJ-2026-1044", "2026-10-12", "General Journal (GJ)", "JV-2026-0301", "Interest income earned on time deposit.", "Finance Office", 8650, ["1010202024", "Cash in Bank – LBP"], ["4020501000", "Interest Income"]],
  ["CkDJ-2026-0124", "2026-10-10", "Check Disbursements (CkDJ)", "CHK-0012440", "Payment to DBM – PS for office equipment.", "Administrative Services", 500000, ["2010101000", "Accounts Payable – Suppliers"], ["1010202024", "Cash in Bank – LBP"]],
  ["CDJ-2026-0386", "2026-10-08", "Cash Disbursements (CDJ)", "DV-2026-0386", "Petty cash replenishment.", "Finance Office", 10000, ["1010102000", "Petty Cash"], ["1010202024", "Cash in Bank – LBP"]],
  ["CRJ-2026-0271", "2026-10-06", "Cash Receipts (CRJ)", "OR-2026-56377", "Collection of tuition fees – 2nd semester.", "Finance Office", 250000, ["1010101000", "Cash – Collecting Officers"], ["4020201000", "School Fees"]],
  ["GJ-2026-1043", "2026-10-03", "General Journal (GJ)", "JV-2026-0298", "Recognition of prepaid insurance expense.", "Accounting Unit", 10000, ["5021503000", "Insurance Expense"], ["1990103000", "Prepaid Insurance"]],
];

export const MOCK_JOURNAL_ENTRIES: JournalEntry[] = SEEDS.map(([no, date, type, ref, desc, dept, amount, dr, cr, status], i) => ({
  id: `je-${1048 - i}`,
  kind: "double-entry",
  transactionNo: no,
  date,
  journalType: type,
  referenceNo: ref,
  description: desc,
  department: dept,
  projectCode: "",
  status: status ?? "Posted",
  lines: [line(dr[0], dr[1], dept, amount, 0, desc.slice(0, 48)), line(cr[0], cr[1], dept, 0, amount, desc.slice(0, 48))],
  createdBy: "Odee Paco",
  createdAt: `${date}T02:24:00Z`,
  postedBy: "Odee Paco",
  postedAt: `${date}T02:45:00Z`,
}));
