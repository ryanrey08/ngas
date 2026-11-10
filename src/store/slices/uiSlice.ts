import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "info";
}

interface UiState {
  /** Desktop sidebar collapsed (persisted preference). */
  sidebarCollapsed: boolean;
  /** Mobile drawer open (transient). */
  mobileNavOpen: boolean;
  toasts: Toast[];
  /** Currently selected agency / institution (persisted preference). */
  institutionId: string;
}

const initialState: UiState = { sidebarCollapsed: false, mobileNavOpen: false, toasts: [], institutionId: "mpc" };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    showToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload);
      },
      prepare(toast: Omit<Toast, "id">) {
        return { payload: { ...toast, id: nanoid() } };
      },
    },
    setInstitution(state, action: PayloadAction<string>) {
      state.institutionId = action.payload;
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setMobileNavOpen, showToast, dismissToast, setInstitution } = uiSlice.actions;
export default uiSlice.reducer;
