import type { PermissionDef, SystemRole, SystemUser } from "@/features/users/types";

/** Mirrors the backend's `App\Enums\Permission` cases and descriptions. */
export const MOCK_PERMISSIONS: PermissionDef[] = [
  { key: "users.view", description: "View users" },
  { key: "users.create", description: "Create users" },
  { key: "users.deactivate", description: "Activate / deactivate users" },
  { key: "roles.view", description: "View roles" },
  { key: "roles.manage", description: "Create, edit and delete roles" },
  { key: "roles.assign", description: "Assign roles to users" },
  { key: "reports.view", description: "View cross-system reports" },
  { key: "reports.share", description: "Share report datasets with other systems" },
];

const ALL = MOCK_PERMISSIONS.map((p) => p.key);
const ts = "2026-08-01T00:00:00+00:00";

export const MOCK_ROLES: SystemRole[] = [
  { id: "01JD0000000000000000000R01", key: "super_admin", name: "Super Admin", description: "Full access to every eNGAS feature.", built_in: true, permissions: ALL, created_at: ts, updated_at: ts },
  { id: "01JD0000000000000000000R02", key: "admin", name: "Admin", description: "Administers users and roles.", built_in: true, permissions: ["users.view", "users.create", "users.deactivate", "roles.view", "roles.assign", "reports.view"], created_at: ts, updated_at: ts },
  { id: "01JD0000000000000000000R03", key: null, name: "Accountant", description: "Records and posts transactions.", built_in: false, permissions: ["reports.view"], created_at: ts, updated_at: ts },
  { id: "01JD0000000000000000000R04", key: null, name: "Budget Officer", description: "Monitors appropriations and allotments.", built_in: false, permissions: ["reports.view", "reports.share"], created_at: ts, updated_at: ts },
  { id: "01JD0000000000000000000R05", key: null, name: "Auditor", description: "Read-only access for audit.", built_in: false, permissions: ["users.view", "roles.view", "reports.view"], created_at: ts, updated_at: ts },
];

const role = (i: number) => {
  const r = MOCK_ROLES[i];
  return { id: r.id, key: r.key, name: r.name };
};
const system = { key: "engas", name: "eNGAS" };

type Seed = [name: string, email: string, roles: number[], active: boolean, lastLogin: string | null, created: string];
const SEEDS: Seed[] = [
  ["Maria Santos", "maria.santos@agency.gov.ph", [1], true, "2026-11-10T02:15:00+00:00", "2026-08-02T01:00:00+00:00"],
  ["Jose Reyes", "jose.reyes@agency.gov.ph", [2], true, "2026-11-10T01:42:00+00:00", "2026-08-03T01:00:00+00:00"],
  ["Ana Dela Cruz", "ana.delacruz@agency.gov.ph", [3], true, "2026-11-09T09:30:00+00:00", "2026-08-04T01:00:00+00:00"],
  ["Ramon Bautista", "ramon.bautista@agency.gov.ph", [2], true, "2026-11-08T07:05:00+00:00", "2026-08-10T01:00:00+00:00"],
  ["Liza Mendoza", "liza.mendoza@agency.gov.ph", [4], true, "2026-11-07T03:20:00+00:00", "2026-08-11T01:00:00+00:00"],
  ["Carlo Villanueva", "carlo.villanueva@agency.gov.ph", [3], false, "2026-09-21T05:45:00+00:00", "2026-08-12T01:00:00+00:00"],
  ["Grace Navarro", "grace.navarro@agency.gov.ph", [2], true, null, "2026-11-05T00:00:00+00:00"],
  ["Paolo Garcia", "paolo.garcia@agency.gov.ph", [4], true, "2026-11-09T11:10:00+00:00", "2026-09-01T01:00:00+00:00"],
  ["Odee Paco", "odee.paco@agency.gov.ph", [0], true, "2026-11-10T08:00:00+00:00", "2026-08-01T01:00:00+00:00"],
];

export const MOCK_USERS: SystemUser[] = SEEDS.map(([name, email, roles, active, last, created], i) => ({
  id: `01JD00000000000000000U${String(i + 1).padStart(4, "0")}`,
  name,
  email,
  is_active: active,
  system,
  roles: roles.map(role),
  last_login_at: last,
  created_at: created,
}));
