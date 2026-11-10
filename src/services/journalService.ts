import { isMockApi } from "@/config/env";
import type { JournalEntry, JournalEntryInput } from "@/features/journal/types";
import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import { delay } from "@/mocks/delay";
import { MOCK_JOURNAL_ENTRIES } from "@/mocks/journalEntries";
import type { ApiError } from "@/types";

let mockDb: JournalEntry[] = [...MOCK_JOURNAL_ENTRIES];
let seq = 1049;

const PREFIX: Record<string, string> = {
  "General Journal (GJ)": "GJ",
  "Cash Receipts (CRJ)": "CRJ",
  "Cash Disbursements (CDJ)": "CDJ",
  "Check Disbursements (CkDJ)": "CkDJ",
};

export function nextTransactionNo(kind: JournalEntry["kind"], journalType: string, date: string): string {
  const prefix = kind === "accrual" ? "ACR" : (PREFIX[journalType] ?? "GJ");
  return `${prefix}-${date.slice(0, 4)}-${String(seq).padStart(4, "0")}`;
}

export const journalService = {
  async list(): Promise<JournalEntry[]> {
    if (isMockApi) {
      await delay();
      return [...mockDb];
    }
    const { data } = await apiClient.get<JournalEntry[]>(API_ENDPOINTS.journalEntries);
    return data;
  },

  async create(input: JournalEntryInput, user: string): Promise<JournalEntry> {
    if (isMockApi) {
      await delay(600);
      const debit = input.lines.reduce((s, l) => s + l.debit, 0);
      const credit = input.lines.reduce((s, l) => s + l.credit, 0);
      if (input.status === "Posted" && Math.abs(debit - credit) > 0.005) {
        throw { status: 422, message: "Entry is not balanced (Debit ≠ Credit)." } satisfies ApiError;
      }
      const now = new Date().toISOString();
      const created: JournalEntry = {
        ...input,
        id: `je-${Date.now()}`,
        transactionNo: nextTransactionNo(input.kind, input.journalType, input.date),
        createdBy: user,
        createdAt: now,
        ...(input.status === "Posted" ? { postedBy: user, postedAt: now } : {}),
      };
      seq += 1;
      mockDb = [created, ...mockDb];
      return created;
    }
    const { data } = await apiClient.post<JournalEntry>(API_ENDPOINTS.journalEntries, input);
    return data;
  },

  /** Reversal creates a contra entry server-side; the original is flagged "Reversed". */
  async reverse(id: string): Promise<JournalEntry> {
    if (isMockApi) {
      await delay(400);
      const e = mockDb.find((x) => x.id === id);
      if (!e) throw { status: 404, message: "Journal entry not found." } satisfies ApiError;
      const updated: JournalEntry = { ...e, status: "Reversed" };
      mockDb = mockDb.map((x) => (x.id === id ? updated : x));
      return updated;
    }
    const { data } = await apiClient.post<JournalEntry>(`${API_ENDPOINTS.journalEntries}/${id}/reverse`);
    return data;
  },

  async remove(id: string): Promise<void> {
    if (isMockApi) {
      await delay(400);
      mockDb = mockDb.filter((x) => x.id !== id);
      return;
    }
    await apiClient.delete(`${API_ENDPOINTS.journalEntries}/${id}`);
  },
};
