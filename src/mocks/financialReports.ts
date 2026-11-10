import type { GeneratedReportLine, ReportDef } from "@/features/financial-reports/types";

export const MOCK_REPORT_DEFS: ReportDef[] = [
  { code: "FR-001", name: "Balance Sheet", description: "Shows the financial position of the agency as of the reporting date.", category: "Financial Statements", formats: ["PDF", "Excel"] },
  { code: "FR-002", name: "Statement of Financial Position", description: "Detailed assets, liabilities and equity statement.", category: "Financial Statements", formats: ["PDF", "Excel"] },
  { code: "FR-003", name: "Statement of Financial Performance", description: "Shows the agency's income and expenses for the period.", category: "Financial Statements", formats: ["PDF", "Excel"] },
  { code: "FR-004", name: "Cash Flow Statement", description: "Tracks cash inflows and outflows for the period.", category: "Financial Statements", formats: ["PDF", "Excel"] },
  { code: "FR-005", name: "Statement of Changes in Net Assets", description: "Shows changes in net assets/equity for the period.", category: "Financial Statements", formats: ["PDF", "Excel"] },
  { code: "FR-006", name: "Budget Utilization Report", description: "Comparison of actual vs. budget utilization.", category: "Budgetary Reports", formats: ["PDF", "Excel"] },
  { code: "FR-007", name: "Trial Balance", description: "Lists all accounts with debit and credit balances.", category: "Trial Balances", formats: ["PDF", "Excel"] },
  { code: "FR-008", name: "FAR No. 1 – Statement of Allotments", description: "Shows allotments and obligations by agency.", category: "Budgetary Reports", formats: ["PDF", "Excel"] },
  { code: "FR-009", name: "FAR No. 2 – Statement of Obligations", description: "Details obligations, payments and balances.", category: "Budgetary Reports", formats: ["PDF", "Excel"] },
  { code: "FR-010", name: "FAR No. 3 – Aging of Accounts Payable", description: "Shows aging of accounts payable by supplier.", category: "Receivables & Payables", formats: ["PDF", "Excel"] },
  { code: "FR-011", name: "FAR No. 4 – Statement of Receivables", description: "Shows aging of accounts receivable by customer.", category: "Receivables & Payables", formats: ["PDF", "Excel"] },
  { code: "FR-012", name: "BIR Form 2307 Summary", description: "Summary of taxes withheld and remitted.", category: "Audit & Compliance", formats: ["PDF", "Excel"] },
  { code: "FR-013", name: "Report of Collections and Deposits", description: "Daily collections and deposits by collecting officer.", category: "Cash Management", formats: ["PDF"] },
  { code: "FR-014", name: "Cash Position Report", description: "Cash balances per fund and depository account.", category: "Cash Management", formats: ["PDF", "Excel"] },
];

export const MOCK_RECENT_REPORTS = [
  { name: "Balance Sheet", at: "2026-11-30T02:24:00Z" },
  { name: "Statement of Financial Performance", at: "2026-11-30T01:48:00Z" },
  { name: "Cash Flow Statement", at: "2026-11-29T06:12:00Z" },
  { name: "FAR No. 1 – Allotments", at: "2026-11-29T04:30:00Z" },
  { name: "BIR Form 2307 Summary", at: "2026-11-28T03:15:00Z" },
];

/** Sample rendered content for the report preview. */
export const SAMPLE_BALANCE_SHEET: GeneratedReportLine[] = [
  { label: "ASSETS", level: 0 },
  { label: "Current Assets", level: 1 },
  { label: "Cash and Cash Equivalents", amount: 124_460_250, level: 2 },
  { label: "Receivables", amount: 3_280_000, level: 2 },
  { label: "Inventories", amount: 2_145_600, level: 2 },
  { label: "Prepayments", amount: 110_000, level: 2 },
  { label: "Total Current Assets", amount: 129_995_850, level: 1, total: true },
  { label: "Non-Current Assets", level: 1 },
  { label: "Property, Plant and Equipment (net)", amount: 286_450_000, level: 2 },
  { label: "Total Assets", amount: 416_445_850, level: 0, total: true },
  { label: "LIABILITIES", level: 0 },
  { label: "Accounts Payable", amount: 12_450_000, level: 2 },
  { label: "Inter-Agency Payables", amount: 1_870_400, level: 2 },
  { label: "Trust Liabilities", amount: 5_250_000, level: 2 },
  { label: "Total Liabilities", amount: 19_570_400, level: 0, total: true },
  { label: "NET ASSETS / EQUITY", level: 0 },
  { label: "Accumulated Surplus", amount: 396_875_450, level: 2 },
  { label: "Total Liabilities and Net Assets / Equity", amount: 416_445_850, level: 0, total: true },
];
