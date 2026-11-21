import type { Institution } from "@/config/institutions";
import { api } from "../baseApi";
import type { Envelope } from "../apiTypes";

export interface SystemSettings {
  fiscal_year: number;
  current_period: string;
  currency: string;
  fiscal_years: number[];
  periods: string[];
}

export const settingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** `GET /institutions` — agencies the signed-in user can switch between. */
    getInstitutions: build.query<Institution[], void>({
      query: () => "/institutions",
      transformResponse: (r: Envelope<Institution[]>) => r.data,
      providesTags: ["Institution"],
      keepUnusedDataFor: 3600,
    }),
    /** `GET /settings` — system-wide accounting settings (fiscal year, periods). */
    getSystemSettings: build.query<SystemSettings, void>({
      query: () => "/settings",
      transformResponse: (r: Envelope<SystemSettings>) => r.data,
      providesTags: ["Settings"],
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const { useGetInstitutionsQuery, useGetSystemSettingsQuery } = settingsApi;
