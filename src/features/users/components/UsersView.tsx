"use client";

import { Check, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PageBody, PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PERMISSION_LABELS, ROLE_LABELS, ROLE_PERMISSIONS } from "@/config/navigation";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePermission } from "@/hooks/usePermission";
import { formatRelativeTime } from "@/lib/utils";
import { userService } from "@/services/userService";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import type { Permission, Role } from "@/types";
import type { ManagedUser } from "../types";

const ROLES = Object.keys(ROLE_LABELS) as Role[];
const PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];

export function UsersView() {
  const dispatch = useAppDispatch();
  const allowed = usePermission("users:manage");
  const { data, loading, error, reload } = useAsyncData(userService.list);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return (data ?? []).filter(
      (u) => (!role || u.role === role) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  }, [data, query, role]);

  if (!allowed) {
    return (
      <>
        <PageHeader title="Users & Roles" icon={Users} />
        <PageBody>
          <Card>
            <ErrorState title="Access restricted" message="You need the “Manage users & roles” permission to view this page." />
          </Card>
        </PageBody>
      </>
    );
  }

  const columns: Column<ManagedUser>[] = [
    {
      key: "name",
      header: "User",
      sortValue: (u) => u.name,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-ink-900">{u.name}</p>
            <p className="truncate text-xs text-neutral-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortValue: (u) => ROLE_LABELS[u.role],
      cell: (u) => <StatusBadge status={ROLE_LABELS[u.role]} tone={u.role === "admin" ? "dark" : u.role === "viewer" ? "gray" : "red"} />,
    },
    {
      key: "position",
      header: "Position / Office",
      hideOnMobile: true,
      sortValue: (u) => u.position,
      cell: (u) => (
        <div>
          <p className="text-ink-800">{u.position}</p>
          <p className="text-xs text-neutral-500">{u.office}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", sortValue: (u) => u.status, cell: (u) => <StatusBadge status={u.status} /> },
    { key: "lastActive", header: "Last active", sortValue: (u) => u.lastActive, cell: (u) => <span className="whitespace-nowrap text-neutral-600">{formatRelativeTime(u.lastActive)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Users & Roles"
        description="Manage eNGAS accounts, role assignments and permissions."
        icon={Users}
        actions={
          <Button
            variant="success"
            size="sm"
            leftIcon={<UserPlus className="h-4 w-4" aria-hidden />}
            onClick={() => dispatch(showToast({ variant: "info", title: "Invitations are disabled in demo mode" }))}
          >
            Invite user
          </Button>
        }
      />
      <PageBody>
        <section aria-label="Roles" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((r) => (
            <Card key={r} className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-heading text-sm font-bold text-ink-900">{ROLE_LABELS[r]}</p>
                  <p className="text-xs text-neutral-500">
                    {(data ?? []).filter((u) => u.role === r).length} users · {ROLE_PERMISSIONS[r].length} permissions
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </section>

        <Card>
          <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center">
            <SearchInput value={query} onChange={setQuery} label="Search users" placeholder="Search name or email…" className="sm:max-w-sm sm:flex-1" />
            <div className="sm:ml-auto">
              <FilterDropdown label="Role" value={role} onChange={setRole} options={ROLES.map((r) => ({ label: ROLE_LABELS[r], value: r }))} />
            </div>
          </div>
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <DataTable caption="Users" data={rows} columns={columns} getRowId={(u) => u.id} loading={loading} pageSize={10} />
          )}
        </Card>

        <Card>
          <CardHeader title="Permission matrix" description="What each role can access" />
          <div className="scrollbar-thin relative overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Role permission matrix</caption>
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  <th scope="col" className="px-5 py-3 text-left">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r} scope="col" className="px-4 py-3 text-center">{ROLE_LABELS[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p) => (
                  <tr key={p} className="border-b border-neutral-100 last:border-0">
                    <th scope="row" className="px-5 py-3 text-left font-medium text-ink-800">{PERMISSION_LABELS[p]}</th>
                    {ROLES.map((r) => {
                      const has = ROLE_PERMISSIONS[r].includes(p);
                      return (
                        <td key={r} className="px-4 py-3 text-center">
                          {has ? (
                            <Check className="mx-auto h-4 w-4 text-brand-600" aria-label="Allowed" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-neutral-300" aria-label="Not allowed" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </PageBody>
    </>
  );
}
