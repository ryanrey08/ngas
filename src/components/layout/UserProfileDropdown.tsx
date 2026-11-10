"use client";

import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_LABELS } from "@/config/navigation";
import { logout } from "@/features/auth/authSlice";
import { useClickOutside } from "@/hooks/useClickOutside";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function UserProfileDropdown() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  if (!user) return null;

  const handleLogout = async () => {
    setSigningOut(true);
    await dispatch(logout());
    router.replace(ROUTES.login);
    router.refresh();
  };

  const item = "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-ink-900";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open user menu"
        className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-neutral-100"
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden text-left md:block">
          <span className="block max-w-36 truncate text-sm font-semibold text-ink-900">{user.name}</span>
          <span className="block max-w-36 truncate text-xs text-neutral-500">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown className={cn("hidden h-4 w-4 text-neutral-500 transition-transform md:block", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 animate-scale-in rounded-xl border border-neutral-200 bg-white p-1.5 shadow-pop">
          <div className="flex items-center gap-3 border-b border-neutral-100 px-3 pt-2 pb-3">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
              <p className="truncate text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>
          <div className="py-1">
            <Link role="menuitem" href={ROUTES.settings} className={item} onClick={close}>
              <UserIcon className="h-4 w-4" aria-hidden /> My profile
            </Link>
            <Link role="menuitem" href={ROUTES.settings} className={item} onClick={close}>
              <Settings className="h-4 w-4" aria-hidden /> Settings
            </Link>
          </div>
          <div className="border-t border-neutral-100 pt-1">
            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className={cn(item, "text-brand-700 hover:bg-brand-50 hover:text-brand-800")}
            >
              <LogOut className="h-4 w-4" aria-hidden /> {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
