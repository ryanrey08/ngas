import Link from "next/link";
import type { ModuleDef } from "@/config/modules";
import { tabHref } from "@/config/modules";
import { cn } from "@/lib/utils";

/** Vertical submodule menu (e.g. the books list on Journals & Books). */
export function SubmoduleMenu({ module, active }: { module: ModuleDef; active: string }) {
  const Icon = module.icon;
  return (
    <nav aria-label={module.label} className="h-fit overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card" data-print-hide>
      <p className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 text-sm font-bold text-ink-900">
        <Icon className="h-4 w-4 text-brand-600" aria-hidden /> {module.label}
      </p>
      <ul className="space-y-1 p-2">
        {module.tabs.map((t) => {
          const isActive = t.slug === active;
          const TIcon = t.icon;
          return (
            <li key={t.slug}>
              <Link
                href={tabHref(module, t.slug)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors",
                  isActive ? "bg-brand-600 text-white" : "text-ink-800 hover:bg-neutral-50",
                )}
              >
                <TIcon className="h-4 w-4 shrink-0" aria-hidden />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
