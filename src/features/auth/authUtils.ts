import type { AuthUser, BackendPermission } from "./types";

/** Display label for the user's roles, e.g. "Super Admin" or "Admin, Budget viewer". */
export function roleLabel(user: Pick<AuthUser, "roles" | "is_super_admin"> | null | undefined): string {
  if (!user) return "";
  if (user.roles.length > 0) return user.roles.map((r) => r.name).join(", ");
  return user.is_super_admin ? "Super Admin" : "No role assigned";
}

/** Whether the user holds a backend permission. Super admins hold every permission. */
export function userCan(user: Pick<AuthUser, "permissions" | "is_super_admin"> | null | undefined, permission: BackendPermission): boolean {
  if (!user) return false;
  return user.is_super_admin || user.permissions.includes(permission);
}

/**
 * The backend's generic message for wrong password / unknown email / disabled account
 * (Laravel `auth.failed`). It arrives as a 422 field error on `email`.
 */
const INVALID_CREDENTIALS = "These credentials do not match our records.";

export function isInvalidCredentialsError(errors: Record<string, string[]> | undefined): boolean {
  return Boolean(errors?.email?.includes(INVALID_CREDENTIALS));
}

/** Builds the login URL that brings the user back to `from` after signing in. */
export function loginUrl(from?: string | null, reason?: "expired"): string {
  const params = new URLSearchParams();
  if (from && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/login")) params.set("from", from);
  if (reason) params.set("reason", reason);
  const qs = params.toString();
  return `/login${qs ? `?${qs}` : ""}`;
}
