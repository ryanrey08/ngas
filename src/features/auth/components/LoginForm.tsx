"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormInput } from "@/components/forms/FormInput";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";
import { safeRedirectPath } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { clearAuthError, login } from "../authSlice";
import { loginSchema, type LoginFormValues } from "../schemas";

export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const sessionExpired = searchParams.get("reason") === "expired";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const onSubmit = async (values: LoginFormValues) => {
    if (isLoading) return;
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      dispatch(showToast({ variant: "success", title: `Welcome back, ${result.payload.name}` }));
      router.replace(safeRedirectPath(searchParams.get("from"), ROUTES.dashboard));
      return;
    }
    // Surface the backend's own field validation messages next to each field.
    const fieldErrors = result.payload?.errors;
    if (fieldErrors) {
      for (const field of ["email", "password"] as const) {
        const message = fieldErrors[field]?.[0];
        if (message) setError(field, { type: "server", message });
      }
    }
  };

  const loading = isLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" aria-describedby={error ? "login-error" : undefined}>
      {error ? (
        <Alert id="login-error">{error}</Alert>
      ) : (
        sessionExpired && <Alert tone="info">Your session has expired. Please sign in again.</Alert>
      )}

      <FormInput
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="juan.delacruz@agency.gov.ph"
        leftIcon={<Mail />}
        required
        disabled={loading}
        error={errors.email?.message}
        {...register("email")}
      />

      <FormInput
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Enter your password"
        leftIcon={<Lock />}
        required
        disabled={loading}
        error={errors.password?.message}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-ink-900"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        }
        {...register("password")}
      />

      <div className="flex items-center justify-between gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" className="h-4 w-4 rounded border-neutral-300 accent-brand-600" {...register("remember")} />
          Remember me
        </label>
        <Link href={ROUTES.forgotPassword} className="text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" fullWidth loading={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

    </form>
  );
}
