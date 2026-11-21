import type { CreatedUser, NewUserInput, PermissionDef, RoleInput, SystemRole, SystemUser } from "@/features/users/types";
import { api } from "../baseApi";
import { LIST, listTags } from "../apiTags";
import { toQueryParams, type Envelope, type ListParams, type Paginated } from "../apiTypes";

/**
 * User & role administration. These endpoints EXIST on the eNGAS backend today
 * (SystemUserController / SystemRoleController), and these hooks match their contracts.
 */
export interface UserQuery extends ListParams {
  roleId?: string;
  active?: "true" | "false";
}

export const usersApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** `GET /users?page&per_page` (+ `search`, `filter[role_id]`, `filter[is_active]` — expected extension). */
    getUsers: build.query<Paginated<SystemUser>, UserQuery>({
      query: ({ roleId, active, ...p }) => ({ url: "/users", params: toQueryParams({ ...p, filters: { role_id: roleId, is_active: active } }) }),
      providesTags: (r) => listTags("User", r?.data, (u) => u.id),
    }),
    /** `POST /users` — returns the user and a one-time temporary password. */
    createUser: build.mutation<CreatedUser, NewUserInput>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: (r) => (r ? [{ type: "User", id: LIST }, { type: "Role", id: LIST }] : []),
    }),
    /** `PUT /users/{id}/roles` — replaces the user's roles. */
    syncUserRoles: build.mutation<SystemUser, { id: string; roleIds: string[] }>({
      query: ({ id, roleIds }) => ({ url: `/users/${id}/roles`, method: "PUT", body: { role_ids: roleIds } }),
      transformResponse: (r: Envelope<SystemUser>) => r.data,
      invalidatesTags: (r, _e, { id }) => (r ? [{ type: "User", id }, { type: "Role", id: LIST }] : []),
    }),
    /** `POST /users/{id}/activate` | `POST /users/{id}/deactivate` — optimistic in every cached page. */
    setUserActive: build.mutation<SystemUser, { id: string; active: boolean }>({
      query: ({ id, active }) => ({ url: `/users/${id}/${active ? "activate" : "deactivate"}`, method: "POST" }),
      transformResponse: (r: Envelope<SystemUser>) => r.data,
      async onQueryStarted({ id, active }, { dispatch, getState, queryFulfilled }) {
        const patches = usersApi.util.selectCachedArgsForQuery(getState(), "getUsers").map((args) =>
          dispatch(
            usersApi.util.updateQueryData("getUsers", args, (d) => {
              const u = d?.data?.find((x) => x.id === id);
              if (u) u.is_active = active;
            }),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (r, _e, { id }) => (r ? [{ type: "User", id }] : []),
    }),
    /** `GET /roles?per_page=100` */
    getRoles: build.query<SystemRole[], void>({
      query: () => ({ url: "/roles", params: { per_page: "100" } }),
      transformResponse: (r: Paginated<SystemRole>) => r.data,
      providesTags: (r) => listTags("Role", r, (x) => x.id),
    }),
    /** `GET /permissions` */
    getPermissions: build.query<PermissionDef[], void>({
      query: () => "/permissions",
      transformResponse: (r: Envelope<PermissionDef[]>) => r.data,
      providesTags: ["Permission"],
      keepUnusedDataFor: 3600,
    }),
    /** `POST /roles` */
    createRole: build.mutation<SystemRole, RoleInput>({
      query: (body) => ({ url: "/roles", method: "POST", body }),
      transformResponse: (r: Envelope<SystemRole>) => r.data,
      invalidatesTags: (r) => (r ? [{ type: "Role", id: LIST }] : []),
    }),
    /** `PATCH /roles/{id}` — permission toggles are applied optimistically. */
    updateRole: build.mutation<SystemRole, { id: string; patch: Partial<RoleInput> }>({
      query: ({ id, patch }) => ({ url: `/roles/${id}`, method: "PATCH", body: patch }),
      transformResponse: (r: Envelope<SystemRole>) => r.data,
      async onQueryStarted({ id, patch }, { dispatch, queryFulfilled }) {
        const p = dispatch(
          usersApi.util.updateQueryData("getRoles", undefined, (d) => {
            const role = d?.find((x) => x.id === id);
            if (role) Object.assign(role, patch);
          }),
        );
        queryFulfilled.catch(p.undo);
      },
      invalidatesTags: (r, _e, { id }) => (r ? [{ type: "Role", id }, { type: "User", id: LIST }] : []),
    }),
    /** `DELETE /roles/{id}` */
    deleteRole: build.mutation<void, string>({
      query: (id) => ({ url: `/roles/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, e, id) => (e ? [] : [{ type: "Role", id }, { type: "Role", id: LIST }]),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useSyncUserRolesMutation,
  useSetUserActiveMutation,
  useGetRolesQuery,
  useGetPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = usersApi;
