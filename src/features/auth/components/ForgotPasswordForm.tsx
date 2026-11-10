"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleAlert, MailCheck, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormInput } from "@/components/forms/FormInput";
import { Button } from "@/components/ui/Button";
import { normalizeError } from "@/lib/axios";
import { ROUTES } from "@/lib/constants";
import { authService } from "@/services/authService";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: ForgotPasswordFormValues) => {
    setError(null);
    try {
      await authService.requestPasswordReset(email);
      setSentTo(email);
    } catch (err) {
      setError(normalizeError(err).message);
    }
  };

  if (sentTo) {
    return (
      <div role="status" className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <MailCheck className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-bold text-ink-900">Check your email</h2>
        <p className="mt-2 text-sm text-neutral-500">
          If an account exists for <span className="font-semibold text-ink-900">{sentTo}</span>, you&apos;ll receive a link to reset
          your password within a few minutes.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={ROUTES.login}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Back to sign in
          </Link>
          <button type="button" onClick={() => setSentTo(null)} className="text-sm font-semibold text-neutral-600 hover:text-ink-900">
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}
      <FormInput
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="juan.delacruz@agency.gov.ph"
        leftIcon={<Mail />}
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        {isSubmitting ? "Sending link…" : "Send reset link"}
      </Button>
      <Link href={ROUTES.login} className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-600 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to sign in
      </Link>
    </form>
  );
}
