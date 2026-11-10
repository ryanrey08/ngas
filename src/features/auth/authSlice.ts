import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { normalizeError } from "@/lib/axios";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { authService } from "@/services/authService";
import type { ApiError, AsyncStatus, User } from "@/types";
import type { AuthResponse, LoginCredentials } from "./types";

export interface AuthState {
  user: User | null;
  /** Kept in memory only — NOT persisted (see store/index.ts). */
  accessToken: string | null;
  expiresAt: number | null;
  status: AsyncStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  expiresAt: null,
  status: "idle",
  error: null,
};

export const login = createAsyncThunk<AuthResponse, LoginCredentials, { rejectValue: ApiError }>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authService.login(credentials);
      setSessionCookie(credentials.remember);
      return res;
    } catch (err) {
      return rejectWithValue(normalizeError(err));
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await authService.logout();
  } catch {
    // Logging out locally must always succeed even if the API call fails.
  } finally {
    clearSessionCookie();
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Local, synchronous sign-out (used by the 401 interceptor). */
    sessionExpired(state) {
      clearSessionCookie();
      Object.assign(state, initialState, { error: "Your session has expired. Please sign in again." });
    },
    updateProfile(state, action: PayloadAction<Partial<Pick<User, "name" | "position" | "office" | "phone">>>) {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.expiresAt = action.payload.expiresAt;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message ?? "Unable to sign in. Please try again.";
      })
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { sessionExpired, updateProfile, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
