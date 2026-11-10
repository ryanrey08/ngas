import { isMockApi } from "@/config/env";
import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import { delay } from "@/mocks/delay";
import { mockUserFromEmail } from "@/mocks/users";
import type { AuthResponse, LoginCredentials } from "@/features/auth/types";
import type { ApiError } from "@/types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (isMockApi) {
      await delay(700);
      if (credentials.password.length < 8) {
        throw { status: 401, message: "Invalid email or password." } satisfies ApiError;
      }
      return {
        user: mockUserFromEmail(credentials.email),
        accessToken: `mock.${btoa(credentials.email)}.${Date.now()}`,
        expiresAt: Date.now() + 1000 * 60 * 60 * 8,
      };
    }
    const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.login, credentials);
    return data;
  },

  async logout(): Promise<void> {
    if (isMockApi) {
      await delay(150);
      return;
    }
    await apiClient.post(API_ENDPOINTS.auth.logout);
  },

  async requestPasswordReset(email: string): Promise<void> {
    if (isMockApi) {
      await delay(800);
      return;
    }
    await apiClient.post(API_ENDPOINTS.auth.forgotPassword, { email });
  },
};
