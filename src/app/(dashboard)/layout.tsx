import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AuthGate } from "@/features/auth/components/AuthGate";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthGate>
  );
}
