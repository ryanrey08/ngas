import type { BackendPermission } from "@/features/auth/types";
import type { NewUserInput, RoleInput, SystemRole } from "@/features/users/types";
import { db, nowIso } from "../database/db";
import { MockHttpError, applyQuery, body, conflict, created, listParams, noContent, notFound, paginate, validationError, type Router } from "./http";

/** Same rules and response shapes as the backend's SystemUserController / SystemRoleController. */
const ulid = (prefix: string, n: number) => `01JD${prefix}${String(n).padStart(22 - prefix.length, "0")}`;

const findUser = (id: string) => db.users.find((u) => u.id === id) ?? (() => { throw notFound("user"); })();
const findRole = (id: string) => db.roles.find((r) => r.id === id) ?? (() => { throw notFound("role"); })();

function roleRefs(ids: unknown): SystemRole[] {
  if (!Array.isArray(ids)) throw validationError({ role_ids: "The role ids field must be an array." });
  return ids.map((id, i) => db.roles.find((r) => r.id === id) ?? (() => { throw validationError({ [`role_ids.${i}`]: "The selected role is invalid." }); })());
}

const withCount = (r: SystemRole): SystemRole => ({ ...r, users_count: db.users.filter((u) => u.roles.some((x) => x.id === r.id)).length });

function validateRole(input: Partial<RoleInput>, ignoreId?: string) {
  const errors: Record<string, string> = {};
  if (input.name !== undefined || !ignoreId) {
    if (!input.name?.trim()) errors.name = "The name field is required.";
    else if (input.name.length > 100) errors.name = "The name field must not be greater than 100 characters.";
    else if (db.roles.some((r) => r.name.toLowerCase() === input.name!.trim().toLowerCase() && r.id !== ignoreId)) errors.name = "The name has already been taken.";
  }
  const valid = new Set(db.permissions.map((p) => p.key));
  if (input.permissions !== undefined && !Array.isArray(input.permissions)) errors.permissions = "The permissions field must be an array.";
  (input.permissions ?? []).forEach((p, i) => {
    if (!valid.has(p)) errors[`permissions.${i}`] = "The selected permission is invalid.";
  });
  if (Object.keys(errors).length) throw validationError(errors);
}

export function registerUserHandlers(r: Router) {
  r.on("GET", "permissions", () => ({ data: db.permissions }));

  // The backend's index endpoints only take `per_page`; `search` and `filter[...]` are the expected
  // extension (see docs/API_INTEGRATION.md).
  r.on("GET", "users", (req) => {
    const p = listParams(req);
    const roleId = p.filters?.role_id;
    const active = p.filters?.is_active;
    const rows = applyQuery(
      db.users.filter((u) => (!roleId || u.roles.some((x) => x.id === roleId)) && (!active || String(u.is_active) === active)),
      { ...p, filters: {} },
      { searchKeys: ["name", "email"] },
    );
    return paginate(rows, p);
  });

  r.on("GET", "users/:id", (req) => ({ data: findUser(req.params.id) }));

  r.on("POST", "users", (req) => {
    const input = body<Partial<NewUserInput>>(req);
    const email = (input.email ?? "").trim().toLowerCase();
    const errors: Record<string, string> = {};
    if (!input.name?.trim()) errors.name = "The name field is required.";
    if (!email) errors.email = "The email field is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "The email field must be a valid email address.";
    else if (db.users.some((u) => u.email === email)) errors.email = "The email has already been taken.";
    if (Object.keys(errors).length) throw validationError(errors);
    const roles = roleRefs(input.role_ids ?? []);
    const user = {
      id: ulid("U", ++db.seq.user),
      name: input.name!.trim(),
      email,
      is_active: true,
      system: { key: "engas", name: "eNGAS" },
      roles: roles.map(({ id, key, name }) => ({ id, key, name })),
      last_login_at: null,
      created_at: nowIso(),
    };
    db.users.push(user);
    // The backend returns a one-time temporary password alongside the user.
    return created({ data: user, temporary_password: `Tmp-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 6)}` });
  });

  r.on("PUT", "users/:id/roles", (req) => {
    const user = findUser(req.params.id);
    const roles = roleRefs(body<{ role_ids: string[] }>(req).role_ids);
    user.roles = roles.map(({ id, key, name }) => ({ id, key, name }));
    return { data: user };
  });

  r.on("POST", "users/:id/deactivate", (req) => {
    const user = findUser(req.params.id);
    if (user.roles.some((x) => x.key === "super_admin") && db.users.filter((u) => u.is_active && u.roles.some((x) => x.key === "super_admin")).length === 1) {
      throw conflict("The last active super admin cannot be deactivated.");
    }
    user.is_active = false;
    return { data: user };
  });

  r.on("POST", "users/:id/activate", (req) => {
    const user = findUser(req.params.id);
    user.is_active = true;
    return { data: user };
  });

  r.on("GET", "roles", (req) => paginate(db.roles.map(withCount), listParams(req)));
  r.on("GET", "roles/:id", (req) => ({ data: withCount(findRole(req.params.id)) }));

  r.on("POST", "roles", (req) => {
    const input = body<Partial<RoleInput>>(req);
    validateRole(input);
    const role: SystemRole = {
      id: ulid("R", ++db.seq.role),
      key: null,
      name: input.name!.trim(),
      description: input.description ?? null,
      built_in: false,
      permissions: (input.permissions ?? []) as BackendPermission[],
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    db.roles.push(role);
    return created({ data: withCount(role) });
  });

  r.on("PATCH", "roles/:id", (req) => {
    const role = findRole(req.params.id);
    if (role.built_in) throw new MockHttpError(403, { code: "forbidden", detail: "Built-in roles cannot be changed." });
    const input = body<Partial<RoleInput>>(req);
    validateRole(input, role.id);
    Object.assign(role, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
      updated_at: nowIso(),
    });
    for (const u of db.users) u.roles = u.roles.map((x) => (x.id === role.id ? { ...x, name: role.name } : x));
    return { data: withCount(role) };
  });

  r.on("DELETE", "roles/:id", (req) => {
    const role = findRole(req.params.id);
    if (role.built_in) throw new MockHttpError(403, { code: "forbidden", detail: "Built-in roles cannot be deleted." });
    if (withCount(role).users_count) throw conflict(`“${role.name}” is still assigned to users. Remove it from them first.`);
    db.roles = db.roles.filter((x) => x.id !== role.id);
    return noContent();
  });
}
