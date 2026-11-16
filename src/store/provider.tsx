"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { sessionExpired } from "@/features/auth/authSlice";
import { loginUrl } from "@/features/auth/authUtils";
import { configureApiClient } from "@/lib/axios";
import { PERSIST_KEY, ROUTES } from "@/lib/constants";
import { SplashScreen } from "@/components/shared/SplashScreen";
import { makeStore } from "./index";

/** Earlier builds persisted the signed-in user's profile in localStorage; remove it. */
function removeLegacyAuthStorage() {
  try {
    window.localStorage.removeItem(`persist:${PERSIST_KEY}:auth`);
  } catch {
    // Storage may be unavailable (private mode); nothing to clean up then.
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [{ store, persistor }] = useState(() => {
    const created = makeStore();
    let redirecting = false;
    configureApiClient({
      // The backend rejected the token: the proxy has already cleared the cookie. Clear state and
      // send the user to sign in once (the flag stops parallel 401s from redirecting repeatedly).
      onUnauthorized: () => {
        created.store.dispatch(sessionExpired());
        if (typeof window === "undefined" || redirecting) return;
        const { pathname, search } = window.location;
        if (pathname.startsWith(ROUTES.login)) return;
        redirecting = true;
        window.location.replace(loginUrl(`${pathname}${search}`, "expired"));
      },
    });
    if (typeof window !== "undefined") removeLegacyAuthStorage();
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
