import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { normalizeError } from "@/lib/axios";
import { moduleService } from "@/services/moduleService";
import type { ApiError, AsyncStatus } from "@/types";
import type { HomeSummary } from "./types";

interface HomeState {
  summary: HomeSummary | null;
  status: AsyncStatus;
  error: string | null;
}

const initialState: HomeState = { summary: null, status: "idle", error: null };

export const fetchHomeSummary = createAsyncThunk<HomeSummary, void, { rejectValue: ApiError }>("home/fetchSummary", async (_, { rejectWithValue }) => {
  try {
    return await moduleService.getHomeSummary();
  } catch (e) {
    return rejectWithValue(normalizeError(e));
  }
});

const homeSlice = createSlice({
  name: "home",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchHomeSummary.pending, (s) => {
      s.status = "loading";
      s.error = null;
    })
      .addCase(fetchHomeSummary.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.summary = a.payload;
      })
      .addCase(fetchHomeSummary.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload?.message ?? "Failed to load summary.";
      });
  },
});

export default homeSlice.reducer;
