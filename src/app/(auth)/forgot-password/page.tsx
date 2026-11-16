import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Forgot your password?</h1>
        <p className="mt-2 text-sm text-neutral-500">
          eNGAS passwords are managed by your system administrator.
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
