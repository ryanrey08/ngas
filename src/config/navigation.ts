import { House, type LucideIcon } from "lucide-react";
import type { Permission, Role } from "@/types";
import { MODULES, SETUP_LINKS, getModule, tabHref } from "./modules";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "System Administrator",
  accountant: "Accountant",
  budget_officer: "Budget Officer",
  viewer: "Viewer / Auditor",
};

/** Role → permission matrix. Mirrors what a backend RBAC would return. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "dashboard:view",
    "transactions:view",
    "transactions:manage",
    "budget:view",
    "budget:manage",
    "reports:view",
    "users:manage",
    "settings:view",
  ],
  accountant: [
    "dashboard:view",
    "transactions:view",
    "transactions:manage",
    "budget:view",
    "reports:view",
    "settings:view",
  ],
  budget_officer: [
    "dashboard:view",
    "transactions:view",
    "budget:view",
    "budget:manage",
    "reports:view",
    "settings:view",
  ],
  viewer: ["dashboard:view", "transactions:view", "budget:view", "reports:view", "settings:view"],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard:view": "View dashboard",
  "transactions:view": "View transactions",
  "transactions:manage": "Create / edit transactions",
  "budget:view": "View budget",
  "budget:manage": "Manage appropriations & allotments",
  "reports:view": "Generate reports",
  "users:manage": "Manage users & roles",
  "settings:view": "Access settings",
};

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

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function filterNavigation(role: Role | undefined): NavEntry[] {
  return NAVIGATION.filter((e) => !e.permission || hasPermission(role, e.permission)).map((e) =>
    e.children
      ? {
          ...e,
          children: e.children.filter((c) => {
            const link = SETUP_LINKS.find((l) => l.href === c.href);
            return !link || hasPermission(role, link.permission);
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
