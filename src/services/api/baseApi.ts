import { createApi } from "@reduxjs/toolkit/query/react";
import { TAG_TYPES } from "./apiTags";
import { baseQuery } from "./baseQuery";

/**
 * The single RTK Query API slice. Feature endpoints are added with `api.injectEndpoints` in
 * src/services/api/endpoints/*, so there is one reducer, one middleware and one cache.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: TAG_TYPES,
  keepUnusedDataFor: 120,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
