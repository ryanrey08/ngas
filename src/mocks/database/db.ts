/**
 * The in-browser mock database: ONE source of truth for every screen in mock mode.
 *
 * Seeded once from src/mocks/fixtures, then mutated by the mock handlers for the rest of the
 * session (until a full page reload), so a record created or approved on one page shows up —
 * with the same id — on every other page that reads it. Never import this from UI code: pages
 * talk to it only through RTK Query → mockBaseQuery → handlers, exactly like a real backend.
 */
import type { Account } from "@/features/coa/types";
import type { ReportDef } from "@/features/financial-reports/types";
import type { RecentActivity } from "@/features/home/types";
import type { JournalEntry } from "@/features/journal/types";
import type { Row } from "@/features/modules/types";
import type { PermissionDef, SystemRole, SystemUser } from "@/features/users/types";
import type { HistoryEntry } from "@/services/api/apiTypes";
import type { Notification } from "@/types";
import { MOCK_ACCOUNTS } from "../fixtures/coa";
import { MOCK_RECENT_REPORTS, MOCK_REPORT_DEFS } from "../fixtures/financialReports";
import { MOCK_JOURNAL_ENTRIES } from "../fixtures/journalEntries";
import { MODULE_LISTS } from "../fixtures/moduleLists";
import { MOCK_NOTIFICATIONS } from "../fixtures/notifications";
import { MOCK_ACTIVITIES, MOCK_INSTITUTIONS, MOCK_SETTINGS } from "../fixtures/organization";
import { MOCK_PERMISSIONS, MOCK_ROLES, MOCK_USERS } from "../fixtures/users";

export type MockRow = Row & { id: string };

const clone = <T,>(v: T): T => structuredClone(v);

/** Stable, readable ids for the generic module rows: "payables-disbursements-3". */
function withIds(resource: string, rows: Row[]): MockRow[] {
  const slug = resource.replace("/", "-");
  return rows.map((r, i) => ({ ...r, id: `${slug}-${i + 1}` }));
}

function seed() {
  return {
    journalEntries: clone(MOCK_JOURNAL_ENTRIES) as JournalEntry[],
    accounts: clone(MOCK_ACCOUNTS) as Account[],
    records: Object.fromEntries(Object.entries(MODULE_LISTS).map(([k, rows]) => [k, withIds(k, clone(rows))])) as Record<string, MockRow[]>,
    /** Status history per record, keyed "<resource>::<id>". */
    history: {} as Record<string, HistoryEntry[]>,
    notifications: clone(MOCK_NOTIFICATIONS) as Notification[],
    activities: clone(MOCK_ACTIVITIES) as RecentActivity[],
    users: clone(MOCK_USERS) as SystemUser[],
    roles: clone(MOCK_ROLES) as SystemRole[],
    permissions: clone(MOCK_PERMISSIONS) as PermissionDef[],
    reports: {
      defs: clone(MOCK_REPORT_DEFS) as ReportDef[],
      recent: clone(MOCK_RECENT_REPORTS) as Array<{ name: string; at: string }>,
      favorites: new Set(["FR-001", "FR-007"]),
    },
    institutions: clone(MOCK_INSTITUTIONS),
    settings: clone(MOCK_SETTINGS),
    seq: { journal: 1049, account: 1000, record: 1000, user: 100, role: 100, activity: 100, notification: 100 },
  };
}

export type MockDb = ReturnType<typeof seed>;

export let db: MockDb = seed();

/** Restore the seed data (exposed as `window.ngasMock.reset()` in development). */
export function resetDb() {
  db = seed();
}

export const nextId = (key: keyof MockDb["seq"], prefix: string) => `${prefix}-${++db.seq[key]}`;

export const nowIso = () => new Date().toISOString();
/** Today in the browser's time zone, yyyy-mm-dd. */
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function logActivity(title: string, reference: string) {
  db.activities.unshift({ id: nextId("activity", "ra"), title, reference, at: nowIso() });
  db.activities = db.activities.slice(0, 20);
}

export function notify(n: Omit<Notification, "id" | "createdAt" | "read">) {
  db.notifications.unshift({ ...n, id: nextId("notification", "n"), createdAt: nowIso(), read: false });
}

export function pushHistory(resource: string, id: string, entry: HistoryEntry) {
  const key = `${resource}::${id}`;
  (db.history[key] ??= []).unshift(entry);
}
