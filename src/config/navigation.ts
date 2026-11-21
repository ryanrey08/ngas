import { House, type LucideIcon } from "lucide-react";
import type { AuthUser, BackendPermission } from "@/features/auth/types";
import type { Permission } from "@/types";
import { MODULES, SETUP_LINKS, getModule, tabHref } from "./modules";

export interface NavChild {
  label: string;
  href: string;
}

export interface NavEntry {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  /** Collapsible sub-links (module tabs). Active state matches by `matchPrefix`. */
  children?: NavChild[];
  matchPrefix: string;
}

/** Sidebar navigation, generated from the module registry so routes, tabs and menu never drift. */
export const NAVIGATION: NavEntry[] = [
  { label: "Home", href: "/dashboard", icon: House, permission: "dashboard:view", matchPrefix: "/dashboard" },
  ...MODULES.filter((m) => m.key !== "setup").map((m) => ({
    label: m.label,
    href: tabHref(m, m.tabs[0].slug),
    icon: m.icon,
    permission: m.permission,
    matchPrefix: m.basePath,
    children: m.tabs.length > 1 ? m.tabs.map((t) => ({ label: t.label, href: tabHref(m, t.slug) })) : undefined,
  })),
  (() => {
    const setup = getModule("setup");
    return {
      label: setup.label,
      href: tabHref(setup, setup.tabs[0].slug),
      icon: setup.icon,
      permission: setup.permission,
      matchPrefix: "/setup|/users|/settings",
      children: [
        ...setup.tabs.map((t) => ({ label: t.label, href: tabHref(setup, t.slug) })),
        ...SETUP_LINKS.map((l) => ({ label: l.label, href: l.href })),
      ],
    };
  })(),
];

export function isNavActive(entry: NavEntry, pathname: string) {
  return entry.matchPrefix.split("|").some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Frontend capability → backend permission. The eNGAS backend currently defines permissions only
 * for user/role administration and cross-system reports (App\Enums\Permission). Accounting
 * capabilities have no backend permission yet, so every active, signed-in user gets them; the
 * backend still authorises each request itself.
 */
const BACKEND_PERMISSION: Partial<Record<Permission, BackendPermission>> = {
  "users:manage": "users.view",
};

type PermissionSubject = Pick<AuthUser, "permissions" | "is_super_admin" | "is_active"> | null | undefined;

export function hasPermission(user: PermissionSubject, permission: Permission): boolean {
  if (!user || !user.is_active) return false;
  if (user.is_super_admin) return true;
  const required = BACKEND_PERMISSION[permission];
  return required ? user.permissions.includes(required) : true;
}

export function filterNavigation(user: PermissionSubject): NavEntry[] {
  return NAVIGATION.filter((e) => !e.permission || hasPermission(user, e.permission)).map((e) =>
    e.children
      ? {
          ...e,
          children: e.children.filter((c) => {
            const link = SETUP_LINKS.find((l) => l.href === c.href);
            return !link || hasPermission(user, link.permission);
          }),
        }
      : e,
  );
}

/** Human-readable labels for breadcrumb segments. */
export const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users & Roles",
  settings: "Settings",
  ...Object.fromEntries(MODULES.map((m) => [m.basePath.slice(1), m.label])),
};

/** Label for a `/module/tab` breadcrumb segment. */
export function tabLabel(moduleSegment: string, tabSegment: string): string | undefined {
  const m = MODULES.find((x) => x.basePath === `/${moduleSegment}`);
  return m?.tabs.find((t) => t.slug === tabSegment)?.label;
}
