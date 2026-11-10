export const ACCOUNT_CLASSIFICATIONS = ["Asset", "Liability", "Equity", "Income", "Expense"] as const;
export type AccountClassification = (typeof ACCOUNT_CLASSIFICATIONS)[number];

export interface Account {
  id: string;
  code: string;
  title: string;
  classification: AccountClassification;
  accountType: "Balance Sheet" | "Income Statement";
  parentCode: string | null;
  level: number;
  normalBalance: "Debit" | "Credit";
  status: "Active" | "Inactive";
  description: string;
  /** Leaf accounts can be used in journal lines */
  postable: boolean;
  /** UACS object code used in journal lines */
  uacs?: string;
}

export type AccountInput = Omit<Account, "id" | "level">;
