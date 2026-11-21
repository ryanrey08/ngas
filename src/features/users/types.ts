/**
 * Shapes of the eNGAS backend's user & role administration API (these endpoints exist today):
 * `SystemUserResource`, `RoleResource` and `GET /permissions` in the Laravel backend.
 */
import type { AuthRole, BackendPermission } from "@/features/auth/types";

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  system: { key: string; name: string };
  roles: AuthRole[];
  last_login_at: string | null;
  created_at: string;
}

export interface SystemRole {
  id: string;
  key: AuthRole["key"];
  name: string;
  description: string | null;
  built_in: boolean;
  permissions: BackendPermission[];
  users_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PermissionDef {
  key: BackendPermission;
  description: string;
}

/** `POST /users` body. */
export interface NewUserInput {
  name: string;
  email: string;
  role_ids: string[];
}

/** `POST /users` response: the user plus a one-time temporary password. */
export interface CreatedUser {
  data: SystemUser;
  temporary_password: string;
}

export interface RoleInput {
  name: string;
  description?: string | null;
  permissions: BackendPermission[];
}
