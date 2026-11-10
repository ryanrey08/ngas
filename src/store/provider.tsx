"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { sessionExpired } from "@/features/auth/authSlice";
import { configureApiClient } from "@/lib/axios";
import { ROUTES } from "@/lib/constants";
import { SplashScreen } from "@/components/shared/SplashScreen";
import { makeStore } from "./index";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [{ store, persistor }] = useState(() => {
    const created = makeStore();
    configureApiClient({
      getToken: () => created.store.getState().auth.accessToken,
      onUnauthorized: () => {
        created.store.dispatch(sessionExpired());
        if (typeof window !== "undefined" && !window.location.pathname.startsWith(ROUTES.login)) {
          window.location.assign(ROUTES.login);
        }
      },
    });
    return created;
  });

  return (
    <Provider store={store}>
      <PersistGate loading={<SplashScreen />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
