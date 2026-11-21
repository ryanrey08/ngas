import type { Account, AccountInput } from "@/features/coa/types";
import { api } from "../baseApi";
import { listTags, recordListTag } from "../apiTags";
import { toQueryParams, type Envelope } from "../apiTypes";

export interface AccountFilters {
  search?: string;
  classification?: string;
  accountType?: string;
  status?: string;
}

export type AccountDetail = Account & { children: number };

export const coaApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * `GET /coa/accounts` — the whole Revised Chart of Accounts (a tree, so not paginated).
     * Call with no argument for the full tree; it is the cache shared by the COA screen,
     * the parent-account picker and the journal-line account picker.
     */
    getAccounts: build.query<Account[], AccountFilters | void>({
      query: (f) => ({
        url: "/coa/accounts",
        params: f ? toQueryParams({ search: f.search, status: f.status, filters: { classification: f.classification, account_type: f.accountType } }) : undefined,
      }),
      transformResponse: (r: Envelope<Account[]>) => r.data,
      providesTags: (r) => listTags("Account", r, (a) => a.id),
      keepUnusedDataFor: 600,
    }),
    /** `GET /coa/accounts/{id}` — one account with its number of sub-accounts. */
    getAccount: build.query<AccountDetail, string>({
      query: (id) => `/coa/accounts/${id}`,
      transformResponse: (r: Envelope<AccountDetail>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "Account", id }],
    }),
    /** `POST /coa/accounts` */
    createAccount: build.mutation<Account, AccountInput>({
      query: (body) => ({ url: "/coa/accounts", method: "POST", body }),
      transformResponse: (r: Envelope<Account>) => r.data,
      invalidatesTags: (r) => (r ? [{ type: "Account", id: "LIST" }, recordListTag("coa/history")] : []),
    }),
    /** `PATCH /coa/accounts/{id}` — optimistic in the full tree; refetches the account and audit trail. */
    updateAccount: build.mutation<Account, { id: string; patch: Partial<AccountInput> }>({
      query: ({ id, patch }) => ({ url: `/coa/accounts/${id}`, method: "PATCH", body: patch }),
      transformResponse: (r: Envelope<Account>) => r.data,
      async onQueryStarted({ id, patch }, { dispatch, queryFulfilled }) {
        const p = dispatch(
          coaApi.util.updateQueryData("getAccounts", undefined, (draft) => {
            const a = draft?.find((x) => x.id === id);
            if (a) Object.assign(a, patch);
          }),
        );
        queryFulfilled.catch(p.undo);
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: "Account", id }, recordListTag("coa/history")],
    }),
  }),
});

export const { useGetAccountsQuery, useGetAccountQuery, useCreateAccountMutation, useUpdateAccountMutation } = coaApi;
