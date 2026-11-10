import Link from "next/link";
import type { ModuleDef } from "@/config/modules";
import { tabHref } from "@/config/modules";
import { cn } from "@/lib/utils";

/** Pill tab bar shown under the page header of every module (active tab in brand red). */
export function ModuleTabs({ module, active }: { module: ModuleDef; active: string }) {
  return (
    <nav aria-label={`${module.label} sections`} className="scrollbar-thin -mx-1 overflow-x-auto px-1 pb-1" data-print-hide>
      <ul className="flex min-w-max gap-1.5">
        {module.tabs.map((t) => {
          const isActive = t.slug === active;
          const Icon = t.icon;
          return (
            <li key={t.slug}>
              <Link
                href={tabHref(module, t.slug)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-md border px-3.5 text-xs font-semibold transition-colors sm:px-4",
                  isActive
                    ? "border-brand-700 bg-brand-600 text-white shadow-[0_4px_12px_-4px_rgb(215_25_31/0.6)]"
                    : "border-neutral-200 bg-neutral-50 text-ink-800 hover:border-neutral-300 hover:bg-white",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
