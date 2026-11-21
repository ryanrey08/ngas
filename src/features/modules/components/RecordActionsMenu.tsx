"use client";

import { MoreVertical, Pencil } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";
import type { RecordAction } from "../recordWorkflows";

const iconBtn = "inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-ink-900 disabled:opacity-40";

/** Row "More" menu: the workflow actions allowed for the record's current status (+ Edit). */
export function RecordActionsMenu({
  actions,
  canEdit,
  busy,
  label,
  onAction,
  onEdit,
}: {
  actions: RecordAction[];
  canEdit: boolean;
  busy?: boolean;
  label: string;
  onAction: (a: RecordAction) => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(menu, close, open);

  // The table scrolls horizontally, so the menu is portalled and positioned against the viewport.
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  }, [open]);

  const empty = actions.length === 0 && !canEdit;
  const item = "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-semibold";

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={iconBtn}
        aria-label={`More actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={empty ? "No actions available for this status" : "More"}
        disabled={busy || empty}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <MoreVertical className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open &&
        createPortal(
          <div ref={menu} role="menu" style={{ top: pos.top, right: pos.right }} className="fixed z-50 w-48 animate-scale-in rounded-lg border border-neutral-200 bg-white p-1 shadow-pop">
            {canEdit && (
              <button role="menuitem" type="button" className={cn(item, "text-ink-900 hover:bg-neutral-50")} onClick={() => (close(), onEdit())}>
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
              </button>
            )}
            {actions.map((a) => (
              <button
                key={a.key}
                role="menuitem"
                type="button"
                className={cn(item, a.tone === "danger" ? "text-brand-700 hover:bg-brand-50" : a.tone === "success" ? "text-green-800 hover:bg-green-50" : "text-ink-900 hover:bg-neutral-50")}
                onClick={() => (close(), onAction(a))}
              >
                {a.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
