import type { GeneratedReport, ReportCatalog } from "@/features/financial-reports/types";
import { api } from "../baseApi";
import type { Envelope } from "../apiTypes";

export const reportsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** `GET /financial-reports/catalog` — report definitions (with the user's favorites) and recent runs. */
    getReportCatalog: build.query<ReportCatalog, void>({
      query: () => "/financial-reports/catalog",
      transformResponse: (r: Envelope<ReportCatalog>) => r.data,
      providesTags: ["ReportCatalog", "GeneratedReport"],
    }),
    /** `POST /financial-reports/{code}/generate` — renders the report for a period; adds it to "Recent Reports". */
    generateReport: build.mutation<GeneratedReport, { code: string; period: string; fiscalYear: string }>({
      query: ({ code, period, fiscalYear }) => ({ url: `/financial-reports/${code}/generate`, method: "POST", body: { period, fiscal_year: fiscalYear } }),
      transformResponse: (r: Envelope<GeneratedReport>) => r.data,
      invalidatesTags: (r) => (r ? ["GeneratedReport"] : []),
    }),
    /** `PUT /financial-reports/{code}/favorite` — optimistic star toggle. */
    setReportFavorite: build.mutation<void, { code: string; favorite: boolean }>({
      query: ({ code, favorite }) => ({ url: `/financial-reports/${code}/favorite`, method: "PUT", body: { favorite } }),
      async onQueryStarted({ code, favorite }, { dispatch, queryFulfilled }) {
        const p = dispatch(
          reportsApi.util.updateQueryData("getReportCatalog", undefined, (d) => {
            const r = d?.reports.find((x) => x.code === code);
            if (r) r.favorite = favorite;
          }),
        );
        queryFulfilled.catch(p.undo);
      },
    }),
  }),
});

export const { useGetReportCatalogQuery, useGenerateReportMutation, useSetReportFavoriteMutation } = reportsApi;
