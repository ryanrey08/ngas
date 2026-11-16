import { combineReducers, configureStore, type UnknownAction } from "@reduxjs/toolkit";
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
import coaReducer from "@/features/coa/coaSlice";
import homeReducer from "@/features/home/homeSlice";
import journalReducer from "@/features/journal/journalSlice";
import { PERSIST_KEY } from "@/lib/constants";
import notificationsReducer from "./slices/notificationsSlice";
import uiReducer from "./slices/uiSlice";
import storage from "./storage";

/**
 * Persistence policy:
 *  - ui: only the sidebar preference (no transient drawer/toast state)
 *  - auth: never persisted. The backend token is in an httpOnly cookie and the user is
 *    re-fetched from `GET /auth/me` on load, so nothing about the user sits in localStorage.
 *  - home/journal/coa/notifications: never persisted (server data)
 */
const uiPersistConfig = { key: `${PERSIST_KEY}:ui`, storage, whitelist: ["sidebarCollapsed", "institutionId"] };

const appReducer = combineReducers({
  auth: authReducer,
  ui: persistReducer(uiPersistConfig, uiReducer),
  notifications: notificationsReducer,
  home: homeReducer,
  journal: journalReducer,
  coa: coaReducer,
});

/** On sign-out or session expiry, drop all user-specific state; keep only UI preferences. */
function rootReducer(state: ReturnType<typeof appReducer> | undefined, action: UnknownAction) {
  if (state && (logout.fulfilled.match(action) || sessionExpired.match(action))) {
    return appReducer({ ui: state.ui }, action);
  }
  return appReducer(state, action);
}

export function makeStore() {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
      }),
    devTools: process.env.NODE_ENV !== "production",
  });
  const persistor = persistStore(store);
  return { store, persistor };
}

export type AppStore = ReturnType<typeof makeStore>["store"];
export type RootState = ReturnType<typeof appReducer>;
export type AppDispatch = AppStore["dispatch"];
