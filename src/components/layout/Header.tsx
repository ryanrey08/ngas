"use client";

import { Menu } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { setMobileNavOpen, toggleSidebar } from "@/store/slices/uiSlice";
import { InstitutionSelector } from "./InstitutionSelector";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserProfileDropdown } from "./UserProfileDropdown";

export function Header() {
  const dispatch = useAppDispatch();

  const onMenu = () => {
    // Drawer on mobile/tablet, collapse toggle on desktop.
    if (window.matchMedia("(min-width: 1024px)").matches) dispatch(toggleSidebar());
    else dispatch(setMobileNavOpen(true));
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-3 sm:px-5">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Toggle navigation menu"
        className="rounded-lg p-2 text-ink-900 hover:bg-neutral-100"
      >
        <Menu className="h-6 w-6" aria-hidden />
      </button>
      <div className="min-w-0 leading-tight">
        <p className="font-heading text-base font-extrabold text-ink-900 sm:text-lg">eNGAS</p>
        <p className="hidden truncate text-xs text-neutral-600 sm:block">New Government Accounting System</p>
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-3">
        <InstitutionSelector />
        <NotificationDropdown />
        <UserProfileDropdown />
      </div>
    </header>
  );
}
