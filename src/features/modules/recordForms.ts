/**
 * Create/edit forms of the generic module records that have a "New …" action in their header.
 * Shared by the form modal (UI) and the mock server (validation), so both enforce the same rules.
 */
export interface RecordFormField {
  key: string;
  label: string;
  type: "text" | "select" | "textarea";
  options?: readonly string[];
  required?: boolean;
  maxLength?: number;
  pattern?: { regex: string; message: string };
  placeholder?: string;
  /** Unique within the resource (checked by the server). */
  unique?: boolean;
  /** Identifier fields cannot change once saved. */
  lockedOnEdit?: boolean;
  wide?: boolean;
}

export const RECORD_FORMS: Record<string, { title: string; fields: RecordFormField[] }> = {
  "double-entry/templates": {
    title: "Journal Template",
    fields: [
      { key: "code", label: "Template Code", type: "text", required: true, unique: true, lockedOnEdit: true, maxLength: 20, placeholder: "TMPL-AP-002", pattern: { regex: "^TMPL-[A-Z]{2,4}-\\d{3}$", message: "Use the format TMPL-XXX-000" } },
      { key: "name", label: "Template Name", type: "text", required: true, maxLength: 120, placeholder: "AP – Accrual of Utilities" },
      { key: "category", label: "Category", type: "select", required: true, options: ["Accounts Payable", "Accounts Receivable", "Cash Management", "Inventory", "Depreciation", "Property & Equipment", "Others"] },
      { key: "source", label: "Transaction Source", type: "select", required: true, options: ["Accounts Payable (AP)", "Accounts Receivable (AR)", "Cash Management (CM)", "Inventory (SIMS)", "Property & Equipment", "General Journal"] },
      { key: "status", label: "Status", type: "select", required: true, options: ["Active", "Inactive"] },
      { key: "description", label: "Description", type: "textarea", required: true, maxLength: 255, wide: true, placeholder: "When this template is used and what it records." },
    ],
  },
};
