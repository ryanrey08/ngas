import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { normalizeError } from "@/lib/axios";
import { journalService } from "@/services/journalService";
import type { RootState } from "@/store";
import type { ApiError, AsyncStatus } from "@/types";
import type { JournalEntry, JournalEntryInput } from "./types";

interface JournalState {
  items: JournalEntry[];
  status: AsyncStatus;
  error: string | null;
  mutationStatus: AsyncStatus;
}

const initialState: JournalState = { items: [], status: "idle", error: null, mutationStatus: "idle" };
type Cfg = { rejectValue: ApiError; state: RootState };

export const fetchJournalEntries = createAsyncThunk<JournalEntry[], void, Cfg>("journal/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await journalService.list();
  } catch (e) {
    return rejectWithValue(normalizeError(e));
  }
});

export const createJournalEntry = createAsyncThunk<JournalEntry, JournalEntryInput, Cfg>(
  "journal/create",
  async (input, { rejectWithValue, getState }) => {
    try {
      return await journalService.create(input, getState().auth.user?.name ?? "eNGAS User");
    } catch (e) {
      return rejectWithValue(normalizeError(e));
    }
  },
);

export const reverseJournalEntry = createAsyncThunk<JournalEntry, string, Cfg>("journal/reverse", async (id, { rejectWithValue }) => {
  try {
    return await journalService.reverse(id);
  } catch (e) {
    return rejectWithValue(normalizeError(e));
  }
});

const journalSlice = createSlice({
  name: "journal",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchJournalEntries.pending, (s) => {
      s.status = "loading";
      s.error = null;
    })
      .addCase(fetchJournalEntries.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.items = a.payload;
      })
      .addCase(fetchJournalEntries.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload?.message ?? "Failed to load journal entries.";
      })
      .addCase(createJournalEntry.pending, (s) => {
        s.mutationStatus = "loading";
      })
      .addCase(createJournalEntry.fulfilled, (s, a) => {
        s.mutationStatus = "succeeded";
        s.items.unshift(a.payload);
      })
      .addCase(createJournalEntry.rejected, (s) => {
        s.mutationStatus = "failed";
      })
      .addCase(reverseJournalEntry.pending, (s) => {
        s.mutationStatus = "loading";
      })
      .addCase(reverseJournalEntry.fulfilled, (s, a) => {
        s.mutationStatus = "succeeded";
        const i = s.items.findIndex((x) => x.id === a.payload.id);
        if (i !== -1) s.items[i] = a.payload;
      })
      .addCase(reverseJournalEntry.rejected, (s) => {
        s.mutationStatus = "failed";
      });
  },
});

export default journalSlice.reducer;
