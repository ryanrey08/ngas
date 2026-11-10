import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeDollarSign,
  BookOpen,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CalendarRange,
  ChartColumn,
  ChartPie,
  ClipboardList,
  Coins,
  FileBarChart2,
  FileCheck2,
  FilePen,
  FileSearch,
  FileSpreadsheet,
  FileStack,
  FileText,
  FolderTree,
  GitCompareArrows,
  HandCoins,
  History,
  Landmark,
  Layers,
  LayoutList,
  ListChecks,
  ListTree,
  NotebookTabs,
  Percent,
  PiggyBank,
  Receipt,
  ReceiptText,
  Scale,
  ScrollText,
  Settings,
  Shapes,
  SlidersHorizontal,
  Timer,
  Truck,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/types";

/** Header buttons a tab can show (wired up in `TabActions`). */
export type TabAction =
  | "back"
  | "saveDraft"
  | "post"
  | "cancel"
  | "exportExcel"
  | "print"
  | "new"
  | "generate";

export interface ModuleTab {
  slug: string;
  /** Label in the tab bar and sidebar */
  label: string;
  /** Page title (defaults to label) */
  title?: string;
  description: string;
  icon: LucideIcon;
  actions?: TabAction[];
  /** Label for the "new" action, e.g. "New Account" */
  newLabel?: string;
}

export interface ModuleDef {
  key: string;
  label: string;
  basePath: string;
  icon: LucideIcon;
  /** Short summary used on the Home hub */
  summary: string;
  /** Bullet list used on the Home hub */
  features: string[];
  permission: Permission;
  tabs: ModuleTab[];
}

const LIST: TabAction[] = ["back", "exportExcel", "print"];
const ENTRY: TabAction[] = ["back", "saveDraft", "post", "cancel"];

export const MODULES: ModuleDef[] = [
  {
    key: "double-entry",
    label: "Double Entry",
    basePath: "/double-entry",
    icon: Layers,
    summary: "Record and maintain transactions using the double-entry system.",
    features: [],
    permission: "transactions:view",
    tabs: [
      { slug: "entry", label: "Transaction Entry", title: "Double Entry", description: "Record and maintain financial transactions using the double-entry system.", icon: FilePen, actions: ENTRY },
      { slug: "posted", label: "Posted Entries", description: "View and manage journal entries that have been posted to the books.", icon: FileCheck2, actions: LIST },
      { slug: "inquiry", label: "Journal Inquiry", description: "Search and view journal entries with their accounting details, status, and posting information.", icon: FileSearch, actions: LIST },
      { slug: "auto-journal", label: "Auto Journal", description: "Automatically generate accounting entries based on predefined rules and transactions.", icon: Workflow, actions: ["back", "generate", "print"] },
      { slug: "templates", label: "Templates", title: "Journal Templates", description: "Manage reusable journal templates for recurring transactions.", icon: FileStack, actions: ["back", "new", "exportExcel"], newLabel: "New Template" },
    ],
  },
  {
    key: "accrual",
    label: "Accrual System",
    basePath: "/accrual",
    icon: CalendarClock,
    summary: "Apply accrual accounting for complete and accurate reporting.",
    features: [],
    permission: "transactions:view",
    tabs: [
      { slug: "entry", label: "Accrual Entry", title: "Accrual System", description: "Recognize revenues and expenses in the period they are incurred, regardless of cash movement.", icon: FilePen, actions: ENTRY },
      { slug: "adjusting", label: "Adjusting Entries", description: "Record period-end adjusting entries for accruals, deferrals and estimates.", icon: SlidersHorizontal, actions: LIST },
      { slug: "accrued-expenses", label: "Accrued Expenses", description: "Record and manage expenses incurred during the period but not yet paid as of the reporting date.", icon: Receipt, actions: LIST },
      { slug: "accrued-revenues", label: "Accrued Revenues", description: "Record revenues earned during the period but not yet collected.", icon: HandCoins, actions: LIST },
      { slug: "amortization", label: "Amortization", description: "Schedule and monitor amortization of prepaid expenses and intangible assets.", icon: Timer, actions: LIST },
      { slug: "deferral", label: "Deferral", description: "Record and manage deferrals of expenses or revenues and systematically recognize them over time.", icon: CalendarRange, actions: LIST },
      { slug: "inquiry", label: "Accrual Inquiry", description: "Search accrual transactions and review their posting status.", icon: FileSearch, actions: LIST },
    ],
  },
  {
    key: "coa",
    label: "Revised COA (RCA)",
    basePath: "/coa",
    icon: BookOpen,
    summary: "Maintain the COA Revised Chart of Accounts.",
    features: [],
    permission: "transactions:view",
    tabs: [
      { slug: "accounts", label: "Chart of Accounts", title: "Revised Chart of Accounts (RCA)", description: "Maintain the Revised Chart of Accounts in accordance with COA government accounting standards.", icon: ListTree, actions: ["exportExcel", "print", "new"], newLabel: "New Account" },
      { slug: "groups", label: "Account Groups", description: "Define and manage account groupings under the Revised Chart of Accounts (RCA) for classification, reporting, and control.", icon: FolderTree, actions: ["exportExcel", "print"] },
      { slug: "classes", label: "Account Classes", description: "Manage account classes under the RCA to classify accounts by financial statement element.", icon: Landmark, actions: ["exportExcel", "print"] },
      { slug: "types", label: "Account Types", description: "Maintain account types used to determine financial statement presentation.", icon: Shapes, actions: ["exportExcel", "print"] },
      { slug: "mapping", label: "COA Mapping", description: "Map legacy account codes to the Revised Chart of Accounts.", icon: GitCompareArrows, actions: ["exportExcel", "print"] },
      { slug: "history", label: "History / Audit Trail", description: "Track all changes made to the chart of accounts.", icon: History, actions: ["exportExcel", "print"] },
    ],
  },
  {
    key: "journals",
    label: "Journals & Books",
    basePath: "/journals",
    icon: NotebookTabs,
    summary: "Maintain the journal records and subsidiary books of accounts.",
    features: ["Cash Receipts (CRJ)", "Cash Disbursements Journal (CDJ)", "Check Disbursements Journal (CkDJ)", "General Journal (GJ)", "General Ledger (GL)", "Subsidiary Ledger (SL)"],
    permission: "transactions:view",
    tabs: [
      { slug: "crj", label: "Cash Receipts Journal (CRJ)", title: "Journals & Books", description: "Maintain and manage the journal records and subsidiary books of accounts in compliance with NGAS and COA requirements.", icon: ArrowDownToLine, actions: ["exportExcel", "print"] },
      { slug: "cdj", label: "Cash Disbursements Journal (CDJ)", title: "Journals & Books", description: "Maintain and manage the journal records and subsidiary books of accounts in compliance with NGAS and COA requirements.", icon: ArrowUpFromLine, actions: ["exportExcel", "print"] },
      { slug: "ckdj", label: "Check Disbursements Journal (CkDJ)", title: "Journals & Books", description: "Maintain and manage the journal records and subsidiary books of accounts in compliance with NGAS and COA requirements.", icon: ReceiptText, actions: ["exportExcel", "print"] },
      { slug: "gj", label: "General Journal (GJ)", title: "Journals & Books", description: "Maintain and manage the journal records and subsidiary books of accounts in compliance with NGAS and COA requirements.", icon: ScrollText, actions: ["exportExcel", "print"] },
      { slug: "gl", label: "General Ledger (GL)", title: "Journals & Books", description: "Maintain and manage the journal records and subsidiary books of accounts in compliance with NGAS and COA requirements.", icon: BookOpenCheck, actions: ["exportExcel", "print"] },
      { slug: "sl", label: "Subsidiary Ledger (SL)", title: "Journals & Books", description: "Maintain and manage the journal records and subsidiary books of accounts in compliance with NGAS and COA requirements.", icon: LayoutList, actions: ["exportExcel", "print"] },
    ],
  },
  {
    key: "cash",
    label: "Cash Managements",
    basePath: "/cash",
    icon: Wallet,
    summary: "Manage receipts, disbursements, bank accounts and cash position.",
    features: ["Cash Receipts", "Cash Disbursements", "Bank Reconciliation", "Petty Cash", "Cash Position Monitoring", "Direct Tracking (NCA / TRA / NTA)"],
    permission: "transactions:view",
    tabs: [
      { slug: "transactions", label: "Cash Transactions", title: "Cash Managements", description: "Manage and monitor government cash resources including receipts, disbursements, bank accounts, reconciliations, petty cash, and cash position.", icon: Coins, actions: ["exportExcel", "print"] },
      { slug: "receipts", label: "Receipts", title: "Cash Receipts", description: "Record and monitor cash and check receipts.", icon: ArrowDownToLine, actions: LIST },
      { slug: "disbursements", label: "Disbursements", title: "Cash Disbursements", description: "Record and monitor cash disbursements and payments.", icon: ArrowUpFromLine, actions: LIST },
      { slug: "bank-reconciliation", label: "Bank Reconciliation", description: "Reconcile book balances with bank statements.", icon: Scale, actions: LIST },
      { slug: "petty-cash", label: "Petty Cash", description: "Manage petty cash funds, vouchers and replenishments.", icon: PiggyBank, actions: LIST },
      { slug: "cash-position", label: "Cash Position", title: "Cash Position Monitoring", description: "Monitor the cash position across funds and bank accounts.", icon: ChartColumn, actions: LIST },
      { slug: "direct-tracking", label: "Direct Tracking", title: "Direct Tracking (NCA / TRA / NTA)", description: "Track Notices of Cash Allocation, Tax Remittance Advices and Notices of Transfer of Allocation.", icon: ClipboardList, actions: LIST },
    ],
  },
  {
    key: "receivables",
    label: "Accounts Receivables",
    basePath: "/receivables",
    icon: BadgeDollarSign,
    summary: "Manage receivables, collections and aging.",
    features: ["Advance Monitoring and Management", "Aging Report", "Official Receipt Recording"],
    permission: "transactions:view",
    tabs: [
      { slug: "overview", label: "Overview", title: "Collections", description: "Record, monitor, and manage collections for accounts receivable, including OR issuance, allocation, and reconciliation.", icon: ChartPie, actions: ["exportExcel", "print"] },
      { slug: "receivables", label: "Receivables", description: "Maintain and manage agency receivables, monitor collections, and track outstanding balances.", icon: FileText, actions: LIST },
      { slug: "collections", label: "Collections", title: "Collection Entries", description: "Record collections and issue official receipts.", icon: HandCoins, actions: LIST },
      { slug: "adjustments", label: "Adjustments", description: "Record write-offs, discounts and other receivable adjustments.", icon: SlidersHorizontal, actions: LIST },
      { slug: "aging", label: "Aging", title: "Receivables Aging", description: "Analyze outstanding receivables by age bracket.", icon: Timer, actions: LIST },
      { slug: "reports", label: "Reports", title: "Receivable Reports", description: "Generate statutory and management reports for receivables.", icon: FileBarChart2, actions: LIST },
    ],
  },
  {
    key: "payables",
    label: "Accounts Payables",
    basePath: "/payables",
    icon: Receipt,
    summary: "Manage supplier obligations, invoices and disbursements.",
    features: ["Supplier Management", "Disbursement Voucher Processing", "Payment Scheduling", "Check Preparation", "Withholding Tax Monitoring", "Accounts Payable Aging"],
    permission: "transactions:view",
    tabs: [
      { slug: "overview", label: "Overview", title: "Accounts Payables", description: "Manage supplier obligations, invoices, disbursements, and withholding tax, with complete monitoring and aging.", icon: ChartPie, actions: ["exportExcel", "print"] },
      { slug: "suppliers", label: "Supplier Management", description: "Maintain supplier profiles, TINs and payment terms.", icon: Truck, actions: LIST },
      { slug: "invoices", label: "Invoices (AP)", title: "AP Invoices", description: "Record and validate supplier invoices and billings.", icon: FileText, actions: LIST },
      { slug: "disbursements", label: "Disbursements", title: "Disbursement Vouchers", description: "Process disbursement vouchers and payment releases.", icon: ArrowUpFromLine, actions: LIST },
      { slug: "withholding-tax", label: "Withholding Tax", description: "Monitor taxes withheld and BIR remittances.", icon: Percent, actions: LIST },
      { slug: "aging", label: "Aging", title: "Payables Aging", description: "Analyze outstanding payables by supplier and age bracket.", icon: Timer, actions: LIST },
      { slug: "reports", label: "Reports", description: "Generate and view financial, statutory, and management reports for Accounts Payables.", icon: FileBarChart2, actions: LIST },
    ],
  },
  {
    key: "financial-reports",
    label: "Financial Reports",
    basePath: "/financial-reports",
    icon: FileSpreadsheet,
    summary: "Generate financial statements and COA-aligned reports.",
    features: ["Trial Balances (Pre-Closing and Post Closing)", "Statement of Financial Position", "Statement of Financial Performance", "Statement of Cash Flow", "Statement of Comparison of Budget and Actual Amounts", "FARS 1 to 6", "Ratio Analysis"],
    permission: "reports:view",
    tabs: [
      { slug: "list", label: "Report List", title: "Financial Reports", description: "Generate and view financial reports for monitoring and decision-making.", icon: FileSpreadsheet },
      { slug: "categories", label: "Report Categories", description: "Browse reports grouped by category.", icon: FolderTree, actions: LIST },
      { slug: "templates", label: "Report Templates", description: "Manage report layouts and signatories.", icon: FileStack, actions: LIST },
      { slug: "scheduled", label: "Scheduled Reports", description: "Reports generated automatically on a schedule.", icon: CalendarClock, actions: LIST },
    ],
  },
  {
    key: "setup",
    label: "References & Setup",
    basePath: "/setup",
    icon: Settings,
    summary: "Maintain users, fund clusters, offices and system preferences.",
    features: [],
    permission: "settings:view",
    tabs: [
      { slug: "funds", label: "Fund Clusters", description: "Maintain fund clusters and their bank accounts.", icon: Building2, actions: LIST },
      { slug: "departments", label: "Departments", title: "Departments / Cost Centers", description: "Maintain departments, cost centers and project codes.", icon: ListChecks, actions: LIST },
    ],
  },
];

/** Extra (non-tab) routes listed under References & Setup in the sidebar. */
export const SETUP_LINKS = [
  { label: "Users & Roles", href: "/users", icon: Users, permission: "users:manage" as Permission },
  { label: "Settings", href: "/settings", icon: Settings, permission: "settings:view" as Permission },
];

export function getModule(key: string): ModuleDef {
  const m = MODULES.find((x) => x.key === key);
  if (!m) throw new Error(`Unknown module: ${key}`);
  return m;
}

export function getTab(moduleKey: string, slug: string): ModuleTab | undefined {
  return getModule(moduleKey).tabs.find((t) => t.slug === slug);
}

export function tabHref(module: ModuleDef, slug: string) {
  return `${module.basePath}/${slug}`;
}
