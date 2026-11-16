import { createAsyncThunk } from "@reduxjs/toolkit";
import { normalizeError } from "@/lib/axios";
import { authService } from "@/services/authService";
import type { ApiError } from "@/types";
import { isInvalidCredentialsError } from "./authUtils";
import type { AuthState, AuthUser, LoginCredentials } from "./types";

type ThunkConfig = { state: { auth: AuthState }; rejectValue: ApiError };

/** Sign in, then use the user returned by the login response (same shape as `/auth/me`). */
export const login = createAsyncThunk<AuthUser, LoginCredentials, ThunkConfig>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { user } = await authService.login(credentials);
      return user;
    } catch (err) {
      const error = normalizeError(err);
      // Wrong password, unknown email and disabled account share one generic 422 from the backend.
      if (error.status === 422 && isInvalidCredentialsError(error.errors)) {
        return rejectWithValue({ ...error, code: "invalid_credentials", message: "Invalid email or password.", errors: undefined });
      }
      if (error.status === 422) return rejectWithValue({ ...error, message: "Please check the highlighted fields." });
      return rejectWithValue(error);
    }
  },
  // Prevents double submissions while a request is in flight.
  { condition: (_, { getState }) => !getState().auth.isLoading },
);

/** Restore the session on load / refresh by asking the backend who the token belongs to. */
export const fetchCurrentUser = createAsyncThunk<AuthUser, void, ThunkConfig>(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.me();
    } catch (err) {
      return rejectWithValue(normalizeError(err));
    }
  },
  { condition: (_, { getState }) => !getState().auth.isLoading },
);

/** Revoke the token. Local sign-out always succeeds, even if the backend is unreachable. */
export const logout = createAsyncThunk<void, void, ThunkConfig>("auth/logout", async () => {
  try {
    await authService.logout();
  } catch {
    // The proxy clears the cookie regardless; nothing else to do.
  }
});
