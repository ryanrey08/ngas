import type { Account } from "@/features/coa/types";

type Seed = [code: string, title: string, cls: Account["classification"], postable: boolean, uacs?: string, desc?: string];

const SEEDS: Seed[] = [
  ["1", "ASSETS", "Asset", false],
  ["1.01", "Current Assets", "Asset", false],
  ["1.01.01", "Cash", "Asset", false, undefined, "Cash on hand and in cash collections, including petty cash and other cash equivalents."],
  ["1.01.01.01", "Cash – Collecting Officers", "Asset", true, "1010101000"],
  ["1.01.01.02", "Petty Cash", "Asset", true, "1010102000"],
  ["1.01.02", "Cash in Bank – LBP", "Asset", true, "1010202024", "Cash in bank – local currency, Land Bank of the Philippines."],
  ["1.01.03", "Short-Term Investments", "Asset", true, "1010401000"],
  ["1.01.04", "Accounts Receivable", "Asset", true, "1030101000", "Amounts due from customers, students and other agencies."],
  ["1.01.05", "Inventories", "Asset", true, "1040401000"],
  ["1.01.06", "Prepaid Insurance", "Asset", true, "1990103000"],
  ["1.02", "Non-Current Assets", "Asset", false],
  ["1.02.01", "Buildings", "Asset", true, "1060401000"],
  ["1.02.02", "ICT Equipment", "Asset", true, "1060503000"],
  ["1.02.03", "Accumulated Depreciation – ICT Equipment", "Asset", true, "1060503100"],
  ["2", "LIABILITIES", "Liability", false],
  ["2.01", "Current Liabilities", "Liability", false],
  ["2.01.01", "Accounts Payable – Suppliers", "Liability", true, "2010101000"],
  ["2.01.02", "Due to BIR", "Liability", true, "2020101000"],
  ["2.01.03", "Accrued Expenses – Utilities", "Liability", true, "2990101000"],
  ["2.01.04", "Unearned Revenue", "Liability", true, "2040101000"],
  ["3", "EQUITY", "Equity", false],
  ["3.01", "Accumulated Surplus / (Deficit)", "Equity", true, "3010101000"],
  ["4", "REVENUES", "Income", false],
  ["4.01", "School Fees", "Income", true, "4020201000"],
  ["4.02", "Rent / Lease Income", "Income", true, "4020211000"],
  ["4.03", "Interest Income", "Income", true, "4020501000"],
  ["5", "EXPENSES", "Expense", false],
  ["5.01", "Salaries and Wages – Regular", "Expense", true, "5010101001"],
  ["5.02", "Office Supplies Expense", "Expense", true, "5020301000"],
  ["5.03", "Utilities Expense – Electricity", "Expense", true, "5020402000"],
  ["5.04", "Internet Subscription Expense", "Expense", true, "5020503000"],
  ["5.05", "Insurance Expense", "Expense", true, "5021503000"],
  ["5.06", "Depreciation – ICT Equipment", "Expense", true, "5050105003"],
  ["6", "OTHER INCOME (EXPENSES)", "Income", false],
];

export const MOCK_ACCOUNTS: Account[] = SEEDS.map(([code, title, cls, postable, uacs, desc], i) => {
  const parts = code.split(".");
  const isBS = cls === "Asset" || cls === "Liability" || cls === "Equity";
  const normalDebit = cls === "Asset" || cls === "Expense";
  return {
    id: `acc-${i + 1}`,
    code,
    title,
    classification: cls,
    accountType: isBS ? "Balance Sheet" : "Income Statement",
    parentCode: parts.length > 1 ? parts.slice(0, -1).join(".") : null,
    level: parts.length,
    normalBalance: title.startsWith("Accumulated Depreciation") ? "Credit" : normalDebit ? "Debit" : "Credit",
    status: "Active",
    description: desc ?? `${title} account under the Revised Chart of Accounts.`,
    postable,
    uacs,
  };
});
