# eNGAS Frontend — New Government Accounting System

Web frontend for **eNGAS**, implemented from the "NGAS Mockup Screens" Canva design and the official NGAS logo (`public/logo/ngas-logo.png`).

Visual language taken from the mockups: dark sidebar with the logo on a white block, expandable module menus and building art; white header with institution switcher, notifications and user menu; page headers with a red outlined icon, building banner and red pill tabs; navy table headers, pastel stat tiles, blue Search/Save/Generate buttons, green Post/New buttons, and modals with a red gradient header. Brand red `#D7191F` / `#A81218`, near-black `#141414`, Montserrat headings, Inter body text.

## Modules and screens

| Module | Route | Screens |
| --- | --- | --- |
| Home | `/dashboard` | Hero, module hub, quick links, system summary, recent activities |
| Double Entry | `/double-entry/*` | **Transaction Entry** (dynamic debit/credit lines, balance check, Save Draft / Post), **Posted Entries** (filters, view, print, reverse), **Journal Inquiry** (row selection with entry details), Auto Journal, Templates |
| Accrual System | `/accrual/*` | **Accrual Entry** form, Adjusting Entries, Accrued Expenses/Revenues, Amortization, Deferral, Accrual Inquiry |
| Revised COA (RCA) | `/coa/*` | **Chart of Accounts** tree with details panel and **New Account** modal; Account Groups, Classes, Types, COA Mapping, History |
| Journals & Books | `/journals/*` | CRJ, CDJ, CkDJ, GJ, GL, SL with a book side menu and stat tiles |
| Cash Managements | `/cash/*` | Cash transactions, receipts, disbursements, bank reconciliation, petty cash, cash position, NCA/TRA/NTA tracking |
| Accounts Receivables | `/receivables/*` | **Collections overview** (trend and donut charts), receivables, collections, adjustments, aging, reports |
| Accounts Payables | `/payables/*` | **Overview** (aging table, distribution donut, trend, quick actions), suppliers, invoices, DVs, withholding tax, aging, reports |
| Financial Reports | `/financial-reports/*` | **Report catalog** with categories, favorites, Generate → preview with Excel export; categories, templates, scheduled |
| References & Setup | `/setup/*`, `/users`, `/settings` | Fund clusters, departments, users & roles (permission matrix), profile settings |

Modules, tabs, sidebar menus and breadcrumbs are all generated from **`src/config/modules.ts`**. Most list tabs use the config-driven `RecordListView` (`src/features/modules/listConfigs.ts` + `src/mocks/moduleLists.ts`). The richer screens are dedicated components (the entries in bold above).

## Tech stack

- **Next.js 15.5** (App Router, `src/` dir, `src/middleware.ts`) + **React 19** + **TypeScript (strict)**
- **Tailwind CSS v4** (design tokens in `src/app/globals.css` via `@theme`)
- **Redux Toolkit** + **react-redux** + **redux-persist**
- **react-hook-form** + **zod** (`@hookform/resolvers`)
- **axios** (single configured instance), **recharts**, **lucide-react**

> Requires Node.js ≥ 20.18. Tailwind is pinned to `4.3.3`: newer 4.3.x releases depend on an ESM-only `magic-string`, which breaks `next build` on Node 20.18. On Node ≥ 20.19 or 22 you can upgrade.

## Getting started

```bash
cp .env.example .env.local   # already present in a fresh checkout of this folder
npm install
npm run dev                  # http://localhost:3000
```

**Demo login (mock mode):** use any valid email and a password of at least 8 characters. The role comes from the email: include `viewer`, `budget` or `accountant` to preview those roles; any other email signs you in as a System Administrator.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (next/core-web-vitals + TypeScript) |
| `npm run typecheck` | `tsc --noEmit` |

## Project structure

```
public/logo/ngas-logo.png            # official logo (next/image + favicon)
src/
  app/
    (auth)/login, forgot-password
    (dashboard)/layout.tsx           # protected shell: sidebar, header, breadcrumbs, footer
    (dashboard)/dashboard            # Home hub
    (dashboard)/<module>/[tab]/page.tsx   # one SSG route per module tab (generateStaticParams)
    (dashboard)/users, settings
    layout.tsx  page.tsx  not-found.tsx  globals.css
  components/
    ui/        Button, Card, SectionCard, StatTile, Modal, ConfirmationDialog, StatusBadge,
               Avatar, SearchInput, FilterDropdown, LoadingSpinner, EmptyState, ErrorState, Toaster
    forms/     FormInput, FormSelect, FormTextarea, DatePicker
    tables/    DataTable (generic, sortable, paginated, selectable rows, totals), Pagination
    layout/    Sidebar, Header, InstitutionSelector, NotificationDropdown, UserProfileDropdown,
               Breadcrumbs, ModuleTabs, ModulePage, DashboardShell
    shared/    Logo, PageHeader/PageBody, BuildingArt, SplashScreen, chart palette
  features/
    auth/ home/ journal/ coa/ receivables/ payables/ financial-reports/ users/ settings/
    modules/   generic list screens: types, listConfigs, RecordListView, TabActions, cells
  services/    authService, journalService, coaService, moduleService, notificationService, userService
  mocks/       all mock data (journal entries, COA, module lists, overviews, reports, users)
  store/       index.ts, provider.tsx, hooks.ts, storage.ts, slices/ (ui, notifications)
  config/      env.ts, modules.ts, navigation.ts, institutions.ts
  lib/         axios.ts, utils.ts, constants.ts, session.ts, events.ts
  hooks/       useAsyncData, useDebounce, useClickOutside, usePermission, usePageCommand
  middleware.ts
```

## State management

| Slice | Contents | Persisted? |
| --- | --- | --- |
| `auth` | user, accessToken, expiry, status; `login`/`logout` thunks | only `user` + `expiresAt`. The **token stays in memory only** |
| `ui` | sidebarCollapsed, mobileNavOpen, toasts, selected institution | `sidebarCollapsed`, `institutionId` |
| `notifications` | list, mark read / mark all read | no |
| `home` | system summary (`fetchHomeSummary`) | no |
| `journal` | journal entries; `fetch` / `create` (draft or post) / `reverse` thunks | no |
| `coa` | chart of accounts; `fetchAccounts` / `createAccount` | no |

Read-only list screens fetch through services with `useAsyncData` and keep their filter state locally, which avoids unnecessary global state. Header buttons (Export to Excel, New, Generate) talk to the view below through a small window-event bridge (`lib/events.ts`). Entry forms are submitted by header buttons via the HTML `form` attribute.

`StoreProvider` (root layout) creates the store once per client, wires the axios interceptors and wraps the app in `PersistGate`. `storage.ts` falls back to a no-op storage on the server.

## Authentication and route protection

- On login, the app sets a **non-sensitive** `ngas_session=1` cookie (30 days with "Remember me", otherwise a session cookie). `src/middleware.ts` uses it to redirect signed-out users to `/login?from=…`, and signed-in users away from `/login`. Logout and 401 responses clear it.
- The access token is never written to storage or cookies by the frontend.
- **For a real backend:** issue the session/refresh token as an `httpOnly; Secure; SameSite` cookie (axios uses `withCredentials: true`), have middleware validate that cookie instead of the marker, and add a refresh-token flow in `lib/axios.ts`.
- Navigation entries and actions are filtered by role permissions (`config/navigation.ts`, `usePermission`); for example, the Viewer role sees no Save/Post/New buttons. Real authorization must still be enforced by the API.

## Switching to a real backend

1. In `.env.local`:
   ```
   NEXT_PUBLIC_API_MODE=real
   NEXT_PUBLIC_API_BASE_URL=https://your-api.example.gov.ph/api
   ```
2. Implement the endpoints listed in `src/lib/constants.ts` → `API_ENDPOINTS`:
   - `POST /auth/login` returning `{ user, accessToken, expiresAt }`
   - `GET/POST /journal-entries` and `POST /journal-entries/:id/reverse`
   - `GET/POST /coa/accounts`
   - `GET /dashboard/summary`, `/receivables/overview`, `/payables/overview` and `/financial-reports`
   - the generic list endpoints `GET /<module>/<tab>` (for example `/payables/invoices`)

   Response shapes are the TypeScript types in `src/features/*/types.ts`.
3. Each service in `src/services/` already has a real branch that uses the shared `apiClient`. No component changes are needed.

`apiClient` (`src/lib/axios.ts`) adds `Authorization: Bearer <token>` from the store, turns errors into `{ status, message, errors }`, and on **401** logs the user out and redirects to `/login`.

## Accessibility and responsiveness

The app uses semantic landmarks and a skip link, labelled controls with `aria-invalid` and `aria-describedby` errors, `aria-sort` on sortable headers, and `aria-current` on active nav and pagination. Modals trap focus, close on Esc or backdrop click, and restore focus when closed. Focus rings are visible. On mobile the sidebar becomes a drawer, and tables scroll horizontally inside their cards.
