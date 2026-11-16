import { z } from "zod";

/** Mirrors the backend LoginRequest: email (required, RFC email, ≤255) and password (required, ≤255). */
export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").max(255, "Email is too long").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(255, "Password is too long"),
  remember: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
