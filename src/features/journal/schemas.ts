import { z } from "zod";

const amount = z.number({ error: "Enter an amount" }).min(0, "Cannot be negative").max(10_000_000_000, "Amount too large");

export const journalLineSchema = z
  .object({
    accountCode: z.string().min(1, "Select an account"),
    department: z.string().min(1, "Required"),
    debit: amount,
    credit: amount,
    remarks: z.string().max(120, "Max 120 characters"),
  })
  .refine((l) => (l.debit > 0) !== (l.credit > 0), { message: "Enter either a debit or a credit", path: ["debit"] });

export const journalEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a date"),
  journalType: z.string().min(1, "Select a type"),
  referenceNo: z.string().trim().min(1, "Reference no. is required").max(30, "Max 30 characters"),
  description: z.string().trim().min(5, "Enter a description (min. 5 characters)").max(255, "Max 255 characters"),
  department: z.string().min(1, "Select a department"),
  projectCode: z.string(),
  lines: z.array(journalLineSchema).min(2, "A journal entry needs at least two lines"),
});

export type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;
