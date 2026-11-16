import type { AuthState } from "./types";

type WithAuth = { auth: AuthState };

export const selectAuth = (s: WithAuth) => s.auth;
export const selectCurrentUser = (s: WithAuth) => s.auth.user;
export const selectIsAuthenticated = (s: WithAuth) => s.auth.isAuthenticated;
export const selectAuthLoading = (s: WithAuth) => s.auth.isLoading;
export const selectAuthInitialized = (s: WithAuth) => s.auth.isInitialized;
export const selectAuthError = (s: WithAuth) => s.auth.error;
