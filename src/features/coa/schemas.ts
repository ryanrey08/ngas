import { z } from "zod";
import { ACCOUNT_CLASSIFICATIONS } from "./types";

export const accountSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{2})*$/, "Use the RCA format, e.g. 1.01.07"),
  title: z.string().trim().min(3, "Account title is required").max(120, "Max 120 characters"),
  parentCode: z.string(),
  classification: z.enum(ACCOUNT_CLASSIFICATIONS, { error: "Select a classification" }),
  accountType: z.enum(["Balance Sheet", "Income Statement"]),
  normalBalance: z.enum(["Debit", "Credit"]),
  uacs: z.string().trim().regex(/^(\d{10})?$/, "UACS code must be 10 digits"),
  postable: z.boolean(),
  active: z.boolean(),
  description: z.string().trim().max(255, "Max 255 characters"),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
