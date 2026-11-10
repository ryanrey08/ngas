import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { notificationService } from "@/services/notificationService";
import type { AsyncStatus, Notification } from "@/types";

interface NotificationsState {
  items: Notification[];
  status: AsyncStatus;
}

const initialState: NotificationsState = { items: [], status: "idle" };

export const fetchNotifications = createAsyncThunk("notifications/fetch", () => notificationService.list());

export const markAllNotificationsRead = createAsyncThunk("notifications/markAllRead", () =>
  notificationService.markAllRead(),
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    markNotificationRead(state, action: PayloadAction<string>) {
      const n = state.items.find((i) => i.id === action.payload);
      if (n) n.read = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = "failed";
      })
      // Optimistic update
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.items.forEach((n) => {
          n.read = true;
        });
      });
  },
});

export const { markNotificationRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
