import type { Institution } from "@/config/institutions";
import type { SystemSettings } from "@/services/api/endpoints/settingsApi";
import type { RecentActivity } from "@/features/home/types";

/** Agencies the signed-in user can switch between (served by `GET /institutions`). */
export const MOCK_INSTITUTIONS: Institution[] = [
  { id: "mpc", name: "Marikina Polytechnic College", shortName: "MPC" },
  { id: "rsu", name: "Regional State University", shortName: "RSU" },
  { id: "pro", name: "Provincial Government Office", shortName: "PGO" },
];

export const MOCK_SETTINGS: SystemSettings = {
  fiscal_year: 2026,
  current_period: "November 2026",
  currency: "PHP",
  fiscal_years: [2026, 2025],
  periods: ["November 2026", "October 2026", "Q3 2026", "FY 2025"],
};

export const MOCK_ACTIVITIES: RecentActivity[] = [
  { id: "ra-1", title: "Posted General Journal Entry", reference: "GJ No. GJ-2026-1048", at: "2026-11-10T07:35:00Z" },
  { id: "ra-2", title: "Recorded Cash Receipt", reference: "CRJ No. CRJ-2026-000125", at: "2026-11-10T06:10:00Z" },
  { id: "ra-3", title: "Processed Disbursement Voucher", reference: "DV No. DV-2026-0217", at: "2026-11-10T03:40:00Z" },
  { id: "ra-4", title: "Generated Trial Balance", reference: "October 2026 – Fund 101", at: "2026-11-09T09:15:00Z" },
];

/** Historical months for the overview charts (the current month is computed from live data). */
export const RECEIVABLES_TREND_HISTORY = {
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  billed: [5.2, 6.1, 7.4, 6.8, 8.2, 9.1, 8.7, 9.8, 10.4, 11.6],
  collected: [2.6, 3.4, 4.3, 4.4, 5.1, 6.0, 5.9, 6.6, 7.1, 7.4],
};

export const PAYABLES_TREND_HISTORY = [
  { month: "Jun 2026", balance: 6_900_000 },
  { month: "Jul 2026", balance: 7_800_000 },
  { month: "Aug 2026", balance: 8_600_000 },
  { month: "Sep 2026", balance: 9_700_000 },
  { month: "Oct 2026", balance: 10_900_000 },
];
