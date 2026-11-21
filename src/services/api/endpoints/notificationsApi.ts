import type { Notification } from "@/types";
import { api } from "../baseApi";
import type { Envelope } from "../apiTypes";

export const notificationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** `GET /notifications` (polled by the header bell). */
    getNotifications: build.query<Notification[], void>({
      query: () => "/notifications",
      transformResponse: (r: Envelope<Notification[]>) => r.data,
      providesTags: ["Notification"],
    }),
    /** `POST /notifications/{id}/read` — optimistic. */
    markNotificationRead: build.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "POST" }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            const n = draft?.find((x) => x.id === id);
            if (n) n.read = true;
          }),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),
    /** `POST /notifications/read-all` — optimistic. */
    markAllNotificationsRead: build.mutation<void, void>({
      query: () => ({ url: "/notifications/read-all", method: "POST" }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            draft?.forEach((n) => (n.read = true));
          }),
        );
        queryFulfilled.catch(patch.undo);
      },
    }),
  }),
});

export const { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } = notificationsApi;
