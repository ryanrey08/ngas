export type ReportCategory =
  | "Financial Statements"
  | "Budgetary Reports"
  | "Cash Management"
  | "Receivables & Payables"
  | "Trial Balances"
  | "Audit & Compliance";

export interface ReportDef {
  code: string;
  name: string;
  description: string;
  category: ReportCategory;
  formats: Array<"PDF" | "Excel">;
}

export interface GeneratedReportLine {
  label: string;
  amount?: number;
  level: 0 | 1 | 2;
  total?: boolean;
}
