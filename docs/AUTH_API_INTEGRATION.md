# eNGAS Authentication API Integration

This document describes the **real** authentication API of the NGAS backend
(`~/Desktop/backend/backend-api/backend-api`, Laravel 12 / PHP 8.5) and how
`ngas-frontend` uses it. All facts below come from the backend's source code
(`routes/api.php`, `SystemAuthController`, `LoginRequest`,
`CurrentSystemUserResource`, `IssueSystemToken`, `SystemTokenGuard`,
`ApiExceptionRenderer`, `config/cors.php`, `config/api.php`) and its feature
tests (`tests/Feature/Auth/SystemAuthenticationTest.php`). No backend file was
changed.

## 1. Mechanism

| | |
|---|---|
| Type | **Stateless bearer tokens**, one guard per system (`auth:engas`). Not Sanctum SPA cookies, not JWT, not Passport. |
| Token format | `{id}\|engas_{48 chars}`, stored hashed (SHA-256) in the eNGAS database. A token works only on the system that issued it. |
| Lifetime | `API_TOKEN_TTL_MINUTES`, default **720 min (12 h)**. Returned as `expires_at`. |
| Refresh | **None.** There is no refresh endpoint; when the token expires the user signs in again. |
| Sessions / CSRF | None in the API group ("Stateless token API: no cookies, sessions or CSRF"). |
| CORS | Only origins listed in `CORS_ALLOWED_ORIGINS` (currently **empty** in the backend `.env`), `supports_credentials: false`. |
| Rate limits | Login: 5/min per system+email+IP and 20/min per IP. Everything else: 120/min per IP. 429 includes `Retry-After`. |
| Disabled accounts | Disabling a user revokes all their tokens immediately (next call → 401). |

Base URL for eNGAS: `http://localhost:8080/api/v1/engas` (`make up` serves nginx on port 8080).

## 2. Endpoints used

### POST `/api/v1/engas/auth/login`

* Auth: none. Throttled (`throttle:auth`).
* Request (JSON):

| Field | Rules |
|---|---|
| `email` | required, string, `email:rfc`, max 255 (lower-cased and trimmed by the backend) |
| `password` | required, string, max 255 |
| `device_name` | optional, string, max 64, `[\pL\pN ._-]+`. Default `api`. The frontend sends `eNGAS Web`. |

* 200 response:

```json
{
  "token_type": "Bearer",
  "access_token": "12|engas_…",
  "expires_at": "2026-11-13T14:00:00+00:00",
  "user": { …CurrentUser… }
}
```

* Errors: **422** `validation_failed` for missing/invalid fields. Wrong password,
  unknown email and **disabled account** all return the same **422** with
  `errors.email = ["These credentials do not match our records."]` (same timing,
  no account enumeration). **429** when throttled.
* Frontend: `authService.login()` → `POST /api/backend/auth/login`
  (`src/app/api/backend/auth/login/route.ts`).

### GET `/api/v1/engas/auth/me`

* Auth: `Authorization: Bearer <token>`.
* 200 response (wrapped in `data`):

```json
{
  "data": {
    "id": "01J…",                       // ULID
    "name": "Jane Cruz",
    "email": "jane@agency.gov",
    "is_active": true,
    "system": { "key": "engas", "name": "eNGAS" },
    "roles": [ { "id": "01J…", "key": "super_admin", "name": "Super Admin" } ],
    "last_login_at": "2026-11-13T01:00:00+00:00",   // or null
    "created_at": "2026-11-01T00:00:00+00:00",
    "is_super_admin": true,
    "permissions": ["users.view", "users.create", "…"]
  }
}
```

  The login response's `user` has the same fields, without the `data` wrapper.
* Errors: **401** `unauthenticated` (missing, expired, tampered, revoked, other-system token or disabled account).
* Frontend: `authService.me()` → `GET /api/backend/auth/me` (generic proxy route).

### POST `/api/v1/engas/auth/logout`

* Auth: bearer token. Revokes **only the current token**.
* 204 No Content. 401 if the token is already invalid.
* Frontend: `authService.logout()` → `POST /api/backend/auth/logout`
  (`src/app/api/backend/auth/logout/route.ts`), which always clears the cookie.

### Roles and permissions

* Built-in roles: `super_admin` (all permissions) and `admin`. Custom roles have `key: null`.
* Permissions (`App\Enums\Permission`): `users.view`, `users.create`,
  `users.deactivate`, `roles.view`, `roles.manage`, `roles.assign`,
  `reports.view`, `reports.share`.
* There are **no accounting permissions** (journals, COA, payables…) in the backend yet.

## 3. Error format

Every error is RFC 9457 `application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Unprocessable Content",
  "status": 422,
  "code": "validation_failed",
  "detail": "The given data was invalid.",
  "request_id": "…",
  "errors": { "email": ["…"] }
}
```

Codes seen by auth: `validation_failed` (422), `unauthenticated` (401),
`forbidden` (403), `too_many_requests` (429), `server_error` (500, details hidden
unless `APP_DEBUG`). The proxy adds `backend_unavailable` (503) and
`backend_timeout` (504) when the backend cannot be reached.

`normalizeError()` in `src/lib/axios.ts` turns these into a safe `ApiError`
(`status`, `message`, `code`, `errors`, `requestId`, `retryAfter`). 5xx bodies
are never shown to users.

## 4. Unsupported features

| Feature | Status |
|---|---|
| Forgot password | **No endpoint.** The `/forgot-password` page explains that passwords are managed by an administrator. No mock success. |
| Reset password | **No endpoint.** No reset page was created. |
| Token refresh | **No endpoint.** Users sign in again after 12 h. |
| Self-service profile update | **No endpoint.** The Settings profile card is read-only and shows `/auth/me` data. |
| Position / office / phone | Not part of the backend user. Removed from the profile UI. |

Admin-side password handling that does exist: `POST /users` returns a one-time
`temporary_password`, and `php artisan system:create-user` prints one.

## 5. How the frontend handles the token

The backend README says to keep the token out of `localStorage`, and the backend
does not allow browser origins by default. The frontend therefore talks to the
backend **through a same-origin Next.js proxy** (`src/app/api/backend`):

```
Browser ──(same origin, httpOnly cookie)──▶ Next.js /api/backend/* ──(Authorization: Bearer)──▶ Laravel /api/v1/engas/*
```

* **Login** (`/api/backend/auth/login`): forwards `email`, `password` and `device_name`,
  stores `access_token` in the **httpOnly** cookie `ngas_token` (`SameSite=Lax`,
  `Secure` over HTTPS) and returns only `{ user, expires_at }`. "Remember me" makes
  the cookie expire at `expires_at`. Without it, the cookie lasts for the browser session.
* **Every other call** (`/api/backend/[...path]`): adds the bearer token from the
  cookie. A backend 401 deletes the cookie.
* **Logout**: revokes the token on the backend, then deletes the cookie whatever the result.
* **CSRF**: state-changing proxy requests must carry an `Origin` header matching the host.
* Browser JavaScript never sees the token, and nothing about the user is persisted.
  On load the session is restored with `GET /auth/me`.
* Passwords and tokens are never logged.
* Rate limiting note: the backend sees the Next.js server's IP. Behind a production
  reverse proxy, configure the forwarding so per-IP limits still apply per client.

## 6. Frontend implementation map

| Concern | File |
|---|---|
| Public env / API base | `src/config/env.ts` |
| Endpoint paths, cookie name, protected routes | `src/lib/constants.ts` |
| Axios instance, error normalisation, 401 handling | `src/lib/axios.ts` |
| Server-side proxy helpers | `src/lib/server/backend.ts` |
| Proxy routes | `src/app/api/backend/auth/login/route.ts`, `…/auth/logout/route.ts`, `…/[...path]/route.ts` |
| Auth service | `src/services/authService.ts` |
| Types | `src/features/auth/types.ts` |
| Thunks (`login`, `fetchCurrentUser`, `logout`) | `src/features/auth/authThunks.ts` |
| Slice / selectors / utils | `src/features/auth/authSlice.ts`, `authSelectors.ts`, `authUtils.ts` |
| Store (resets user data on sign-out, auth not persisted) | `src/store/index.ts`, `src/store/provider.tsx` |
| Route guard (cookie presence) | `src/middleware.ts` |
| Session check before render | `src/features/auth/components/AuthGate.tsx`, `src/app/(dashboard)/layout.tsx` |
| Permission-based navigation | `src/config/navigation.ts` (`hasPermission`, `filterNavigation`), `src/hooks/usePermission.ts` |
| UI | `LoginForm.tsx`, `ForgotPasswordForm.tsx`, `UserProfileDropdown.tsx`, `ProfileForm.tsx`, `src/components/ui/Alert.tsx` |

Navigation mapping: **Users & Roles** requires backend `users.view` (or super
admin). Accounting modules have no backend permission yet, so every active
signed-in user sees them. The backend still authorises every request.

## 7. Environment variables

| Variable | Where | Value |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | browser | `/api/backend` (the proxy) |
| `NEXT_PUBLIC_API_TIMEOUT` | browser | `15000` |
| `NEXT_PUBLIC_API_MODE` | browser | `mock` for the data modules that have no backend endpoints. Auth ignores it. |
| `NGAS_BACKEND_API_URL` | **server only** | `http://localhost:8080/api/v1/engas` |
| `NGAS_BACKEND_TIMEOUT_MS` | server only | `15000` |

No backend secret is needed by the frontend.

## 8. Running against the real backend

The backend's containers had never been created on this machine. Starting it
needs `make build`, `make install`, `make db-provision`, `make migrate` and
`system:create-user`, which were out of scope (no migrations, seeding or
dependency changes). Once the backend is running:

```bash
cd ngas-frontend
npm run build && npm start      # or npm run dev
```

Sign in at `http://localhost:3000/login` with an account from
`php artisan system:create-user engas …`. Because the frontend calls the backend
server-to-server, `CORS_ALLOWED_ORIGINS` does not need changing.
