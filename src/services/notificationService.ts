import { isMockApi } from "@/config/env";
import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import { delay } from "@/mocks/delay";
import { MOCK_NOTIFICATIONS } from "@/mocks/notifications";
import type { Notification } from "@/types";

export const notificationService = {
  async list(): Promise<Notification[]> {
    if (isMockApi) {
      await delay(300);
      return MOCK_NOTIFICATIONS;
    }
    const { data } = await apiClient.get<Notification[]>(API_ENDPOINTS.notifications);
    return data;
  },

  async markAllRead(): Promise<void> {
    if (isMockApi) return;
    await apiClient.post(`${API_ENDPOINTS.notifications}/read-all`);
  },
};
