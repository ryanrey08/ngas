import axios, { AxiosError, type AxiosInstance } from "axios";
import { env } from "@/config/env";
import type { ApiError } from "@/types";

/**
 * The single axios instance for the app. The store is injected at runtime (see
 * `configureApiClient`) to avoid a circular import between the store and services.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  // Lets a real backend use httpOnly session/refresh cookies.
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

type TokenGetter = () => string | null | undefined;
type UnauthorizedHandler = () => void;

let getToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

export function configureApiClient(options: { getToken: TokenGetter; onUnauthorized: UnauthorizedHandler }) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
    const status = err.response?.status ?? 0;
    const message =
      err.response?.data?.message ??
      (status === 0 ? "Unable to reach the server. Check your connection." : err.message);
    return { status, message, errors: err.response?.data?.errors };
  }
  if (error instanceof Error) return { status: 0, message: error.message };
  if (typeof error === "object" && error && "message" in error) {
    const e = error as ApiError;
    return { status: e.status ?? 0, message: e.message, errors: e.errors };
  }
  return { status: 0, message: "An unexpected error occurred." };
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeError(error);
    if (normalized.status === 401) onUnauthorized();
    return Promise.reject(normalized);
  },
);
