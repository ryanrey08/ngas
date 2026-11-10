import type { ManagedUser } from "@/features/users/types";
import type { Role, User } from "@/types";

export const MOCK_USERS: ManagedUser[] = [
  { id: "u-001", name: "Maria Santos", email: "maria.santos@agency.gov.ph", role: "admin", position: "Chief Accountant", office: "Accounting Section", status: "Active", lastActive: "2026-11-10T02:15:00Z" },
  { id: "u-002", name: "Jose Reyes", email: "jose.reyes@agency.gov.ph", role: "accountant", position: "Accountant III", office: "Accounting Section", status: "Active", lastActive: "2026-11-10T01:42:00Z" },
  { id: "u-003", name: "Ana Dela Cruz", email: "ana.delacruz@agency.gov.ph", role: "budget_officer", position: "Budget Officer IV", office: "Budget Section", status: "Active", lastActive: "2026-11-09T09:30:00Z" },
  { id: "u-004", name: "Ramon Bautista", email: "ramon.bautista@agency.gov.ph", role: "accountant", position: "Accountant II", office: "Regional Field Office I", status: "Active", lastActive: "2026-11-08T07:05:00Z" },
  { id: "u-005", name: "Liza Mendoza", email: "liza.mendoza@agency.gov.ph", role: "viewer", position: "State Auditor III", office: "Office of the Director", status: "Active", lastActive: "2026-11-07T03:20:00Z" },
  { id: "u-006", name: "Carlo Villanueva", email: "carlo.villanueva@agency.gov.ph", role: "budget_officer", position: "Budget Officer II", office: "Regional Field Office II", status: "Inactive", lastActive: "2026-09-21T05:45:00Z" },
  { id: "u-007", name: "Grace Navarro", email: "grace.navarro@agency.gov.ph", role: "accountant", position: "Accounting Clerk", office: "Finance & Administrative Division", status: "Invited", lastActive: "2026-11-05T00:00:00Z" },
  { id: "u-008", name: "Paolo Garcia", email: "paolo.garcia@agency.gov.ph", role: "viewer", position: "Internal Auditor", office: "Office of the Director", status: "Active", lastActive: "2026-11-09T11:10:00Z" },
];

/**
 * Mock login: any valid email + password (≥ 8 chars) succeeds. The role is inferred from
 * the email so different permission sets can be previewed (e.g. viewer@demo.gov).
 */
export function mockUserFromEmail(email: string): User {
  const local = email.split("@")[0] ?? "user";
  const lower = email.toLowerCase();
  const role: Role = lower.includes("viewer") || lower.includes("audit")
    ? "viewer"
    : lower.includes("budget")
      ? "budget_officer"
      : lower.includes("accountant")
        ? "accountant"
        : "admin";
  const name = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ") || "NGAS User";
  const positions: Record<Role, string> = {
    admin: "System Administrator",
    accountant: "Accountant III",
    budget_officer: "Budget Officer IV",
    viewer: "State Auditor",
  };
  return { id: "u-demo", name, email, role, position: positions[role], office: "Accounting Section" };
}
