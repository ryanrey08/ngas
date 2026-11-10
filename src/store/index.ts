import { combineReducers, configureStore } from "@reduxjs/toolkit";
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
import authReducer from "@/features/auth/authSlice";
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
 *  - auth: only the signed-in user profile + expiry (NOT the access token — that lives
 *    in memory; a real backend should rely on an httpOnly refresh cookie)
 *  - home/journal/coa/notifications: never persisted (server data)
 */
const authPersistConfig = { key: `${PERSIST_KEY}:auth`, storage, whitelist: ["user", "expiresAt"] };
const uiPersistConfig = { key: `${PERSIST_KEY}:ui`, storage, whitelist: ["sidebarCollapsed", "institutionId"] };

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  ui: persistReducer(uiPersistConfig, uiReducer),
  notifications: notificationsReducer,
  home: homeReducer,
  journal: journalReducer,
  coa: coaReducer,
});

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
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];
