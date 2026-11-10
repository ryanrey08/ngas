"use client";

import { ChevronDown, ChevronRight, CircleSmall, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarBuildingArt } from "@/components/shared/BuildingArt";
import { Logo, LogoMark } from "@/components/shared/Logo";
import { filterNavigation, isNavActive, type NavEntry } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMobileNavOpen } from "@/store/slices/uiSlice";

function NavItem({
  entry,
  collapsed,
  pathname,
  expanded,
  onToggle,
  onNavigate,
}: {
  entry: NavEntry;
  collapsed: boolean;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const active = isNavActive(entry, pathname);
  const Icon = entry.icon;
  const hasChildren = Boolean(entry.children?.length) && !collapsed;
  const base = cn(
    "flex w-full items-center gap-3 px-4 py-2.5 text-[0.82rem] font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-400",
    collapsed && "justify-center px-0",
    active ? "bg-brand-600 text-white" : "text-neutral-200 hover:bg-white/8 hover:text-white",
  );

  return (
    <li>
      <div className="flex items-stretch">
        <Link
          href={entry.href}
          onClick={onNavigate}
          aria-current={active && !hasChildren ? "page" : undefined}
          title={collapsed ? entry.label : undefined}
          className={base}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <span className={cn("flex-1 truncate", collapsed && "sr-only")}>{entry.label}</span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${entry.label}`}
            className={cn("px-3", active ? "bg-brand-600 text-white" : "text-neutral-400 hover:bg-white/8 hover:text-white")}
          >
            {expanded ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="bg-black/25 py-1">
          {entry.children!.map((c) => {
            const childActive = pathname === c.href || pathname.startsWith(`${c.href}/`);
            return (
              <li key={c.href}>
                <Link
                  href={c.href}
                  onClick={onNavigate}
                  aria-current={childActive ? "page" : undefined}
                  className={cn(
                    "mx-2 flex items-center gap-2 rounded-md py-1.5 pr-2 pl-6 text-[0.74rem] transition-colors",
                    childActive ? "bg-white/15 font-semibold text-white" : "text-neutral-300 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <CircleSmall className={cn("h-3 w-3 shrink-0", childActive ? "text-brand-400" : "text-neutral-500")} aria-hidden />
                  <span className="truncate">{c.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function NavContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const role = useAppSelector((s) => s.auth.user?.role);
  const entries = filterNavigation(role);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Auto-expand the module that contains the current route.
  useEffect(() => {
    const current = entries.find((e) => e.children && isNavActive(e, pathname));
    if (current) setOpen((o) => (o[current.label] ? o : { ...o, [current.label]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav aria-label="Main navigation" className="scrollbar-thin relative z-10 flex-1 overflow-y-auto py-2">
      <ul className="space-y-0.5">
        {entries.map((e) => (
          <NavItem
            key={e.label}
            entry={e}
            collapsed={collapsed}
            pathname={pathname}
            expanded={Boolean(open[e.label])}
            onToggle={() => setOpen((o) => ({ ...o, [e.label]: !o[e.label] }))}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </nav>
  );
}

function SidebarFrame({ collapsed, onNavigate, closeButton }: { collapsed: boolean; onNavigate?: () => void; closeButton?: React.ReactNode }) {
  return (
    <>
      <div className="relative z-10 border-b-4 border-brand-600 bg-white">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-label="eNGAS home"
          className={cn("flex items-center justify-center", collapsed ? "h-16" : "px-4 py-2")}
        >
          {collapsed ? <LogoMark size={44} /> : <Logo width={150} priority />}
        </Link>
        {closeButton}
      </div>
      <NavContent collapsed={collapsed} onNavigate={onNavigate} />
      {!collapsed && <SidebarBuildingArt className="pointer-events-none absolute inset-x-0 bottom-0 h-44 opacity-90" />}
    </>
  );
}

export function Sidebar() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const mobileOpen = useAppSelector((s) => s.ui.mobileNavOpen);
  const pathname = usePathname();

  useEffect(() => {
    dispatch(setMobileNavOpen(false));
  }, [pathname, dispatch]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dispatch(setMobileNavOpen(false));
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, dispatch]);

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden bg-[#181818] transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-[232px]",
        )}
      >
        <SidebarFrame collapsed={collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 animate-fade-in bg-ink-950/60" onClick={() => dispatch(setMobileNavOpen(false))} aria-hidden />
          <aside className="relative flex h-full w-[min(84vw,280px)] animate-slide-in flex-col overflow-hidden bg-[#181818] shadow-pop">
            <SidebarFrame
              collapsed={false}
              onNavigate={() => dispatch(setMobileNavOpen(false))}
              closeButton={
                <button
                  type="button"
                  onClick={() => dispatch(setMobileNavOpen(false))}
                  aria-label="Close navigation"
                  className="absolute top-2 right-2 rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-ink-900"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              }
            />
          </aside>
        </div>
      )}
    </>
  );
}
