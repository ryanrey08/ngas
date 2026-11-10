import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-neutral-500">Sign in to eNGAS — New Government Accounting System.</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
