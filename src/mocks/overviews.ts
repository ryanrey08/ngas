import type { HomeSummary } from "@/features/home/types";
import type { PayablesOverview } from "@/features/payables/types";
import type { ReceivablesOverview } from "@/features/receivables/types";
import { MODULE_LISTS } from "./moduleLists";

export const MOCK_HOME_SUMMARY: HomeSummary = {
  transactionsToday: 25,
  receiptsMtd: 12_450_000,
  disbursementsMtd: 10_780_000,
  cashBalance: 1_670_000,
  recentActivities: [
    { id: "ra-1", title: "Posted General Journal Entry", reference: "GJ No. GJ-2026-0048", at: "2026-11-10T07:35:00Z" },
    { id: "ra-2", title: "Recorded Cash Receipt", reference: "CRJ No. CRJ-2026-0102", at: "2026-11-10T06:10:00Z" },
    { id: "ra-3", title: "Processed Disbursement Voucher", reference: "DV No. DV-2026-0217", at: "2026-11-10T03:40:00Z" },
    { id: "ra-4", title: "Generated Trial Balance", reference: "October 2026 – Fund 101", at: "2026-11-09T09:15:00Z" },
  ],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const BILLED = [5.2, 6.1, 7.4, 6.8, 8.2, 9.1, 8.7, 9.8, 10.4, 11.6, 12.45];
const COLLECTED = [2.6, 3.4, 4.3, 4.4, 5.1, 6.0, 5.9, 6.6, 7.1, 7.4, 7.89];

export const MOCK_RECEIVABLES_OVERVIEW: ReceivablesOverview = {
  totalBilled: 12_450_000,
  totalCollected: 7_890_000,
  collectionRate: 63.4,
  uncollected: 4_560_000,
  overdue: 1_670_000,
  trend: MONTHS.map((month, i) => ({
    month,
    billed: Math.round(BILLED[i] * 1_000_000),
    collected: Math.round(COLLECTED[i] * 1_000_000),
    rate: Math.round((COLLECTED[i] / BILLED[i]) * 1000) / 10,
  })),
  byCustomer: [
    { name: "CHED", value: 2_998_200 },
    { name: "LGU Marikina", value: 1_743_600 },
    { name: "DOST – TAPI", value: 1_499_100 },
    { name: "Makati DepEd", value: 906_400 },
    { name: "Others", value: 742_700 },
  ],
  collections: MODULE_LISTS["receivables/collections"],
};

export const MOCK_PAYABLES_OVERVIEW: PayablesOverview = {
  total: 12_450_000,
  buckets: { current: 7_280_000, d30: 2_340_000, d60: 1_350_000, d90: 1_480_000 },
  agingBySupplier: MODULE_LISTS["payables/aging"],
  distribution: [
    { name: "Current (0 – 30 days)", value: 7_280_000 },
    { name: "31 – 60 days", value: 2_340_000 },
    { name: "61 – 90 days", value: 1_350_000 },
    { name: "Over 90 days", value: 1_480_000 },
  ],
  trend: [
    { month: "Jun 2026", balance: 6_900_000 },
    { month: "Jul 2026", balance: 7_800_000 },
    { month: "Aug 2026", balance: 8_600_000 },
    { month: "Sep 2026", balance: 9_700_000 },
    { month: "Oct 2026", balance: 10_900_000 },
    { month: "Nov 2026", balance: 12_450_000 },
  ],
  recent: [
    { ref: "AP-2026-00548", party: "Meralco", amount: 250_000, date: "2026-11-26", status: "Posted" },
    { ref: "DV-2026-0217", party: "PLDT Inc.", amount: 180_000, date: "2026-11-25", status: "Posted" },
    { ref: "AP-2026-00547", party: "Canon Phils.", amount: 150_000, date: "2026-11-25", status: "Posted" },
    { ref: "WT-2026-0031", party: "Akari Corp.", amount: 24_000, date: "2026-11-24", status: "Posted" },
  ],
};
