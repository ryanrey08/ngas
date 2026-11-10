import createWebStorage from "redux-persist/lib/storage/createWebStorage";

/** No-op storage used during SSR, where `window.localStorage` doesn't exist. */
function createNoopStorage() {
  return {
    getItem: () => Promise.resolve(null),
    setItem: (_key: string, value: string) => Promise.resolve(value),
    removeItem: () => Promise.resolve(),
  };
}

const storage = typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

export default storage;
