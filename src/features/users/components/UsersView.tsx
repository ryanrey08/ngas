"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, KeyRound, ShieldCheck, ShieldPlus, Trash2, UserCheck, UserCog, UserPlus, UserX, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInput, FormTextarea } from "@/components/forms";
import { PageBody, PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { userCan } from "@/features/auth/authUtils";
import type { BackendPermission } from "@/features/auth/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatRelativeTime } from "@/lib/utils";
import { errorMessage, fieldErrors } from "@/services/api/errors";
import {
  useCreateRoleMutation,
  useCreateUserMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useGetRolesQuery,
  useGetUsersQuery,
  useSetUserActiveMutation,
  useSyncUserRolesMutation,
  useUpdateRoleMutation,
} from "@/services/api/endpoints/usersApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import type { SystemRole, SystemUser } from "../types";

const PAGE_SIZE = 10;
const iconBtn = "inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-ink-900 disabled:opacity-40";

function RoleChecklist({ roles, value, onChange }: { roles: SystemRole[]; value: string[]; onChange: (ids: string[]) => void }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-ink-800">Roles</legend>
      {roles.map((r) => (
        <label key={r.id} className="flex items-start gap-2 text-sm text-ink-900">
          <input
            type="checkbox"
            className="mt-1 accent-brand-600"
            checked={value.includes(r.id)}
            onChange={(e) => onChange(e.target.checked ? [...value, r.id] : value.filter((x) => x !== r.id))}
          />
          <span>
            <span className="font-semibold">{r.name}</span>
            {r.description && <span className="block text-xs text-neutral-500">{r.description}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

const inviteSchema = z.object({
  name: z.string().trim().min(1, "The name field is required.").max(255),
  email: z.string().trim().email("Enter a valid email address.").max(255),
});
type InviteValues = z.infer<typeof inviteSchema>;

/** `POST /users` — shows the one-time temporary password the backend returns. */
function InviteUserModal({ open, roles, onClose }: { open: boolean; roles: SystemRole[]; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [createUser, { isLoading }] = useCreateUserMutation();
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<InviteValues>({ resolver: zodResolver(inviteSchema), defaultValues: { name: "", email: "" } });

  useEffect(() => {
    if (open) {
      reset({ name: "", email: "" });
      setRoleIds([]);
      setTempPassword(null);
    }
  }, [open, reset]);

  const onValid = async (v: InviteValues) => {
    if (isLoading) return;
    const res = await createUser({ name: v.name, email: v.email, role_ids: roleIds });
    if ("data" in res && res.data) {
      setTempPassword({ email: res.data.data.email, password: res.data.temporary_password });
      dispatch(showToast({ variant: "success", title: "User created", description: res.data.data.email }));
      return;
    }
    const fields = fieldErrors(res.error);
    if (fields.name) setError("name", { message: fields.name });
    if (fields.email) setError("email", { message: fields.email });
    if (!fields.name && !fields.email) dispatch(showToast({ variant: "error", title: "Could not create user", description: errorMessage(res.error) }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!isLoading}
      title={tempPassword ? "User created" : "Invite user"}
      icon={<UserPlus />}
      footer={
        tempPassword ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="sm:mr-auto">
              Cancel
            </Button>
            <Button variant="success" type="submit" form="invite-user-form" loading={isLoading} leftIcon={<UserPlus />}>
              Create user
            </Button>
          </>
        )
      }
    >
      {tempPassword ? (
        <div className="space-y-3 text-sm">
          <p>
            <b>{tempPassword.email}</b> can now sign in with this temporary password. It is shown only once — share it securely.
          </p>
          <p className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-ink-900">
            <KeyRound className="h-4 w-4 text-brand-600" aria-hidden /> {tempPassword.password}
          </p>
        </div>
      ) : (
        <form id="invite-user-form" noValidate onSubmit={handleSubmit(onValid)} className="space-y-3">
          <FormInput label="Full name" required error={errors.name?.message} {...register("name")} />
          <FormInput label="Email address" type="email" required error={errors.email?.message} {...register("email")} />
          <RoleChecklist roles={roles} value={roleIds} onChange={setRoleIds} />
        </form>
      )}
    </Modal>
  );
}

/** `PUT /users/{id}/roles` */
function AssignRolesModal({ user, roles, onClose }: { user: SystemUser | null; roles: SystemRole[]; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [sync, { isLoading }] = useSyncUserRolesMutation();
  const [roleIds, setRoleIds] = useState<string[]>([]);
  useEffect(() => {
    if (user) setRoleIds(user.roles.map((r) => r.id));
  }, [user]);
  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      dismissible={!isLoading}
      title={`Assign roles – ${user?.name ?? ""}`}
      icon={<UserCog />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="sm:mr-auto">
            Cancel
          </Button>
          <Button
            variant="blue"
            loading={isLoading}
            onClick={async () => {
              if (!user) return;
              const res = await sync({ id: user.id, roleIds });
              if ("error" in res && res.error) dispatch(showToast({ variant: "error", title: "Could not update roles", description: errorMessage(res.error) }));
              else {
                dispatch(showToast({ variant: "success", title: "Roles updated", description: user.name }));
                onClose();
              }
            }}
          >
            Save roles
          </Button>
        </>
      }
    >
      <RoleChecklist roles={roles} value={roleIds} onChange={setRoleIds} />
    </Modal>
  );
}

const roleSchema = z.object({ name: z.string().trim().min(1, "The name field is required.").max(100), description: z.string().max(500) });
type RoleValues = z.infer<typeof roleSchema>;

/** `POST /roles` */
function NewRoleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [createRole, { isLoading }] = useCreateRoleMutation();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<RoleValues>({ resolver: zodResolver(roleSchema), defaultValues: { name: "", description: "" } });
  useEffect(() => {
    if (open) reset({ name: "", description: "" });
  }, [open, reset]);
  const onValid = async (v: RoleValues) => {
    if (isLoading) return;
    const res = await createRole({ name: v.name, description: v.description || null, permissions: [] });
    if ("data" in res && res.data) {
      dispatch(showToast({ variant: "success", title: "Role created", description: "Grant its permissions in the matrix below." }));
      onClose();
      return;
    }
    const fields = fieldErrors(res.error);
    if (fields.name) setError("name", { message: fields.name });
    else dispatch(showToast({ variant: "error", title: "Could not create role", description: errorMessage(res.error) }));
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!isLoading}
      title="New role"
      icon={<ShieldPlus />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="sm:mr-auto">
            Cancel
          </Button>
          <Button variant="success" type="submit" form="new-role-form" loading={isLoading}>
            Create role
          </Button>
        </>
      }
    >
      <form id="new-role-form" noValidate onSubmit={handleSubmit(onValid)} className="space-y-3">
        <FormInput label="Role name" required maxLength={100} error={errors.name?.message} {...register("name")} />
        <FormTextarea label="Description" rows={2} maxLength={500} error={errors.description?.message} {...register("description")} />
      </form>
    </Modal>
  );
}

export function UsersView() {
  const dispatch = useAppDispatch();
  const me = useAppSelector((s) => s.auth.user);
  const can = (p: BackendPermission) => userCan(me, p);
  const allowed = can("users.view");

  const [query, setQuery] = useState("");
  const [roleId, setRoleId] = useState("");
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [assigning, setAssigning] = useState<SystemUser | null>(null);
  const [toggling, setToggling] = useState<SystemUser | null>(null);
  const [deletingRole, setDeletingRole] = useState<SystemRole | null>(null);
  const search = useDebounce(query, 300).trim();

  const users = useGetUsersQuery({ page, perPage: PAGE_SIZE, search: search || undefined, roleId: roleId || undefined }, { skip: !allowed });
  const roles = useGetRolesQuery(undefined, { skip: !allowed || !can("roles.view") });
  const permissions = useGetPermissionsQuery(undefined, { skip: !allowed || !can("roles.view") });
  const [setActive, setActiveState] = useSetUserActiveMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole, deleteRoleState] = useDeleteRoleMutation();
  const roleList = roles.data ?? [];

  if (!allowed) {
    return (
      <>
        <PageHeader title="Users & Roles" icon={Users} />
        <PageBody>
          <Card>
            <ErrorState title="Access restricted" message="You need the “View users” permission to open this page." />
          </Card>
        </PageBody>
      </>
    );
  }

  const togglePermission = async (role: SystemRole, perm: BackendPermission) => {
    const next = role.permissions.includes(perm) ? role.permissions.filter((p) => p !== perm) : [...role.permissions, perm];
    const res = await updateRole({ id: role.id, patch: { permissions: next } });
    if ("error" in res && res.error) dispatch(showToast({ variant: "error", title: "Permission not saved", description: errorMessage(res.error) }));
  };

  const columns: Column<SystemUser>[] = [
    {
      key: "name",
      header: "User",
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
      key: "roles",
      header: "Role",
      cell: (u) =>
        u.roles.length ? (
          <span className="flex flex-wrap gap-1">
            {u.roles.map((r) => (
              <StatusBadge key={r.id} status={r.name} tone={r.key === "super_admin" ? "dark" : r.key === "admin" ? "red" : "gray"} />
            ))}
          </span>
        ) : (
          <span className="text-xs text-neutral-400">No role</span>
        ),
    },
    { key: "status", header: "Status", cell: (u) => <StatusBadge status={u.is_active ? "Active" : "Inactive"} /> },
    { key: "lastActive", header: "Last sign-in", hideOnMobile: true, cell: (u) => <span className="whitespace-nowrap text-neutral-600">{u.last_login_at ? formatRelativeTime(u.last_login_at) : "Never"}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Users & Roles"
        description="Manage eNGAS accounts, role assignments and permissions."
        icon={Users}
        actions={
          can("users.create") ? (
            <Button variant="success" size="sm" leftIcon={<UserPlus className="h-4 w-4" aria-hidden />} onClick={() => setInviteOpen(true)}>
              Invite user
            </Button>
          ) : undefined
        }
      />
      <PageBody>
        {can("roles.view") && (
          <section aria-label="Roles" className="space-y-2">
            {can("roles.manage") && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" leftIcon={<ShieldPlus />} onClick={() => setNewRoleOpen(true)}>
                  New role
                </Button>
              </div>
            )}
            {roles.isLoading ? (
              <Card className="py-8 text-center">
                <LoadingSpinner label="Loading roles…" />
              </Card>
            ) : roles.error ? (
              <Card>
                <ErrorState message={errorMessage(roles.error)} onRetry={roles.refetch} />
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {roleList.map((r) => (
                  <Card key={r.id} className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white">
                        <ShieldCheck className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-sm font-bold text-ink-900">{r.name}</p>
                        <p className="text-xs text-neutral-500">
                          {r.users_count ?? 0} users · {r.permissions.length} permissions{r.built_in ? " · built-in" : ""}
                        </p>
                      </div>
                      {can("roles.manage") && !r.built_in && (
                        <button type="button" className={iconBtn} aria-label={`Delete role ${r.name}`} title="Delete role" onClick={() => setDeletingRole(r)}>
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        <Card>
          <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center">
            <SearchInput
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              label="Search users"
              placeholder="Search name or email…"
              className="sm:max-w-sm sm:flex-1"
            />
            <div className="sm:ml-auto">
              <FilterDropdown
                label="Role"
                value={roleId}
                onChange={(v) => {
                  setRoleId(v);
                  setPage(1);
                }}
                options={roleList.map((r) => ({ label: r.name, value: r.id }))}
              />
            </div>
          </div>
          {users.error && !users.data ? (
            <ErrorState message={errorMessage(users.error)} onRetry={users.refetch} />
          ) : (
            <DataTable
              caption="Users"
              data={users.data?.data ?? []}
              columns={columns}
              getRowId={(u) => u.id}
              loading={users.isLoading}
              fetching={users.isFetching}
              pageSize={PAGE_SIZE}
              page={page}
              onPageChange={setPage}
              server={{ total: users.data?.meta.total ?? 0, sort: null, onSortChange: () => {} }}
              rowActions={
                can("roles.assign") || can("users.deactivate")
                  ? (u) => (
                      <div className="inline-flex gap-1">
                        {can("roles.assign") && (
                          <button type="button" className={iconBtn} title="Assign roles" aria-label={`Assign roles to ${u.name}`} onClick={() => setAssigning(u)} disabled={!roleList.length}>
                            <UserCog className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        )}
                        {can("users.deactivate") && u.id !== me?.id && (
                          <button
                            type="button"
                            className={iconBtn}
                            title={u.is_active ? "Deactivate" : "Activate"}
                            aria-label={`${u.is_active ? "Deactivate" : "Activate"} ${u.name}`}
                            onClick={() => setToggling(u)}
                            disabled={setActiveState.isLoading && setActiveState.originalArgs?.id === u.id}
                          >
                            {u.is_active ? <UserX className="h-3.5 w-3.5" aria-hidden /> : <UserCheck className="h-3.5 w-3.5" aria-hidden />}
                          </button>
                        )}
                      </div>
                    )
                  : undefined
              }
            />
          )}
        </Card>

        {can("roles.view") && (
          <Card>
            <CardHeader title="Permission matrix" description={can("roles.manage") ? "What each role can access. Click a cell to grant or revoke (built-in roles are fixed)." : "What each role can access"} />
            {permissions.error ? (
              <ErrorState message={errorMessage(permissions.error)} onRetry={permissions.refetch} />
            ) : permissions.isLoading || roles.isLoading ? (
              <div className="py-8 text-center">
                <LoadingSpinner label="Loading permissions…" />
              </div>
            ) : (
              <div className="scrollbar-thin relative overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <caption className="sr-only">Role permission matrix</caption>
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                      <th scope="col" className="px-5 py-3 text-left">Permission</th>
                      {roleList.map((r) => (
                        <th key={r.id} scope="col" className="px-4 py-3 text-center">{r.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(permissions.data ?? []).map((p) => (
                      <tr key={p.key} className="border-b border-neutral-100 last:border-0">
                        <th scope="row" className="px-5 py-3 text-left font-medium text-ink-800">
                          {p.description}
                          <span className="block font-mono text-[0.65rem] text-neutral-400">{p.key}</span>
                        </th>
                        {roleList.map((r) => {
                          const has = r.permissions.includes(p.key);
                          const icon = has ? <Check className="mx-auto h-4 w-4 text-brand-600" aria-hidden /> : <X className="mx-auto h-4 w-4 text-neutral-300" aria-hidden />;
                          const editable = can("roles.manage") && !r.built_in;
                          return (
                            <td key={r.id} className="px-4 py-3 text-center">
                              {editable ? (
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={has}
                                  aria-label={`${p.description} for ${r.name}`}
                                  className="rounded p-1 hover:bg-neutral-100"
                                  onClick={() => void togglePermission(r, p.key)}
                                >
                                  {icon}
                                </button>
                              ) : (
                                <span aria-label={has ? "Allowed" : "Not allowed"}>{icon}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </PageBody>

      <InviteUserModal open={inviteOpen} roles={roleList} onClose={() => setInviteOpen(false)} />
      <NewRoleModal open={newRoleOpen} onClose={() => setNewRoleOpen(false)} />
      <AssignRolesModal user={assigning} roles={roleList} onClose={() => setAssigning(null)} />
      <ConfirmationDialog
        open={Boolean(toggling)}
        onClose={() => setToggling(null)}
        loading={setActiveState.isLoading}
        variant={toggling?.is_active ? "danger" : "primary"}
        title={toggling?.is_active ? "Deactivate user?" : "Activate user?"}
        confirmLabel={toggling?.is_active ? "Deactivate" : "Activate"}
        description={toggling?.is_active ? <><b className="text-ink-900">{toggling.name}</b> will be signed out and can no longer sign in.</> : <><b className="text-ink-900">{toggling?.name}</b> will be able to sign in again.</>}
        onConfirm={async () => {
          if (!toggling) return;
          const res = await setActive({ id: toggling.id, active: !toggling.is_active });
          dispatch(
            "error" in res && res.error
              ? showToast({ variant: "error", title: "Could not update user", description: errorMessage(res.error) })
              : showToast({ variant: "success", title: toggling.is_active ? "User deactivated" : "User activated", description: toggling.name }),
          );
          setToggling(null);
        }}
      />
      <ConfirmationDialog
        open={Boolean(deletingRole)}
        onClose={() => setDeletingRole(null)}
        loading={deleteRoleState.isLoading}
        title="Delete role?"
        confirmLabel="Delete role"
        description={<>The role <b className="text-ink-900">{deletingRole?.name}</b> will be deleted. Roles still assigned to users cannot be deleted.</>}
        onConfirm={async () => {
          if (!deletingRole) return;
          const res = await deleteRole(deletingRole.id);
          dispatch(
            "error" in res && res.error
              ? showToast({ variant: "error", title: "Could not delete role", description: errorMessage(res.error) })
              : showToast({ variant: "success", title: "Role deleted", description: deletingRole.name }),
          );
          setDeletingRole(null);
        }}
      />
    </>
  );
}
