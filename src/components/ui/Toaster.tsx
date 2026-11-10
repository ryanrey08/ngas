"use client";

import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissToast, type Toast } from "@/store/slices/uiSlice";

const icons = { success: CircleCheck, error: CircleAlert, info: Info };
const tones = { success: "text-emerald-600", error: "text-brand-600", info: "text-sky-600" };

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const id = setTimeout(() => dispatch(dismissToast(toast.id)), 4000);
    return () => clearTimeout(id);
  }, [dispatch, toast.id]);
  const Icon = icons[toast.variant];
  return (
    <div className="pointer-events-auto flex w-full max-w-sm animate-scale-in items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-pop">
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tones[toast.variant])} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-900">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-neutral-500">{toast.description}</p>}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="rounded p-1 text-neutral-400 hover:text-ink-900"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
