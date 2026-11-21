import type { Notification } from "@/types";

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n-1", title: "Disbursement voucher for approval", message: "DV-2026-0215 (₱150,000.00) is awaiting your approval.", createdAt: "2026-11-10T01:30:00Z", read: false, type: "warning", href: "/payables/disbursements" },
  { id: "n-2", title: "NCA received", message: "Notice of Cash Allocation for 101 – General Fund has been credited.", createdAt: "2026-11-09T22:10:00Z", read: false, type: "success", href: "/cash/direct-tracking" },
  { id: "n-3", title: "Trial balance generated", message: "October 2026 trial balance is ready for download.", createdAt: "2026-11-09T06:00:00Z", read: false, type: "info", href: "/financial-reports/list" },
  { id: "n-4", title: "Journal entry returned", message: "GJ-2026-1045 was reversed and returned for correction.", createdAt: "2026-11-08T03:45:00Z", read: true, type: "warning", href: "/double-entry/posted" },
  { id: "n-5", title: "Scheduled maintenance", message: "eNGAS will be unavailable on Nov 15, 10:00 PM – 12:00 MN.", createdAt: "2026-11-06T09:00:00Z", read: true, type: "info" },
];
