import type { User } from "@/types";

export interface LoginCredentials {
  email: string;
  password: string;
  remember: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  /** epoch ms */
  expiresAt: number;
}
