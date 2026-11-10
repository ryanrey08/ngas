import { isMockApi } from "@/config/env";
import type { Account, AccountInput } from "@/features/coa/types";
import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import { MOCK_ACCOUNTS } from "@/mocks/coa";
import { delay } from "@/mocks/delay";
import type { ApiError } from "@/types";

let mockDb: Account[] = [...MOCK_ACCOUNTS];

export const coaService = {
  async list(): Promise<Account[]> {
    if (isMockApi) {
      await delay(300);
      return [...mockDb];
    }
    const { data } = await apiClient.get<Account[]>(API_ENDPOINTS.accounts);
    return data;
  },

  async create(input: AccountInput): Promise<Account> {
    if (isMockApi) {
      await delay(500);
      if (mockDb.some((a) => a.code === input.code)) {
        throw { status: 422, message: `Account code ${input.code} already exists.`, errors: { code: ["Already exists"] } } satisfies ApiError;
      }
      const created: Account = { ...input, id: `acc-${Date.now()}`, level: input.code.split(".").length };
      mockDb = [...mockDb, created].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      return created;
    }
    const { data } = await apiClient.post<Account>(API_ENDPOINTS.accounts, input);
    return data;
  },
};
