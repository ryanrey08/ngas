import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { normalizeError } from "@/lib/axios";
import { coaService } from "@/services/coaService";
import type { ApiError, AsyncStatus } from "@/types";
import type { Account, AccountInput } from "./types";

interface CoaState {
  accounts: Account[];
  status: AsyncStatus;
  error: string | null;
}

const initialState: CoaState = { accounts: [], status: "idle", error: null };

export const fetchAccounts = createAsyncThunk<Account[], void, { rejectValue: ApiError }>("coa/fetch", async (_, { rejectWithValue }) => {
  try {
    return await coaService.list();
  } catch (e) {
    return rejectWithValue(normalizeError(e));
  }
});

export const createAccount = createAsyncThunk<Account, AccountInput, { rejectValue: ApiError }>("coa/create", async (input, { rejectWithValue }) => {
  try {
    return await coaService.create(input);
  } catch (e) {
    return rejectWithValue(normalizeError(e));
  }
});

const coaSlice = createSlice({
  name: "coa",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAccounts.pending, (s) => {
      s.status = "loading";
      s.error = null;
    })
      .addCase(fetchAccounts.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.accounts = a.payload;
      })
      .addCase(fetchAccounts.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload?.message ?? "Failed to load accounts.";
      })
      .addCase(createAccount.fulfilled, (s, a) => {
        s.accounts = [...s.accounts, a.payload].sort((x, y) => x.code.localeCompare(y.code, undefined, { numeric: true }));
      });
  },
});

export default coaSlice.reducer;
