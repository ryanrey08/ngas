"use client";

import { Bell, CheckCheck, CircleCheck, Info, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { markAllNotificationsRead, markNotificationRead } from "@/store/slices/notificationsSlice";

const icons = { info: Info, success: CircleCheck, warning: TriangleAlert };
const tones = { info: "bg-sky-50 text-sky-600", success: "bg-emerald-50 text-emerald-600", warning: "bg-amber-50 text-amber-600" };

export function NotificationDropdown() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.notifications.items);
  const unread = items.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-ink-900"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[0.625rem] font-bold text-white ring-2 ring-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-40 animate-scale-in overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-pop sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <div>
              <p className="font-heading text-sm font-bold text-ink-900">Notifications</p>
              <p className="text-xs text-neutral-500">{unread ? `${unread} unread` : "You're all caught up"}</p>
            </div>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => dispatch(markAllNotificationsRead())}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all read
            </button>
          </div>
          <ul className="scrollbar-thin max-h-96 divide-y divide-neutral-100 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-neutral-500">No notifications</li>}
            {items.map((n) => {
              const Icon = icons[n.type];
              const body = (
                <div className={cn("flex gap-3 px-4 py-3 text-left", !n.read && "bg-brand-50/40")}>
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", tones[n.type])}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-start justify-between gap-2 text-sm font-semibold text-ink-900">
                      <span>{n.title}</span>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-600">{n.message}</p>
                    <p className="mt-1 text-[0.7rem] text-neutral-400">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                </div>
              );
              const onClick = () => {
                dispatch(markNotificationRead(n.id));
                setOpen(false);
              };
              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link href={n.href} onClick={onClick} className="block hover:bg-neutral-50">
                      {body}
                    </Link>
                  ) : (
                    <button type="button" onClick={onClick} className="block w-full hover:bg-neutral-50">
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
