import { isMockApi } from "@/config/env";
import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import { delay } from "@/mocks/delay";
import { MOCK_USERS } from "@/mocks/users";
import type { ManagedUser } from "@/features/users/types";

export const userService = {
  async list(): Promise<ManagedUser[]> {
    if (isMockApi) {
      await delay();
      return MOCK_USERS;
    }
    const { data } = await apiClient.get<ManagedUser[]>(API_ENDPOINTS.users);
    return data;
  },
};
