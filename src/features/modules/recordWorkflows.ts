/**
 * Workflow actions available on the generic module records (the row "More" menu).
 *
 * Each action is a status transition, sent as `POST /<resource>/<id>/<action>`; `delete` is sent
 * as `DELETE /<resource>/<id>`. The mock server enforces the same table, so an action that is not
 * allowed for a record's current status is rejected with a 422, as a real backend would.
 */
export interface RecordAction {
  key: string;
  label: string;
  /** Statuses the action is available from. */
  from: string[];
  /** Resulting status (ignored for `delete` and `edit`). */
  to: string;
  tone?: "default" | "danger" | "success";
  /** Ask for confirmation (and optional remarks) first. */
  confirm?: boolean;
  /** Collect remarks in the confirmation dialog (e.g. reason for rejection). */
  remarks?: boolean;
}

const post = (from: string[] = ["Unposted", "Draft"]): RecordAction => ({ key: "post", label: "Post to Books", from, to: "Posted", tone: "success", confirm: true });
const remove = (from: string[] = ["Draft"]): RecordAction => ({ key: "delete", label: "Delete", from, to: "", tone: "danger", confirm: true });
const activation: RecordAction[] = [
  { key: "deactivate", label: "Deactivate", from: ["Active"], to: "Inactive", tone: "danger", confirm: true },
  { key: "activate", label: "Activate", from: ["Inactive"], to: "Active", tone: "success" },
];
const generate: RecordAction = { key: "generate", label: "Generate Now", from: ["Ready", "Processing"], to: "Ready" };

export const RECORD_WORKFLOWS: Record<string, RecordAction[]> = {
  "double-entry/auto-journal": activation,
  "double-entry/templates": activation,
  "accrual/adjusting": [post(["Draft"]), remove()],
  "accrual/accrued-expenses": [post(["Draft"]), remove()],
  "accrual/accrued-revenues": [post(["Draft"]), remove()],
  "accrual/deferral": [{ key: "recognize", label: "Recognize for Period", from: ["Current"], to: "Posted", tone: "success", confirm: true }],
  "accrual/inquiry": [post(["Draft"]), { key: "reverse", label: "Reverse", from: ["Posted"], to: "Reversed", tone: "danger", confirm: true, remarks: true }],
  "coa/groups": activation,
  "coa/classes": activation,
  "coa/types": activation,
  "coa/mapping": [
    { key: "approve", label: "Approve Mapping", from: ["Pending"], to: "Active", tone: "success", confirm: true },
    { key: "reject", label: "Reject", from: ["Pending"], to: "Rejected", tone: "danger", confirm: true, remarks: true },
  ],
  "journals/crj": [post(["Unposted"])],
  "journals/cdj": [post(["Unposted"])],
  "journals/ckdj": [post(["Unposted"])],
  "journals/gj": [post(["Unposted"])],
  "cash/receipts": [post(["Unposted"])],
  "cash/disbursements": [post(["Unposted"])],
  "cash/bank-reconciliation": [{ key: "reconcile", label: "Mark Reconciled", from: ["Unreconciled"], to: "Reconciled", tone: "success", confirm: true }],
  "cash/petty-cash": [{ key: "liquidate", label: "Liquidate", from: ["Pending"], to: "Posted", tone: "success", confirm: true }],
  "cash/direct-tracking": [
    { key: "utilize", label: "Mark Utilized", from: ["Received"], to: "Utilized" },
    post(["Utilized"]),
  ],
  "receivables/collections": [{ key: "deposit", label: "Record Deposit", from: ["For Deposit"], to: "Posted", tone: "success", confirm: true }],
  "receivables/adjustments": [
    { key: "approve", label: "Approve", from: ["For Approval"], to: "Posted", tone: "success", confirm: true },
    { key: "reject", label: "Reject", from: ["For Approval"], to: "Rejected", tone: "danger", confirm: true, remarks: true },
  ],
  "receivables/reports": [generate],
  "payables/suppliers": activation,
  "payables/invoices": [
    { key: "submit", label: "Submit for Approval", from: ["Draft"], to: "For Approval" },
    { key: "approve", label: "Approve & Post", from: ["For Approval"], to: "Posted", tone: "success", confirm: true },
    { key: "reject", label: "Return", from: ["For Approval"], to: "Draft", tone: "danger", confirm: true, remarks: true },
    remove(),
  ],
  "payables/disbursements": [
    { key: "submit", label: "Submit for Approval", from: ["Draft"], to: "For Approval" },
    { key: "approve", label: "Approve", from: ["For Approval"], to: "Approved", tone: "success", confirm: true },
    { key: "reject", label: "Return", from: ["For Approval"], to: "Draft", tone: "danger", confirm: true, remarks: true },
    { key: "release", label: "Release Payment", from: ["Approved"], to: "Released", tone: "success", confirm: true },
    { key: "cancel", label: "Cancel Voucher", from: ["Draft", "For Approval"], to: "Cancelled", tone: "danger", confirm: true, remarks: true },
  ],
  "payables/withholding-tax": [{ key: "remit", label: "Remit to BIR", from: ["Pending"], to: "Posted", tone: "success", confirm: true }],
  "payables/reports": [generate],
  "financial-reports/templates": activation,
  "financial-reports/scheduled": [...activation, { key: "run", label: "Run Now", from: ["Active"], to: "Active" }],
  "setup/funds": activation,
  "setup/departments": activation,
};

export function actionsFor(resource: string, status: string | undefined): RecordAction[] {
  return (RECORD_WORKFLOWS[resource] ?? []).filter((a) => status !== undefined && a.from.includes(status));
}

export function findAction(resource: string, key: string): RecordAction | undefined {
  return RECORD_WORKFLOWS[resource]?.find((a) => a.key === key);
}
