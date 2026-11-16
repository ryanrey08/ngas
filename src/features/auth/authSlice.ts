import { createSlice } from "@reduxjs/toolkit";
import { fetchCurrentUser, login, logout } from "./authThunks";
import type { AuthState } from "./types";

/**
 * Auth state is NOT persisted: on every load the session is re-checked with `GET /auth/me`,
 * so the user, roles and permissions always come from the backend.
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** The backend rejected the token (expired, revoked or account disabled). */
    sessionExpired() {
      return { ...initialState, isInitialized: true, error: "Your session has expired. Please sign in again." };
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload?.message ?? "Unable to sign in. Please try again.";
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload?.message ?? "Unable to verify your session.";
      })
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, () => ({ ...initialState, isInitialized: true }));
  },
});

export { fetchCurrentUser, login, logout };
export const { sessionExpired, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
