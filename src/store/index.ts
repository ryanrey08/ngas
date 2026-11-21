import { combineReducers, configureStore, createListenerMiddleware, isAnyOf, type UnknownAction } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import authReducer, { logout, sessionExpired } from "@/features/auth/authSlice";
import { PERSIST_KEY } from "@/lib/constants";
import { api } from "@/services/api/baseApi";
import { TAG_TYPES } from "@/services/api/apiTags";
import uiReducer, { setInstitution } from "./slices/uiSlice";
import storage from "./storage";

/**
 * State ownership:
 *  - api (RTK Query): ALL server data — lists, records, dashboards, notifications, reports, users.
 *    Never copied into regular slices. Not persisted.
 *  - auth: the backend-verified user (re-fetched from `GET /auth/me` on load; never persisted).
 *  - ui: client-only state — sidebar, mobile drawer, toasts, selected institution. Only the
 *    sidebar preference and institution are persisted.
 */
const uiPersistConfig = { key: `${PERSIST_KEY}:ui`, storage, whitelist: ["sidebarCollapsed", "institutionId"] };

const appReducer = combineReducers({
  auth: authReducer,
  ui: persistReducer(uiPersistConfig, uiReducer),
  [api.reducerPath]: api.reducer,
});

/** On sign-out or session expiry, drop all user-specific state; keep only UI preferences. */
function rootReducer(state: ReturnType<typeof appReducer> | undefined, action: UnknownAction) {
  if (state && (logout.fulfilled.match(action) || sessionExpired.match(action))) {
    return appReducer({ ui: state.ui } as ReturnType<typeof appReducer>, action);
  }
  return appReducer(state, action);
}

/** Cross-cutting cache rules that are not tied to one endpoint. */
function createApiListeners() {
  const listener = createListenerMiddleware();
  // Signed out: also stop RTK Query's timers/subscriptions for the old session's data.
  listener.startListening({
    matcher: isAnyOf(logout.fulfilled, sessionExpired),
    effect: (_, { dispatch }) => {
      dispatch(api.util.resetApiState());
    },
  });
  // Switched agency/institution: every cached query belongs to the previous one, so refetch it.
  listener.startListening({
    actionCreator: setInstitution,
    effect: (action, { dispatch, getOriginalState }) => {
      const previous = (getOriginalState() as { ui: { institutionId: string } }).ui.institutionId;
      if (previous !== action.payload) dispatch(api.util.invalidateTags([...TAG_TYPES]));
    },
  });
  return listener;
}

export function makeStore() {
  const listener = createApiListeners();
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
      })
        .prepend(listener.middleware)
        .concat(api.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });
  // Enables refetchOnFocus / refetchOnReconnect.
  setupListeners(store.dispatch);
  const persistor = persistStore(store);
  return { store, persistor };
}

export type AppStore = ReturnType<typeof makeStore>["store"];
export type RootState = ReturnType<typeof appReducer>;
export type AppDispatch = AppStore["dispatch"];
