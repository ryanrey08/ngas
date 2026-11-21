import type { HomeSummary } from "@/features/home/types";
import type { PayablesOverview } from "@/features/payables/types";
import type { ReceivablesOverview } from "@/features/receivables/types";
import { api } from "../baseApi";
import type { Envelope } from "../apiTypes";

export const dashboardApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** `GET /dashboard/summary` — home KPIs and recent activity. Refreshed by any financial mutation. */
    getDashboardSummary: build.query<HomeSummary, void>({
      query: () => "/dashboard/summary",
      transformResponse: (r: Envelope<HomeSummary>) => r.data,
      providesTags: ["Dashboard"],
    }),
    /** `GET /receivables/overview` — collections KPIs, trend, by-customer split and collections list. */
    getReceivablesOverview: build.query<ReceivablesOverview, void>({
      query: () => "/receivables/overview",
      transformResponse: (r: Envelope<ReceivablesOverview>) => r.data,
      providesTags: [{ type: "Overview", id: "receivables" }],
    }),
    /** `GET /payables/overview` — AP aging buckets, by-supplier aging, trend and recent transactions. */
    getPayablesOverview: build.query<PayablesOverview, void>({
      query: () => "/payables/overview",
      transformResponse: (r: Envelope<PayablesOverview>) => r.data,
      providesTags: [{ type: "Overview", id: "payables" }],
    }),
  }),
});

export const { useGetDashboardSummaryQuery, useGetReceivablesOverviewQuery, useGetPayablesOverviewQuery } = dashboardApi;
