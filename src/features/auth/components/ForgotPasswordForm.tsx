import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { ROUTES } from "@/lib/constants";

/**
 * The eNGAS backend has NO forgot-password or reset-password endpoint (see
 * docs/AUTH_API_INTEGRATION.md), so this screen explains the real process instead of faking a
 * "reset link sent" success. Passwords are issued by administrators: creating a user returns a
 * one-time temporary password.
 */
export function ForgotPasswordForm() {
  return (
    <div className="space-y-6">
      <Alert tone="info">
        <p className="font-semibold">Self-service password reset isn&apos;t available yet.</p>
        <p className="mt-1">
          Please contact your eNGAS system administrator. They can issue you a new temporary password or reactivate your
          account.
        </p>
      </Alert>
      <Link
        href={ROUTES.login}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to sign in
      </Link>
    </div>
  );
}
