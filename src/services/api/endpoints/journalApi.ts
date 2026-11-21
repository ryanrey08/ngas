import type { JournalEntry, JournalEntryInput, JournalKind } from "@/features/journal/types";
import { api } from "../baseApi";
import { LIST, journalEntryEffects, type Tag } from "../apiTags";
import { toQueryParams, type Envelope, type ListParams, type Paginated } from "../apiTypes";

export interface JournalQuery extends ListParams {
  kind?: JournalKind;
  journalType?: string;
  department?: string;
}

const toParams = ({ kind, journalType, department, ...rest }: JournalQuery) =>
  toQueryParams({ ...rest, filters: { ...rest.filters, kind, journal_type: journalType, department } });

/** Mutation cache key shared by the entry form and the header Save/Post buttons (disables them while saving). */
export const SAVE_ENTRY_KEY = "journal-entry-save";

export const journalApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** `GET /journal-entries` — paginated, filtered by kind, dates, journal type, department, status, keyword. */
    getJournalEntries: build.query<Paginated<JournalEntry>, JournalQuery>({
      query: (q) => ({ url: "/journal-entries", params: toParams(q) }),
      providesTags: (r) => [...(r?.data ?? []).map((e) => ({ type: "JournalEntry" as const, id: e.id })), { type: "JournalEntry", id: LIST }],
    }),
    /** `GET /journal-entries/{id}` */
    getJournalEntry: build.query<JournalEntry, string>({
      query: (id) => `/journal-entries/${id}`,
      transformResponse: (r: Envelope<JournalEntry>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "JournalEntry", id }],
    }),
    /** `POST /journal-entries` — saves a draft or posts directly (`status: "Posted"`). */
    createJournalEntry: build.mutation<JournalEntry, JournalEntryInput>({
      query: (body) => ({ url: "/journal-entries", method: "POST", body }),
      transformResponse: (r: Envelope<JournalEntry>) => r.data,
      invalidatesTags: (r, _e, arg) => (r ? journalEntryEffects(arg.journalType) : []),
    }),
    /** `POST /journal-entries/{id}/post` — posts a draft. */
    postJournalEntry: build.mutation<JournalEntry, JournalEntry>({
      query: (e) => ({ url: `/journal-entries/${e.id}/post`, method: "POST" }),
      transformResponse: (r: Envelope<JournalEntry>) => r.data,
      invalidatesTags: (r, _e, e) => (r ? [{ type: "JournalEntry", id: e.id }, ...journalEntryEffects(e.journalType)] : []),
    }),
    /**
     * `POST /journal-entries/{id}/reverse` — flags the entry "Reversed" (optimistically, in every
     * cached list and the detail view) and the server books a contra entry, so lists refetch.
     */
    reverseJournalEntry: build.mutation<JournalEntry, JournalEntry>({
      query: (e) => ({ url: `/journal-entries/${e.id}/reverse`, method: "POST" }),
      transformResponse: (r: Envelope<JournalEntry>) => r.data,
      async onQueryStarted(entry, { dispatch, getState, queryFulfilled }) {
        const patches = journalApi.util.selectCachedArgsForQuery(getState(), "getJournalEntries").map((args) =>
          dispatch(
            journalApi.util.updateQueryData("getJournalEntries", args, (draft) => {
              const row = draft?.data?.find((x) => x.id === entry.id);
              if (row) row.status = "Reversed";
            }),
          ),
        );
        patches.push(dispatch(journalApi.util.updateQueryData("getJournalEntry", entry.id, (d) => void (d && (d.status = "Reversed")))));
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (r, _e, e): Tag[] => (r ? [{ type: "JournalEntry", id: e.id }, ...journalEntryEffects(e.journalType)] : []),
    }),
  }),
});

export const {
  useGetJournalEntriesQuery,
  useGetJournalEntryQuery,
  useCreateJournalEntryMutation,
  usePostJournalEntryMutation,
  useReverseJournalEntryMutation,
} = journalApi;
