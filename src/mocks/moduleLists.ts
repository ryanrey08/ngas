import type { Row } from "@/features/modules/types";
import { seededRandom } from "./delay";

/**
 * Mock rows for the list screens of every eNGAS module, keyed by "<module>/<tab>".
 * Kept separate from services/UI; a real backend would serve these per endpoint.
 */

const FUNDS = ["101 - General Fund", "164 - Income Fund", "161 - Trust Fund", "199 - Donation Fund"];
const DEPTS = ["Administrative Services", "Finance Office", "Accounting Unit", "Academic Affairs", "Research & Extension"];
const AGENCIES = ["CHED", "LGU Marikina", "DOST – TAPI", "Makati DepEd", "Other Government Agency"];
const SUPPLIERS = ["Meralco", "PLDT Inc.", "DBM – PS", "Canon Marketing Philippines", "Akari Corporation"];

function series(n: number, seed: number, make: (i: number, r: () => number, pick: <T>(a: readonly T[]) => T) => Row): Row[] {
  const r = seededRandom(seed);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  return Array.from({ length: n }, (_, i) => make(i, r, pick));
}

const day = (i: number, month = 11) => `2026-${String(month).padStart(2, "0")}-${String(Math.max(1, 30 - i * 2)).padStart(2, "0")}`;
const money = (r: () => number, base: number) => Math.round(base * (0.2 + r() * 1.8) / 100) * 100;

const BOOK_PARTICULARS = {
  crj: ["Collection of Tuition Fees – 2nd Sem", "Receipt – Dormitory Fees", "Receipts – Laboratory Fees", "Collection – Miscellaneous Income (ID, Cert., etc.)", "Reimbursement from Training", "Cash Donation – Alumni Association", "Refund of Excess Payment", "Collection – Facility Rental", "Receipts – Training Fees (Short Course)", "Collection – Application Fees"],
  cdj: ["Payment to Meralco – Oct 2026", "Advancement – Office Supplies", "Travel Expense – Seminar", "Procurement – IT Supplies", "Petty Cash Replenishment", "Payment of Janitorial Services", "Payment of Security Services", "Payment of Water Bill"],
  ckdj: ["Payment to supplier (Check No. 0012456)", "Payment – Laboratory Equipment", "Payment – Printing Services", "Payment – Construction Progress Billing", "Payment – ICT Equipment"],
  gj: ["Recognition of utility expense", "Reclassification of expense account", "Depreciation – October 2026", "Adjustment for accrued expenses", "Recognition of prepaid insurance", "Closing of nominal accounts"],
};

function book(prefix: string, kind: keyof typeof BOOK_PARTICULARS, seed: number, ref: string): Row[] {
  return series(14, seed, (i, r, pick) => ({
    no: `${prefix}-2026-${String(125 - i).padStart(6, "0")}`,
    date: day(i),
    ref: `${ref}-${String(9876 - i).padStart(7, "0")}`,
    particulars: BOOK_PARTICULARS[kind][i % BOOK_PARTICULARS[kind].length],
    fund: pick(FUNDS),
    amount: kind === "crj" && i === 6 ? -5000 : money(r, kind === "ckdj" ? 120000 : 60000),
    status: i === 4 ? "Unposted" : "Posted",
  }));
}

export const MODULE_LISTS: Record<string, Row[]> = {
  // ── Double Entry ───────────────────────────────────────────
  "double-entry/auto-journal": [
    { code: "AJ-AP-001", rule: "AP – Accrual of Expenses", source: "Accounts Payable (AP)", trigger: "Upon invoice validation", treatment: "Debit Expense / Credit Accounts Payable", status: "Active" },
    { code: "AJ-AR-001", rule: "AR – Recognition of Income (Accrual)", source: "Accounts Receivable (AR)", trigger: "Upon billing", treatment: "Debit Receivable / Credit Income", status: "Active" },
    { code: "AJ-CM-001", rule: "Interest Income Accrual", source: "Cash Management (CM)", trigger: "Month-end", treatment: "Debit Interest Receivable / Credit Interest Income", status: "Active" },
    { code: "AJ-INV-001", rule: "Inventory to Expense (Consumption)", source: "Inventory (SIMS)", trigger: "Upon RIS issuance", treatment: "Debit Supplies Expense / Credit Inventory", status: "Active" },
    { code: "AJ-DEP-001", rule: "Depreciation of Property and Equipment", source: "Asset Management", trigger: "Month-end", treatment: "Debit Depreciation / Credit Accumulated Depreciation", status: "Active" },
    { code: "AJ-PAY-001", rule: "Payroll Accrual", source: "Payroll", trigger: "Payroll approval", treatment: "Debit Salaries / Credit Due to Employees", status: "Inactive" },
  ],
  "double-entry/templates": [
    { code: "TMPL-AP-001", name: "AP – Accrual of Expenses", category: "Accounts Payable", source: "Accounts Payable (AP)", description: "Record accrued expenses upon receipt of bill.", status: "Active" },
    { code: "TMPL-AR-001", name: "AR – Recognition of Income", category: "Accounts Receivable", source: "Accounts Receivable (AR)", description: "Recognize income when service is rendered.", status: "Active" },
    { code: "TMPL-CM-001", name: "Interest Income Accrual", category: "Cash Management", source: "Cash Management (CM)", description: "Accrue interest income for the period.", status: "Active" },
    { code: "TMPL-INV-001", name: "Inventory to Expense (Consumption)", category: "Inventory", source: "Inventory (SIMS)", description: "Record inventory consumption to expense.", status: "Active" },
    { code: "TMPL-DEP-001", name: "Depreciation of Property and Equipment", category: "Depreciation", source: "Property & Equipment", description: "Record monthly depreciation expense.", status: "Active" },
    { code: "TMPL-PPE-001", name: "Acquisition of Equipment", category: "Property & Equipment", source: "Property & Equipment", description: "Capitalize newly acquired equipment.", status: "Active" },
    { code: "TMPL-OTH-001", name: "Reclassification Entry", category: "Others", source: "General Journal", description: "Correct misclassified accounts.", status: "Inactive" },
  ],

  // ── Accrual System ─────────────────────────────────────────
  "accrual/adjusting": series(9, 11, (i, r, pick) => ({
    no: `ADJ-2026-${String(48 - i).padStart(4, "0")}`, date: day(i, 10), type: pick(["Accrual", "Deferral", "Estimate", "Correction"]),
    description: pick(["Accrual of utilities – Oct 2026", "Adjustment of prepaid insurance", "Allowance for impairment", "Correction of misposted expense", "Accrual of interest income"]),
    department: pick(DEPTS), amount: money(r, 30000), status: i < 2 ? "Draft" : "Posted",
  })),
  "accrual/accrued-expenses": series(9, 12, (i, r, pick) => ({
    no: `AE-2026-${String(42 - i).padStart(4, "0")}`, date: day(i, 10), expenseType: pick(["Utilities Expense", "Professional Services", "Repairs and Maintenance", "Communication Expense"]),
    description: pick(["Electricity – Meralco (Oct 2026)", "Internet – PLDT (Oct 2026)", "Janitorial services – Oct 2026", "Security services – Oct 2026"]),
    reference: `BS-${123456 - i}`, amount: money(r, 15000), status: i === 0 ? "Draft" : "Posted",
  })),
  "accrual/accrued-revenues": series(8, 13, (i, r, pick) => ({
    no: `AR-ACC-2026-${String(30 - i).padStart(4, "0")}`, date: day(i, 10), revenueType: pick(["Interest Income", "Rental Income", "Tuition Fees", "Service Income"]),
    customer: pick(AGENCIES), amount: money(r, 40000), status: i < 1 ? "Draft" : "Posted",
  })),
  "accrual/amortization": series(7, 14, (i, r, pick) => {
    const total = money(r, 240000);
    const months = pick([12, 24, 36]);
    const done = Math.min(months, 3 + i);
    return {
      no: `AMT-2026-${String(20 - i).padStart(4, "0")}`, asset: pick(["Prepaid Insurance", "Software License", "Prepaid Rent", "Prepaid Subscription"]),
      start: `2026-${String(1 + i).padStart(2, "0")}-01`, months, monthly: Math.round(total / months), amortized: Math.round((total / months) * done), balance: total - Math.round((total / months) * done), status: "Active",
    };
  }),
  "accrual/deferral": [
    { no: "DF-2026-0009", period: "Oct 31, 2026", type: "Prepaid Expense", account: "Prepaid Insurance", amount: 10000, cumulative: 10000, remaining: 110000, status: "Posted" },
    { no: "DF-2026-0009", period: "Nov 30, 2026", type: "Prepaid Expense", account: "Prepaid Insurance", amount: 10000, cumulative: 20000, remaining: 100000, status: "Current" },
    { no: "DF-2026-0009", period: "Dec 31, 2026", type: "Prepaid Expense", account: "Prepaid Insurance", amount: 10000, cumulative: 30000, remaining: 90000, status: "Scheduled" },
    { no: "DF-2026-0009", period: "Jan 31, 2027", type: "Prepaid Expense", account: "Prepaid Insurance", amount: 10000, cumulative: 40000, remaining: 80000, status: "Scheduled" },
    { no: "DF-2026-0007", period: "Oct 31, 2026", type: "Unearned Revenue", account: "Unearned Revenue – Rent", amount: 25000, cumulative: 75000, remaining: 225000, status: "Posted" },
    { no: "DF-2026-0007", period: "Nov 30, 2026", type: "Unearned Revenue", account: "Unearned Revenue – Rent", amount: 25000, cumulative: 100000, remaining: 200000, status: "Current" },
  ],
  "accrual/inquiry": series(12, 15, (i, r, pick) => ({
    no: `ACR-2026-${String(37 - i).padStart(4, "0")}`, date: day(i, 10), type: pick(["Accrued Expense", "Accrued Revenue", "Prepaid Expense", "Unearned Revenue"]),
    description: pick(["Accrual of utilities expense (Meralco)", "Accrual of rental income", "Prepaid insurance recognition", "Unearned tuition fees"]),
    department: pick(DEPTS), amount: money(r, 25000), status: pick(["Posted", "Posted", "Draft", "Reversed"]),
  })),

  // ── Revised COA ────────────────────────────────────────────
  "coa/groups": [
    { code: "AG-01", name: "Current Assets", cls: "Asset", description: "Assets realizable within one (1) year.", status: "Active" },
    { code: "AG-02", name: "Non-Current Assets", cls: "Asset", description: "Assets with useful life of more than one (1) year.", status: "Active" },
    { code: "AG-03", name: "Current Liabilities", cls: "Liability", description: "Obligations due within one (1) year.", status: "Active" },
    { code: "AG-04", name: "Non-Current Liabilities", cls: "Liability", description: "Obligations due beyond one (1) year.", status: "Active" },
    { code: "AG-05", name: "Equity", cls: "Equity", description: "Government equity and accumulated results.", status: "Active" },
    { code: "AG-06", name: "Revenues", cls: "Income", description: "Increases in net assets from operations.", status: "Active" },
    { code: "AG-07", name: "Expenses", cls: "Expense", description: "Decreases in net assets from operations.", status: "Active" },
    { code: "AG-08", name: "Other Income", cls: "Income", description: "Income not arising from regular operations.", status: "Active" },
    { code: "AG-09", name: "Other Expenses", cls: "Expense", description: "Expenses not arising from regular operations.", status: "Active" },
    { code: "AG-10", name: "Contra Accounts", cls: "Contra", description: "Offsetting accounts (e.g., allowance, depreciation).", status: "Active" },
  ],
  "coa/classes": [
    { code: "1", name: "ASSETS", statement: "Balance Sheet", normal: "Debit", groups: 2, status: "Active" },
    { code: "2", name: "LIABILITIES", statement: "Balance Sheet", normal: "Credit", groups: 2, status: "Active" },
    { code: "3", name: "EQUITY", statement: "Balance Sheet", normal: "Credit", groups: 1, status: "Active" },
    { code: "4", name: "REVENUES", statement: "Income Statement", normal: "Credit", groups: 1, status: "Active" },
    { code: "5", name: "EXPENSES", statement: "Income Statement", normal: "Debit", groups: 1, status: "Active" },
    { code: "6", name: "OTHER INCOME (EXPENSES)", statement: "Income Statement", normal: "Credit", groups: 2, status: "Active" },
    { code: "7", name: "CONTRA ACCOUNTS", statement: "Balance Sheet", normal: "Credit", groups: 1, status: "Active" },
  ],
  "coa/types": [
    { code: "AT-01", name: "Balance Sheet", description: "Presented in the Statement of Financial Position.", accounts: 642, status: "Active" },
    { code: "AT-02", name: "Income Statement", description: "Presented in the Statement of Financial Performance.", accounts: 518, status: "Active" },
    { code: "AT-03", name: "Memorandum", description: "Off-balance sheet / memorandum accounts.", accounts: 48, status: "Active" },
    { code: "AT-04", name: "Budgetary", description: "Budgetary accounts for appropriation control.", accounts: 40, status: "Inactive" },
  ],
  "coa/mapping": series(10, 16, (i, _r, pick) => {
    const pairs = [["101", "1010101000", "Cash – Collecting Officers"], ["104", "1010102000", "Petty Cash"], ["111", "1010202024", "Cash in Bank – LBP"], ["121", "1030101000", "Accounts Receivable"], ["155", "1040401000", "Office Supplies Inventory"], ["211", "1060401000", "Buildings"], ["401", "2010101000", "Accounts Payable"], ["412", "2020101000", "Due to BIR"], ["628", "4020201000", "School Fees"], ["755", "5020301000", "Office Supplies Expense"]];
    const p = pairs[i];
    return { legacy: p[0], legacyTitle: p[2], rca: p[1], rcaTitle: p[2], mappedBy: pick(["Odee Paco", "Ana Dela Cruz"]), status: i === 7 ? "Pending" : "Active" };
  }),
  "coa/history": series(10, 17, (i, _r, pick) => ({
    date: `${day(i, 10)} 10:${String(10 + i).padStart(2, "0")} AM`, code: pick(["1.01.07", "1.01.02", "5.03", "2.01.03", "4.01"]),
    action: pick(["Created", "Updated", "Deactivated", "Updated"]), field: pick(["Account Title", "Status", "Account Group", "Normal Balance", "—"]),
    user: pick(["Odee Paco", "Ana Dela Cruz", "Jose Reyes"]), remarks: pick(["Per COA Circular 2026-001", "Correction of title", "New sub-account", "Reclassification"]),
  })),

  // ── Journals & Books ───────────────────────────────────────
  "journals/crj": book("CRJ", "crj", 21, "OR"),
  "journals/cdj": book("CDJ", "cdj", 22, "DV"),
  "journals/ckdj": book("CkDJ", "ckdj", 23, "CHK"),
  "journals/gj": book("GJ", "gj", 24, "JEV"),
  "journals/gl": (() => {
    let bal = 125_000_000;
    return series(14, 25, (i, r, pick) => {
      const dr = i % 3 === 0 ? 0 : money(r, 80000);
      const cr = i % 3 === 0 ? money(r, 60000) : 0;
      bal = bal + dr - cr;
      return { date: day(13 - i), ref: pick(["CRJ", "CDJ", "GJ", "CkDJ"]) + `-2026-${String(200 + i).padStart(4, "0")}`, account: "1010202024 – Cash in Bank – LBP", particulars: pick(BOOK_PARTICULARS.crj), debit: dr, credit: cr, balance: bal };
    });
  })(),
  "journals/sl": series(12, 26, (i, r, pick) => {
    const charges = money(r, 120000);
    const pays = Math.round(charges * (0.3 + r() * 0.7));
    return { code: `SL-${String(1001 + i)}`, name: pick([...AGENCIES, ...SUPPLIERS]), account: pick(["Accounts Receivable", "Accounts Payable – Suppliers", "Due to BIR"]), beginning: money(r, 50000), debit: charges, credit: pays, ending: charges - pays };
  }),

  // ── Cash Managements ───────────────────────────────────────
  "cash/transactions": (() => {
    let bal = 125_450_000;
    return series(16, 31, (i, r, pick) => {
      const receipt = i % 2 === 0;
      const amt = receipt ? money(r, 100000) : -money(r, 60000);
      const row = { no: `CM-2026-${String(1245 - i).padStart(6, "0")}`, date: day(i), type: receipt ? "Receipt" : "Disbursement", particulars: receipt ? pick(BOOK_PARTICULARS.crj) : pick(BOOK_PARTICULARS.cdj), fund: pick(FUNDS), amount: amt, balance: bal, status: "Posted" };
      bal -= amt;
      return row;
    });
  })(),
  "cash/receipts": book("OR", "crj", 32, "OR"),
  "cash/disbursements": book("DV", "cdj", 33, "DV"),
  "cash/bank-reconciliation": [
    { account: "LBP – 0012-3456-78 (101 - General Fund)", period: "October 2026", book: 104_700_000, bank: 105_230_500, outstanding: -620_000, deposits: 89_500, adjusted: 104_700_000, status: "Reconciled" },
    { account: "LBP – 0012-3456-79 (164 - Income Fund)", period: "October 2026", book: 12_410_250, bank: 12_398_750, outstanding: 0, deposits: 11_500, adjusted: 12_410_250, status: "Reconciled" },
    { account: "DBP – 0456-7890-12 (161 - Trust Fund)", period: "October 2026", book: 5_250_000, bank: 5_262_400, outstanding: -12_400, deposits: 0, adjusted: 5_250_000, status: "Reconciled" },
    { account: "LBP – 0012-3456-78 (101 - General Fund)", period: "November 2026", book: 104_712_000, bank: 104_801_500, outstanding: -150_000, deposits: 45_000, adjusted: 104_696_500, status: "Unreconciled" },
  ],
  "cash/petty-cash": series(10, 34, (i, r, pick) => ({
    no: `PCV-2026-${String(214 - i).padStart(4, "0")}`, date: day(i), payee: pick(["Juan Dela Cruz", "Maria Santos", "Pedro Reyes", "Ana Lim"]),
    purpose: pick(["Purchase of office supplies", "Transportation – document delivery", "Meals – overtime work", "Photocopying services", "Minor repairs"]),
    custodian: "Liza Mendoza", amount: money(r, 1500), status: i < 2 ? "Pending" : "Posted",
  })),
  "cash/cash-position": [
    { fund: "101 - General Fund", bank: "LBP – 0012-3456-78", beginning: 98_250_000, receipts: 18_900_000, disbursements: 12_450_000, ending: 104_700_000 },
    { fund: "164 - Income Fund", bank: "LBP – 0012-3456-79", beginning: 9_800_000, receipts: 4_950_000, disbursements: 2_339_750, ending: 12_410_250 },
    { fund: "161 - Trust Fund", bank: "DBP – 0456-7890-12", beginning: 4_100_000, receipts: 1_350_000, disbursements: 200_000, ending: 5_250_000 },
    { fund: "199 - Donation Fund", bank: "LBP – 0012-3456-80", beginning: 2_050_000, receipts: 100_000, disbursements: 50_000, ending: 2_100_000 },
  ],
  "cash/direct-tracking": series(10, 35, (i, r, pick) => {
    const type = pick(["NCA", "TRA", "NTA"]);
    return { no: `${type}-2026-${String(800 + i)}`, date: day(i), type, description: type === "NCA" ? "Notice of Cash Allocation – MDS" : type === "TRA" ? "Tax Remittance Advice – BIR" : "Notice of Transfer of Allocation", fund: pick(FUNDS), amount: money(r, 2_000_000), status: pick(["Received", "Utilized", "Posted"]) };
  }),

  // ── Accounts Receivables ───────────────────────────────────
  "receivables/receivables": [
    { no: "AR-2026-0102", customer: "CHED", particulars: "Training Fee – Q4", billing: "2026-10-05", due: "2026-11-05", amount: 1_200_000, collected: 800_000, balance: 400_000, aging: "31 – 60 days", status: "Partially Paid" },
    { no: "AR-2026-0103", customer: "LGU Marikina", particulars: "Facility Rental – Oct 2026", billing: "2026-10-10", due: "2026-11-10", amount: 500_000, collected: 500_000, balance: 0, aging: "Current", status: "Fully Paid" },
    { no: "AR-2026-0104", customer: "DOST – TAPI", particulars: "Project Implementation", billing: "2026-10-15", due: "2026-11-15", amount: 2_000_000, collected: 1_000_000, balance: 1_000_000, aging: "61 – 90 days", status: "Partially Paid" },
    { no: "AR-2026-0105", customer: "Makati DepEd", particulars: "LMS Subscription – SY 2026", billing: "2026-10-20", due: "2026-11-20", amount: 750_000, collected: 0, balance: 750_000, aging: "Over 90 days", status: "Overdue" },
    { no: "AR-2026-0106", customer: "Other Government Agency", particulars: "Training & Resource Fee", billing: "2026-10-25", due: "2026-11-25", amount: 310_000, collected: 0, balance: 310_000, aging: "31 – 60 days", status: "Outstanding" },
    { no: "AR-2026-0107", customer: "CHED", particulars: "Scholarship Administration Fee", billing: "2026-11-02", due: "2026-12-02", amount: 420_000, collected: 0, balance: 420_000, aging: "Current", status: "Outstanding" },
  ],
  "receivables/collections": [
    { no: "COL-2026-0112", or: "OR-002256", customer: "CHED", particulars: "Training Fee – Q4", date: "2026-11-05", amount: 800_000, mode: "Bank Transfer", deposit: "DEP-2026-0458", status: "Posted" },
    { no: "COL-2026-0113", or: "OR-002257", customer: "LGU Marikina", particulars: "Facility Rental – Oct 2026", date: "2026-11-10", amount: 500_000, mode: "Cash", deposit: "DEP-2026-0459", status: "Posted" },
    { no: "COL-2026-0114", or: "OR-002258", customer: "DOST – TAPI", particulars: "Project Implementation", date: "2026-11-15", amount: 1_000_000, mode: "Check", deposit: "DEP-2026-0460", status: "Posted" },
    { no: "COL-2026-0115", or: "OR-002259", customer: "Makati DepEd", particulars: "LMS Subscription – SY 2026", date: "2026-11-20", amount: 750_000, mode: "Online Payment", deposit: "DEP-2026-0461", status: "Posted" },
    { no: "COL-2026-0116", or: "OR-002260", customer: "Other Government Agency", particulars: "Training & Resource Fee", date: "2026-11-25", amount: 310_000, mode: "Cash", deposit: "DEP-2026-0462", status: "For Deposit" },
  ],
  "receivables/adjustments": series(6, 41, (i, r, pick) => ({
    no: `ADJ-AR-2026-${String(20 - i).padStart(4, "0")}`, date: day(i), customer: pick(AGENCIES), type: pick(["Discount", "Write-off", "Billing Correction", "Credit Memo"]),
    reason: pick(["Early payment discount", "Uncollectible per Board Resolution", "Wrong billing amount", "Returned service fee"]), amount: money(r, 20000), status: i === 0 ? "For Approval" : "Posted",
  })),
  "receivables/aging": [
    { customer: "CHED", current: 420_000, d30: 400_000, d60: 0, d90: 0, total: 820_000 },
    { customer: "LGU Marikina", current: 0, d30: 0, d60: 0, d90: 0, total: 0 },
    { customer: "DOST – TAPI", current: 0, d30: 0, d60: 1_000_000, d90: 0, total: 1_000_000 },
    { customer: "Makati DepEd", current: 0, d30: 0, d60: 0, d90: 750_000, total: 750_000 },
    { customer: "Other Government Agency", current: 0, d30: 310_000, d60: 0, d90: 0, total: 310_000 },
  ],
  "receivables/reports": [
    { code: "AR-RPT-01", name: "Schedule of Accounts Receivable", category: "Receivables", frequency: "Monthly", last: "2026-11-05", status: "Ready" },
    { code: "AR-RPT-02", name: "Aging of Accounts Receivable (FAR No. 4)", category: "Receivables", frequency: "Monthly", last: "2026-11-05", status: "Ready" },
    { code: "AR-RPT-03", name: "Report of Collections and Deposits (RCD)", category: "Collections", frequency: "Daily", last: "2026-11-09", status: "Ready" },
    { code: "AR-RPT-04", name: "Official Receipts Issued Register", category: "Collections", frequency: "Monthly", last: "2026-11-01", status: "Processing" },
  ],

  // ── Accounts Payables ──────────────────────────────────────
  "payables/suppliers": [
    { code: "SUP-0001", name: "Meralco", tin: "000-101-528-000", category: "Utilities", terms: "Due on receipt", balance: 1_250_000, status: "Active" },
    { code: "SUP-0002", name: "PLDT Inc.", tin: "000-488-793-000", category: "Communication", terms: "Net 15", balance: 980_000, status: "Active" },
    { code: "SUP-0003", name: "DBM – PS", tin: "000-758-823-000", category: "Supplies", terms: "Net 30", balance: 2_500_000, status: "Active" },
    { code: "SUP-0004", name: "Canon Marketing Philippines", tin: "000-456-789-000", category: "Equipment", terms: "Net 30", balance: 650_000, status: "Active" },
    { code: "SUP-0005", name: "Akari Corporation", tin: "000-321-654-000", category: "Equipment", terms: "Net 30", balance: 320_000, status: "Active" },
    { code: "SUP-0006", name: "Golden Catering Services", tin: "000-222-333-000", category: "Services", terms: "Net 15", balance: 0, status: "Inactive" },
  ],
  "payables/invoices": [
    { no: "INV-002348", supplier: "Meralco", date: "2026-11-05", particulars: "Electricity Bill – Oct 2026", amount: 250_000, wht: 5_000, net: 245_000, due: "2026-11-20", status: "Posted" },
    { no: "INV-009817", supplier: "PLDT Inc.", date: "2026-11-08", particulars: "Internet Service – Nov 2026", amount: 180_000, wht: 3_600, net: 176_400, due: "2026-11-23", status: "Posted" },
    { no: "INV-000559", supplier: "DBM – PS", date: "2026-11-12", particulars: "Office Supplies", amount: 500_000, wht: 25_000, net: 475_000, due: "2026-12-12", status: "Posted" },
    { no: "INV-011234", supplier: "Canon Marketing Philippines", date: "2026-11-15", particulars: "Printer Consumables", amount: 150_000, wht: 7_500, net: 142_500, due: "2026-12-15", status: "For Approval" },
    { no: "INV-003210", supplier: "Akari Corporation", date: "2026-11-20", particulars: "Office Equipment", amount: 320_000, wht: 16_000, net: 304_000, due: "2026-12-20", status: "Draft" },
  ],
  "payables/disbursements": [
    { no: "DV-2026-0217", payee: "PLDT Inc.", date: "2026-11-25", particulars: "Internet Service – Oct 2026", gross: 120_000, wht: 2_400, net: 117_600, mode: "LDDAP-ADA", status: "Released" },
    { no: "DV-2026-0216", payee: "Meralco", date: "2026-11-20", particulars: "Electricity Bill – Sep 2026", gross: 240_000, wht: 4_800, net: 235_200, mode: "LDDAP-ADA", status: "Released" },
    { no: "DV-2026-0215", payee: "Canon Marketing Philippines", date: "2026-11-18", particulars: "Printer Consumables", gross: 150_000, wht: 7_500, net: 142_500, mode: "Check", status: "For Approval" },
    { no: "DV-2026-0214", payee: "DBM – PS", date: "2026-11-12", particulars: "Office Supplies", gross: 500_000, wht: 25_000, net: 475_000, mode: "Check", status: "Released" },
    { no: "DV-2026-0213", payee: "Akari Corporation", date: "2026-11-08", particulars: "Office Equipment", gross: 320_000, wht: 16_000, net: 304_000, mode: "LDDAP-ADA", status: "Draft" },
  ],
  "payables/withholding-tax": series(8, 51, (i, r, pick) => {
    const base = money(r, 250000);
    const rate = pick([1, 2, 5]);
    return { no: `WT-2026-${String(31 - i).padStart(4, "0")}`, supplier: pick(SUPPLIERS), date: day(i), form: pick(["2307", "1601-EQ", "0619-E"]), base, rate, tax: Math.round((base * rate) / 100), status: i < 2 ? "Pending" : "Posted" };
  }),
  "payables/aging": [
    { supplier: "Meralco", total: 1_250_000, current: 750_000, d30: 250_000, d60: 150_000, d90: 100_000 },
    { supplier: "PLDT Inc.", total: 980_000, current: 500_000, d30: 180_000, d60: 150_000, d90: 150_000 },
    { supplier: "DBM – PS", total: 2_500_000, current: 1_500_000, d30: 500_000, d60: 300_000, d90: 200_000 },
    { supplier: "Canon Marketing Philippines", total: 650_000, current: 400_000, d30: 150_000, d60: 50_000, d90: 50_000 },
    { supplier: "Akari Corporation", total: 320_000, current: 180_000, d30: 140_000, d60: 0, d90: 0 },
  ],
  "payables/reports": [
    { code: "AP-RPT-01", name: "AP Registry Report", category: "Accounts Payable Reports", frequency: "Monthly", last: "2026-11-30", status: "Ready" },
    { code: "AP-RPT-02", name: "AP Summary by Supplier", category: "Accounts Payable Reports", frequency: "Monthly", last: "2026-11-30", status: "Ready" },
    { code: "AP-RPT-03", name: "AP Aging Report", category: "Aging Reports", frequency: "Monthly", last: "2026-11-30", status: "Ready" },
    { code: "AP-RPT-04", name: "Disbursement (Check) Register", category: "Disbursement Reports", frequency: "Monthly", last: "2026-11-28", status: "Ready" },
    { code: "AP-RPT-05", name: "BIR Form 2307 (Certificate)", category: "BIR Reports", frequency: "Quarterly", last: "2026-10-15", status: "Ready" },
    { code: "AP-RPT-06", name: "Alphalist (DAT)", category: "BIR Reports", frequency: "Annual", last: "2026-01-31", status: "Processing" },
  ],

  // ── Financial Reports ──────────────────────────────────────
  "financial-reports/categories": [
    { category: "Financial Statements", reports: 8, description: "Statements of Financial Position, Performance, Cash Flows and Changes in Net Assets.", updated: "2026-11-30" },
    { category: "Budgetary Reports", reports: 7, description: "FAR No. 1 – 6 and budget utilization reports.", updated: "2026-11-30" },
    { category: "Cash Management", reports: 5, description: "Cash position, RCD and bank reconciliation reports.", updated: "2026-11-28" },
    { category: "Receivables & Payables", reports: 6, description: "Aging, schedules and registries for AR/AP.", updated: "2026-11-25" },
    { category: "Trial Balances", reports: 4, description: "Pre-closing and post-closing trial balances.", updated: "2026-11-30" },
    { category: "Audit & Compliance", reports: 4, description: "Audit trail and COA compliance reports.", updated: "2026-11-20" },
  ],
  "financial-reports/templates": [
    { code: "TPL-FR-001", name: "Balance Sheet – Standard", report: "Balance Sheet", format: "PDF / Excel", signatories: "Accountant, Director", status: "Active" },
    { code: "TPL-FR-002", name: "SFPerf – Comparative", report: "Statement of Financial Performance", format: "PDF / Excel", signatories: "Accountant, Director", status: "Active" },
    { code: "TPL-FR-003", name: "Trial Balance – Per Fund", report: "Trial Balance", format: "Excel", signatories: "Accountant", status: "Active" },
    { code: "TPL-FR-004", name: "FAR No. 1 – Agency Format", report: "FAR No. 1", format: "PDF", signatories: "Budget Officer, Accountant", status: "Active" },
  ],
  "financial-reports/scheduled": [
    { name: "Trial Balance (Pre-Closing)", frequency: "Monthly – 5th working day", next: "2026-12-07", recipients: "accounting@agency.gov.ph", format: "Excel", status: "Active" },
    { name: "Statement of Financial Position", frequency: "Quarterly", next: "2027-01-15", recipients: "director@agency.gov.ph", format: "PDF", status: "Active" },
    { name: "Report of Collections and Deposits", frequency: "Daily – 5:00 PM", next: "2026-11-10", recipients: "cashier@agency.gov.ph", format: "PDF", status: "Active" },
    { name: "AP Aging Report", frequency: "Weekly – Monday", next: "2026-11-16", recipients: "accounting@agency.gov.ph", format: "Excel", status: "Inactive" },
  ],

  // ── References & Setup ─────────────────────────────────────
  "setup/funds": [
    { code: "101", name: "General Fund", bank: "LBP – 0012-3456-78", source: "Regular Agency Fund (GAA)", status: "Active" },
    { code: "161", name: "Trust Fund", bank: "DBP – 0456-7890-12", source: "Trust Receipts", status: "Active" },
    { code: "164", name: "Income Fund", bank: "LBP – 0012-3456-79", source: "Internally Generated Income", status: "Active" },
    { code: "199", name: "Donation Fund", bank: "LBP – 0012-3456-80", source: "Grants and Donations", status: "Active" },
  ],
  "setup/departments": [
    { code: "ADM", name: "Administrative Services", head: "Dir. Ramon Bautista", projects: 2, status: "Active" },
    { code: "FIN", name: "Finance Office", head: "Liza Mendoza", projects: 1, status: "Active" },
    { code: "ACC", name: "Accounting Unit", head: "Maria Santos", projects: 0, status: "Active" },
    { code: "ACA", name: "Academic Affairs", head: "Dr. Ana Dela Cruz", projects: 4, status: "Active" },
    { code: "REX", name: "Research & Extension", head: "Dr. Carlo Villanueva", projects: 6, status: "Active" },
    { code: "STS", name: "Student Services", head: "Grace Navarro", projects: 1, status: "Active" },
  ],
};
