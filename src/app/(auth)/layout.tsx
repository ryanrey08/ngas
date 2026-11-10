import type { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel />
      <main className="relative flex flex-col items-center justify-center bg-white px-5 py-10 sm:px-10">
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ink-900 via-brand-600 to-brand-700 lg:hidden" />
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo width={200} priority />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
