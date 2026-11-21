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
  /** Starred by the current user (returned by the catalog endpoint). */
  favorite?: boolean;
}

export interface GeneratedReportLine {
  label: string;
  amount?: number;
  debit?: number;
  credit?: number;
  level: 0 | 1 | 2;
  total?: boolean;
}

export interface ReportCatalog {
  reports: ReportDef[];
  recent: Array<{ name: string; at: string }>;
}

/** `POST /financial-reports/{code}/generate` response. */
export interface GeneratedReport {
  code: string;
  name: string;
  period: string;
  fiscalYear: string;
  generatedAt: string;
  columns: string[];
  lines: GeneratedReportLine[];
  /** True when the figures are illustrative sample data. */
  sample?: boolean;
}
