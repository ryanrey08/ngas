# API Integration (Redux Toolkit + RTK Query)

Every screen in `ngas-frontend` gets its data through **one RTK Query API slice**. In mock mode the
same requests are answered by an in-browser mock API that follows the backend's conventions, so the
app is fully usable today without backend endpoints, and switching to the real backend is a single
environment variable. The page-by-page checklist is in [API_PAGE_AUDIT.md](API_PAGE_AUDIT.md).

> **Important:** apart from authentication and user/role administration, the endpoints below are
> **expected contracts proposed by the frontend**. They do not exist on the backend yet.

## 1. Architecture

```text
src/
├── store/                          Redux store (unchanged location)
│   ├── index.ts                    makeStore(): auth + ui + api reducers, RTK Query middleware, listeners
│   ├── hooks.ts                    typed useAppDispatch / useAppSelector / useAppStore
│   ├── provider.tsx                one store per app instance (useState initializer), PersistGate
│   └── slices/uiSlice.ts           client-only state: sidebar, drawer, toasts, selected institution
├── features/auth/                  auth slice + thunks (axios, real backend, unchanged)
├── services/
│   ├── authService.ts              login / me / logout (axios → proxy → backend)
│   └── api/
│       ├── apiConfig.ts            mode, base URL, timeout, mock settings, shouldMock(url)
│       ├── baseQuery.ts            real fetchBaseQuery + error normalisation + mock/real router
│       ├── baseApi.ts              createApi({ reducerPath: "api", tagTypes, endpoints: () => ({}) })
│       ├── apiTags.ts              tag types + helpers (recordTag, relatedTags, journalEntryEffects…)
│       ├── apiTypes.ts             Paginated<T>, Envelope<T>, ListParams, toQueryParams/fromQueryParams
│       ├── errors.ts               toApiError(), errorMessage(), fieldErrors()
│       ├── index.ts                re-exports every hook
│       └── endpoints/              injectEndpoints per domain
│           ├── dashboardApi.ts     home summary, AR overview, AP overview
│           ├── notificationsApi.ts
│           ├── settingsApi.ts      institutions, system settings
│           ├── journalApi.ts       journal entries (double entry + accrual)
│           ├── coaApi.ts           chart of accounts
│           ├── recordsApi.ts       the 45 config-driven module registers (one generic resource API)
│           ├── reportsApi.ts       financial report catalog / generation / favorites
│           └── usersApi.ts         users, roles, permissions (real backend contracts)
├── features/modules/
│   ├── listConfigs.ts              columns / filters / tiles of each register
│   ├── recordWorkflows.ts          status transitions per register (shared with the mock server)
│   └── recordForms.ts              create/edit form definitions (shared with the mock server)
└── mocks/
    ├── fixtures/                   seed data (the only place sample data lives)
    ├── database/db.ts              in-memory mock database seeded from fixtures
    ├── handlers/                   mock REST handlers (router, journal+COA, records, overview, users)
    └── mockBaseQuery.ts            RTK Query base query that dispatches to the handlers
```

**Rules**

- Server data lives only in the RTK Query cache (`state.api`). The old `home`, `journal`, `coa` and
  `notifications` slices and the `*Service` mock switches were removed; nothing copies API data
  into regular slices.
- Regular slices hold client state only: `auth` (the verified user) and `ui`.
- Pages call generated hooks (`useGetRecordsQuery`, `useTransitionRecordMutation`, …). No page
  checks the API mode.
- The store is created once per app instance in `StoreProvider` (`useState(() => makeStore())`).
  Queries only run on the client inside `<AuthGate>`, so there is no server/client data mismatch
  to hydrate. Nothing in `api` is persisted.

## 2. Environment and mode switching

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_MODE` | `mock` | `mock` = in-browser mock API; `real` = every request goes to the backend |
| `NEXT_PUBLIC_API_BASE_URL` | `/api/backend` | Base URL the browser calls. Keep the same-origin proxy (it adds the bearer token from the httpOnly cookie) |
| `NEXT_PUBLIC_API_TIMEOUT` | `15000` | Request timeout (ms) |
| `NEXT_PUBLIC_API_REAL_RESOURCES` | *(empty)* | Mock mode only: path prefixes that still go to the backend, e.g. `users,roles,permissions` |
| `NEXT_PUBLIC_MOCK_DELAY_MS` | `350` | Mock latency (+0–50% jitter) |
| `NEXT_PUBLIC_MOCK_FAILURE_RATE` | `0` | Mock mode: probability (0–1) that a request fails with a 500 |
| `NGAS_BACKEND_API_URL` | `http://localhost:8080/api/v1/engas` | **Server-only.** Where the proxy forwards to |

No secret is ever exposed through `NEXT_PUBLIC_*`. Authentication is always real regardless of the mode.

How a request is routed (`baseQuery.ts`):

1. `shouldMock(url)` — true in mock mode unless the path matches `NEXT_PUBLIC_API_REAL_RESOURCES`.
2. Mock: `mockBaseQuery` is loaded lazily (real-mode bundles never execute it) and answered from `mocks/handlers`.
3. Real: `fetchBaseQuery` → `/api/backend/<path>` → Next.js proxy → backend. Errors come back as
   errors. **There is no fallback to mock data.**

Switching modes: change `NEXT_PUBLIC_API_MODE` and restart `next dev` / rebuild (it is inlined at build time).

## 3. Base query, auth and errors

- `credentials: "include"` sends the httpOnly `ngas_token` cookie to the same-origin proxy, which adds
  `Authorization: Bearer …`. The browser never sees the token, so `prepareHeaders` only sets
  `Accept` and `X-Institution-Id` (the selected agency, forwarded by the proxy; the backend may ignore it).
- Every error is normalised to the app's `ApiError` (`{ status, message, code, errors, requestId, retryAfter }`)
  by `toApiError()`, the same mapper the axios auth client uses, so wording is identical everywhere.
  Problem+json bodies (RFC 9457) are read; 5xx details are never shown.
- **401** from any request calls the shared session-expired handler (clears state, redirects to
  `/login?reason=expired`), exactly like the axios client.
- **422** field errors are mapped onto form fields with `fieldErrors(error)` + react-hook-form `setError`.
- No token refresh: the backend issues 12-hour tokens and has no refresh endpoint.

UI handling, used consistently:

| State | Where |
|---|---|
| Initial load | `isLoading` → spinner / `PageLoader` / table spinner |
| Background refetch | `isFetching` → table dimmed (`DataTable fetching`) while rows stay visible |
| Empty | `EmptyState` (different text for "no matches" vs "no records yet") |
| Network / server / not-found error | `ErrorState` with **Try again** (`refetch`), or an inline banner when stale data is still shown |
| Mutation failure | error toast with the server message; optimistic changes rolled back; never a fake success |
| Duplicate submissions | buttons disabled / `loading` while the mutation runs; handlers return early when in flight. The journal header buttons share the form's mutation state through `fixedCacheKey` |

## 4. Endpoints, hooks and cache tags

Tag types: `Dashboard, Notification, Institution, Settings, JournalEntry, Account, Record,
RecordSummary, Overview, ReportCatalog, GeneratedReport, User, Role, Permission`.

Record tags are namespaced per resource: `Record:"payables/disbursements::LIST"`,
`Record:"payables/disbursements::<id>"`, `RecordSummary:"payables/disbursements"`.

| Hook | Request | Provides / invalidates |
|---|---|---|
| `useGetDashboardSummaryQuery` | `GET /dashboard/summary` | provides `Dashboard` |
| `useGetReceivablesOverviewQuery` | `GET /receivables/overview` | `Overview:receivables` |
| `useGetPayablesOverviewQuery` | `GET /payables/overview` | `Overview:payables` |
| `useGetNotificationsQuery` (polls 60 s, refetch on focus) | `GET /notifications` | `Notification` |
| `useMarkNotificationReadMutation` / `useMarkAllNotificationsReadMutation` | `POST /notifications/{id}/read`, `POST /notifications/read-all` | **optimistic** (`updateQueryData`, undo on failure) |
| `useGetInstitutionsQuery` / `useGetSystemSettingsQuery` | `GET /institutions`, `GET /settings` | `Institution`, `Settings` |
| `useGetJournalEntriesQuery` | `GET /journal-entries` | each `JournalEntry:id` + `JournalEntry:LIST` |
| `useGetJournalEntryQuery` | `GET /journal-entries/{id}` | `JournalEntry:id` |
| `useCreateJournalEntryMutation` | `POST /journal-entries` | `JournalEntry:LIST`, `Dashboard`, the book of its journal type, GL, accrual register |
| `usePostJournalEntryMutation` | `POST /journal-entries/{id}/post` | same + `JournalEntry:id` |
| `useReverseJournalEntryMutation` | `POST /journal-entries/{id}/reverse` | **optimistic** "Reversed" in every cached page + detail, then same as create |
| `useGetAccountsQuery` (no arg = full tree, shared by COA screen and account pickers) | `GET /coa/accounts` | each `Account:id` + `Account:LIST` |
| `useGetAccountQuery` | `GET /coa/accounts/{id}` | `Account:id` |
| `useCreateAccountMutation` / `useUpdateAccountMutation` | `POST /coa/accounts`, `PATCH /coa/accounts/{id}` | `Account:LIST` / `Account:id` (update is **optimistic** in the tree) + `coa/history` list |
| `useGetRecordsQuery({ resource, …ListParams })` | `GET /{resource}` | row tags + resource LIST |
| `useGetRecordSummaryQuery(resource)` | `GET /{resource}/summary` | `RecordSummary:resource` |
| `useGetRecordQuery({ resource, id })` | `GET /{resource}/{id}` (record + status history) | row tag |
| `useLazyExportRecordsQuery` | `GET /{resource}/export` (all filtered rows) | not cached |
| `useCreateRecordMutation` / `useUpdateRecordMutation` | `POST /{resource}`, `PATCH /{resource}/{id}` | resource LIST (+row) + `relatedTags(resource)` |
| `useTransitionRecordMutation` | `POST /{resource}/{id}/{action}` | **optimistic** status in every cached page of that resource; row + LIST + related |
| `useDeleteRecordMutation` | `DELETE /{resource}/{id}` | row + LIST + related |
| `useGenerateAutoJournalMutation` | `POST /double-entry/auto-journal/generate` | journal entry effects |
| `useGetReportCatalogQuery` | `GET /financial-reports/catalog` | `ReportCatalog`, `GeneratedReport` |
| `useGenerateReportMutation` | `POST /financial-reports/{code}/generate` | `GeneratedReport` (refreshes "Recent Reports") |
| `useSetReportFavoriteMutation` | `PUT /financial-reports/{code}/favorite` | **optimistic** |
| `useGetUsersQuery` | `GET /users` | each `User:id` + `User:LIST` |
| `useCreateUserMutation` | `POST /users` | `User:LIST`, `Role:LIST` (users_count) |
| `useSyncUserRolesMutation` | `PUT /users/{id}/roles` | `User:id`, `Role:LIST` |
| `useSetUserActiveMutation` | `POST /users/{id}/activate|deactivate` | **optimistic**, `User:id` |
| `useGetRolesQuery` / `useGetPermissionsQuery` | `GET /roles?per_page=100`, `GET /permissions` | `Role`, `Permission` |
| `useCreateRoleMutation` / `useUpdateRoleMutation` / `useDeleteRoleMutation` | `POST /roles`, `PATCH /roles/{id}`, `DELETE /roles/{id}` | `Role:*` (update **optimistic**, used by the permission matrix) |

### Cross-screen cache rules (`apiTags.ts`)

- `relatedTags(resource)` — a change to a register also refreshes: its summary tiles; the home
  dashboard (journals, cash, double-entry, accrual); the AR or AP overview (receivables/payables);
  releasing a DV refreshes **Cash Transactions** and the **CDJ**; depositing a collection refreshes
  **Receivables**; COA registers refresh the **audit trail**; DV submission refreshes the bell.
- `journalEntryEffects(journalType)` — a new/posted/reversed entry refreshes the journal lists, the
  matching book (GJ/CRJ/CDJ/CkDJ), the General Ledger, the accrual register and the dashboard —
  not unrelated registers.
- Approving a record invalidates its row tag, so the **pending-approval list drops it** immediately
  (it was already removed optimistically from cached pages showing the old status).
- Switching institution invalidates every tag (all cached data belonged to the previous agency).
- Sign-out / session expiry dispatches `api.util.resetApiState()`.

## 5. List parameters (pagination, search, filters, sort)

`ListParams` → query string (`toQueryParams`):

| Param | Query | Example |
|---|---|---|
| page / perPage | `page`, `per_page` | `page=2&per_page=10` |
| search | `search` | `search=meralco` (debounced 300 ms in the UI) |
| sort / order | `sort` (leading `-` = descending) | `sort=-date` |
| status | `filter[status]` | `filter[status]=For Approval` |
| dateFrom / dateTo | `filter[date_from]`, `filter[date_to]` | ISO dates |
| filters | `filter[<key>]` | `filter[fund]=101 - General Fund`, `filter[journal_type]=…` |
| facets | `facets` | `facets=mode,status` → distinct values for the filter dropdowns |

`DataTable` has a server mode (`server={{ total, sort, onSortChange }}`): it renders the current
page only and reports sort clicks; pagination counts `meta.total`.

## 6. Mock API

- **One database** (`mocks/database/db.ts`) seeded once from `mocks/fixtures`. Every page reads the
  same rows with the same ids, and changes persist for the browser session (until a full reload).
- **Handlers** implement the contracts in §7: filtering, search, sorting, Laravel-style pagination
  with `meta.totals` and `meta.facets`, CRUD, workflow transitions (validated against
  `recordWorkflows.ts`, with status history), validation errors (422 with field `errors`),
  not-found (404), invalid state (422), forbidden (403 for built-in roles).
- **Cross-module effects** like a real backend: posting a journal entry writes it to its book and the
  GL; reversing books a contra entry; releasing a DV pays it out of the cash book and the CDJ;
  depositing a collection settles the receivable; COA edits write the audit trail; the dashboard,
  overviews and trial balance are computed from live data.
- **Latency and failures:** `NEXT_PUBLIC_MOCK_DELAY_MS`, `NEXT_PUBLIC_MOCK_FAILURE_RATE`. In
  development the browser console also has `ngasMock.failNext(500)` (or `failNext(422, 2)`),
  `ngasMock.reset()` and `ngasMock.db`.
- Responses are deep-copied, as JSON over the wire would be.

## 7. Expected backend contracts

Conventions (matching the existing Laravel API): JSON, `{ data }` envelopes for single resources,
`paginate()` envelopes `{ data, links, meta: { current_page, per_page, total, last_page, from, to } }`
for lists, problem+json errors, `422` with `errors: { field: [message] }`. All paths are relative to
`/api/v1/engas`.

### Already implemented by the backend

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login`, `/auth/logout`; GET `/auth/me` | used via the proxy (unchanged) |
| GET | `/users?per_page` | **wanted:** `search`, `filter[role_id]`, `filter[is_active]` |
| POST | `/users` `{ name, email, role_ids[] }` | 201 `{ data, temporary_password }` |
| PUT | `/users/{id}/roles` `{ role_ids[] }` | |
| POST | `/users/{id}/activate`, `/users/{id}/deactivate` | |
| GET/POST | `/roles`, GET/PATCH/DELETE `/roles/{id}` | `RoleResource` with `permissions[]`, `users_count`, `built_in` |
| GET | `/permissions` | `{ data: [{ key, description }] }` |

To use them while everything else is mocked: `NEXT_PUBLIC_API_REAL_RESOURCES=users,roles,permissions`.

### Proposed (not on the backend yet)

| Method | Path | Body / query | Response |
|---|---|---|---|
| GET | `/dashboard/summary` | | `{ data: { transactionsToday, receiptsMtd, disbursementsMtd, cashBalance, recentActivities[] } }` |
| GET | `/notifications` · POST `/notifications/{id}/read` · POST `/notifications/read-all` | | `{ data: Notification[] }` |
| GET | `/institutions` | | `{ data: [{ id, name, shortName }] }` |
| GET | `/settings` | | `{ data: { fiscal_year, current_period, currency, fiscal_years[], periods[] } }` |
| GET | `/journal-entries` | list params + `filter[kind]`, `filter[journal_type]`, `filter[department]` | paginated `JournalEntry` |
| GET | `/journal-entries/{id}` | | `{ data: JournalEntry }` |
| POST | `/journal-entries` | `JournalEntryInput` (`status: "Draft" \| "Posted"`) | 201 `{ data }`; 422 for unbalanced posting, invalid/non-postable accounts (`lines.N.accountCode`), duplicate `referenceNo` |
| POST | `/journal-entries/{id}/post` · `/journal-entries/{id}/reverse` | | `{ data }`; 422 when the status does not allow it |
| GET | `/coa/accounts` | `search`, `filter[status]`, `filter[classification]`, `filter[account_type]` | `{ data: Account[] }` (tree, ordered by code) |
| GET | `/coa/accounts/{id}` | | `{ data: Account & { children } }` |
| POST · PATCH | `/coa/accounts`, `/coa/accounts/{id}` | `AccountInput` (code/parent immutable on PATCH) | `{ data }`; 422 duplicate code / UACS, bad parent |
| GET | `/{module}/{tab}` | list params + `facets` | paginated rows + `meta.totals`, `meta.facets` |
| GET | `/{module}/{tab}/summary` | | `{ data: { metric: number } }` (metric keys in `listConfigs.ts` tiles) |
| GET | `/{module}/{tab}/export` | list params (no paging) | `{ data: Row[] }` |
| GET | `/{module}/{tab}/{id}` | | `{ data: Row, history: [{ at, action, from, to, by, remarks }] }` |
| POST | `/{module}/{tab}/{id}/{action}` | `{ remarks? }` (required for reject/return/reverse/cancel) | `{ data: Row }`; 422 if not allowed from the current status |
| POST · PATCH · DELETE | `/{module}/{tab}`, `/{module}/{tab}/{id}` | form fields (`recordForms.ts`) | create/update only for registers with a form; delete drafts only |
| POST | `/double-entry/auto-journal/generate` | | `{ data: { generated, entries: [{ id, transactionNo }] } }` |
| GET | `/receivables/overview`, `/payables/overview` | | see `ReceivablesOverview`, `PayablesOverview` types |
| GET | `/financial-reports/catalog` | | `{ data: { reports: ReportDef[] (with favorite), recent[] } }` |
| POST | `/financial-reports/{code}/generate` | `{ period, fiscal_year }` | `{ data: GeneratedReport }` |
| PUT | `/financial-reports/{code}/favorite` | `{ favorite }` | `{ data }` |

`{module}/{tab}` resources: every list tab in `config/modules.ts` that renders `RecordListView`
(e.g. `payables/disbursements`, `cash/petty-cash`, `journals/gl`). Workflow actions per resource
are listed in `features/modules/recordWorkflows.ts`.

## 8. Connecting a real endpoint

1. Implement the contract above on the backend (or adapt the endpoint's `query`/`transformResponse`
   in `services/api/endpoints/*` if the backend's shape differs — pages don't change).
2. Try it alone first: `NEXT_PUBLIC_API_REAL_RESOURCES=<path prefix>` in mock mode.
3. When all modules are live, set `NEXT_PUBLIC_API_MODE=real` and remove the mock-only variables.
4. Nothing to change in pages, components or the store.

## 9. Verification (2026-11-18)

- `npm run typecheck` and `npm run lint`: clean.
- `next build` (run in a copy of the project so the running dev server's `.next` was untouched): succeeds, all 50 tab pages prerendered.
- Integration script against the real store + endpoints + mock API (44 checks): pagination meta,
  search, server sort, facets, totals; approve → removed from the pending list; invalid
  transitions rejected; reject without remarks → 422; DV release → cash balance tile, Cash
  Transactions, home dashboard and AP overview refetched; DV submit → new notification; journal
  entry validation (unbalanced, unknown account, duplicate reference), create → posted list + GJ
  book refetched; reverse → optimistic + contra entry; double reverse rejected with cache intact;
  auto-journal generate + post draft; COA duplicate/create/update + audit trail; template
  create/validate; read-only register refuses create; user create/duplicate/temporary password,
  role users_count refresh, protected role delete/edit with optimistic rollback; trial balance
  balances; recent reports refresh; 404 handling.
- Real mode (4 checks): requests go to `NEXT_PUBLIC_API_BASE_URL` with the expected query string
  and institution header; a backend 404 surfaces as an error (no mock fallback); a 401 triggers
  the session-expired handler.
- Not done: clicking through the pages in a browser (they require a real backend sign-in).
