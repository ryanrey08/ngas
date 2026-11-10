"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff, Info, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormInput } from "@/components/forms/FormInput";
import { Button } from "@/components/ui/Button";
import { isMockApi } from "@/config/env";
import { ROUTES } from "@/lib/constants";
import { safeRedirectPath } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuthError, login } from "../authSlice";
import { loginSchema, type LoginFormValues } from "../schemas";

export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
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
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      router.replace(safeRedirectPath(searchParams.get("from"), ROUTES.dashboard));
      router.refresh();
    }
  };

  const loading = status === "loading";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" aria-describedby={error ? "login-error" : undefined}>
      {error && (
        <div id="login-error" role="alert" className="flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
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

      <FormInput
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Enter your password"
        leftIcon={<Lock />}
        required
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

      {isMockApi && (
        <div className="flex gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
          <p>
            <span className="font-semibold text-ink-900">Demo mode:</span> sign in with any valid email and a password of at
            least 8 characters. Include <code className="font-semibold">viewer</code>, <code className="font-semibold">budget</code>{" "}
            or <code className="font-semibold">accountant</code> in the email to preview other roles.
          </p>
        </div>
      )}
    </form>
  );
}
