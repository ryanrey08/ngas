import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Full name is required").max(80),
  position: z.string().trim().min(2, "Position is required").max(80),
  office: z.string().trim().min(2, "Office is required").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?63|0)?9\d{9}$|^$/, "Enter a valid PH mobile number (e.g. 09171234567)"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
