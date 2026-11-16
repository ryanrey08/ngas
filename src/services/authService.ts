import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import type { AuthUser, LoginCredentials, LoginResponse, MeResponse } from "@/features/auth/types";

/**
 * eNGAS backend authentication (bearer tokens, `/api/v1/engas/auth/*`), called through the
 * same-origin proxy. Always talks to the real backend — there is no mock mode for auth.
 *
 * The backend has no forgot-password or reset-password endpoints, so none are exposed here.
 */
export const authService = {
  /** `POST /auth/login`. The proxy stores the token in an httpOnly cookie and returns the user. */
  async login({ email, password, remember }: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login, { email, password, remember });
    return data;
  },

  /** `GET /auth/me`: the user with roles and effective permissions. */
  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<MeResponse>(API_ENDPOINTS.auth.me);
    return data.data;
  },

  /** `POST /auth/logout`: revokes the current token. The proxy clears the cookie either way. */
  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.logout);
  },
};
