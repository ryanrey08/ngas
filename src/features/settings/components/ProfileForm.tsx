"use client";

import { ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { roleLabel } from "@/features/auth/authUtils";
import { formatDate } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

/**
 * The signed-in user's account, exactly as returned by the backend's `GET /auth/me`.
 * Read-only: the eNGAS backend has no endpoint for users to edit their own profile.
 */
export function ProfileForm() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return null;

  const rows: Array<[string, string]> = [
    ["Full name", user.name],
    ["Email address", user.email],
    ["System", user.system.name],
    ["Role", roleLabel(user)],
    ["Account status", user.is_active ? "Active" : "Inactive"],
    ["Last sign-in", user.last_login_at ? formatDate(user.last_login_at, { dateStyle: "medium", timeStyle: "short" }) : "—"],
    ["Member since", formatDate(user.created_at)],
  ];

  return (
    <Card>
      <CardHeader title="Profile" description="Your eNGAS account. Contact your administrator to change these details." />
      <CardBody>
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-bold text-ink-900">{user.name}</p>
            <p className="truncate text-sm text-neutral-500">{user.email}</p>
            <p className="mt-1 text-xs font-semibold text-brand-700">{roleLabel(user)}</p>
          </div>
        </div>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
              <dd className="mt-1 text-sm text-ink-900">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 border-t border-neutral-100 pt-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <ShieldCheck className="h-4 w-4" aria-hidden /> Permissions
          </p>
          {user.is_super_admin ? (
            <p className="mt-2 text-sm text-ink-900">Super admin: every permission.</p>
          ) : user.permissions.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {user.permissions.map((p) => (
                <li key={p} className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-ink-900">
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">No administrative permissions.</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
