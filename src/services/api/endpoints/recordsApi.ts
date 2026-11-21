import type { Row } from "@/features/modules/types";
import { api } from "../baseApi";
import { journalEntryEffects, recordListTag, recordSummaryTag, recordTag, relatedTags, type Tag } from "../apiTags";
import { toQueryParams, type Envelope, type HistoryEntry, type ListParams, type Paginated } from "../apiTypes";

/**
 * Generic module records — every config-driven list tab ("<module>/<tab>", e.g.
 * "payables/disbursements") is one REST resource at `/<module>/<tab>`.
 */
export type RecordRow = Row & { id: string };

export interface RecordQuery extends ListParams {
  resource: string;
}

export interface RecordDetail {
  data: RecordRow;
  history: HistoryEntry[];
}

const affected = (resource: string, id?: string): Tag[] => [
  ...(id ? [recordTag(resource, id)] : []),
  recordListTag(resource),
  ...relatedTags(resource),
  ...(resource === "payables/disbursements" ? (["Notification"] as Tag[]) : []),
];

export const recordsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** `GET /<resource>?page&per_page&search&sort&filter[…]&facets` */
    getRecords: build.query<Paginated<RecordRow>, RecordQuery>({
      query: ({ resource, ...params }) => ({ url: `/${resource}`, params: toQueryParams(params) }),
      providesTags: (r, _e, { resource }) => [...(r?.data ?? []).map((row) => recordTag(resource, row.id)), recordListTag(resource)],
    }),
    /** `GET /<resource>/summary` — the KPI tiles above a list (computed server-side over all rows). */
    getRecordSummary: build.query<Record<string, number>, string>({
      query: (resource) => `/${resource}/summary`,
      transformResponse: (r: Envelope<Record<string, number>>) => r.data,
      providesTags: (_r, _e, resource) => [recordSummaryTag(resource)],
    }),
    /** `GET /<resource>/{id}` — one record plus its status history. */
    getRecord: build.query<RecordDetail, { resource: string; id: string }>({
      query: ({ resource, id }) => `/${resource}/${id}`,
      providesTags: (_r, _e, { resource, id }) => [recordTag(resource, id)],
    }),
    /** `GET /<resource>/export` — every row matching the filters, for Export to Excel. Use the lazy hook. */
    exportRecords: build.query<RecordRow[], RecordQuery>({
      query: ({ resource, ...params }) => ({ url: `/${resource}/export`, params: toQueryParams({ ...params, page: undefined, perPage: undefined }) }),
      transformResponse: (r: Envelope<RecordRow[]>) => r.data,
      keepUnusedDataFor: 0,
    }),
    /** `POST /<resource>` */
    createRecord: build.mutation<RecordRow, { resource: string; values: Record<string, string> }>({
      query: ({ resource, values }) => ({ url: `/${resource}`, method: "POST", body: values }),
      transformResponse: (r: Envelope<RecordRow>) => r.data,
      invalidatesTags: (r, _e, { resource }) => (r ? affected(resource) : []),
    }),
    /** `PATCH /<resource>/{id}` */
    updateRecord: build.mutation<RecordRow, { resource: string; id: string; values: Record<string, string> }>({
      query: ({ resource, id, values }) => ({ url: `/${resource}/${id}`, method: "PATCH", body: values }),
      transformResponse: (r: Envelope<RecordRow>) => r.data,
      invalidatesTags: (r, _e, { resource, id }) => (r ? affected(resource, id) : []),
    }),
    /**
     * `POST /<resource>/{id}/{action}` — workflow transition (approve, reject, post, release…).
     * The new status is applied optimistically to every cached page of the resource and rolled
     * back if the server refuses; then the lists, tiles and linked screens refetch.
     */
    transitionRecord: build.mutation<RecordRow, { resource: string; id: string; action: string; to: string; remarks?: string }>({
      query: ({ resource, id, action, remarks }) => ({ url: `/${resource}/${id}/${action}`, method: "POST", body: { remarks } }),
      transformResponse: (r: Envelope<RecordRow>) => r.data,
      async onQueryStarted({ resource, id, to }, { dispatch, getState, queryFulfilled }) {
        const patches = recordsApi.util
          .selectCachedArgsForQuery(getState(), "getRecords")
          .filter((a) => a.resource === resource)
          .map((args) =>
            dispatch(
              recordsApi.util.updateQueryData("getRecords", args, (draft) => {
                const row = draft?.data?.find((x) => x.id === id);
                if (row && to) row.status = to;
              }),
            ),
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (r, _e, { resource, id }) => (r ? affected(resource, id) : []),
    }),
    /** `DELETE /<resource>/{id}` (drafts only). */
    deleteRecord: build.mutation<void, { resource: string; id: string }>({
      query: ({ resource, id }) => ({ url: `/${resource}/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, e, { resource, id }) => (e ? [] : affected(resource, id)),
    }),
    /** `POST /double-entry/auto-journal/generate` — drafts journal entries from the active rules. */
    generateAutoJournal: build.mutation<{ generated: number; entries: Array<{ id: string; transactionNo: string }> }, void>({
      query: () => ({ url: "/double-entry/auto-journal/generate", method: "POST" }),
      transformResponse: (r: Envelope<{ generated: number; entries: Array<{ id: string; transactionNo: string }> }>) => r.data,
      invalidatesTags: (r) => (r ? [...journalEntryEffects("General Journal (GJ)"), recordListTag("double-entry/auto-journal")] : []),
    }),
  }),
});

export const {
  useGetRecordsQuery,
  useGetRecordSummaryQuery,
  useGetRecordQuery,
  useLazyExportRecordsQuery,
  useCreateRecordMutation,
  useUpdateRecordMutation,
  useTransitionRecordMutation,
  useDeleteRecordMutation,
  useGenerateAutoJournalMutation,
} = recordsApi;
