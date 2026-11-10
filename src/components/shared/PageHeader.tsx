import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { HeaderBannerArt } from "./BuildingArt";

/**
 * Full-width white page header band: red outlined icon, title, description, actions,
 * an optional tab bar, and the decorative building banner on the right (desktop).
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  tabs,
  banner = true,
}: {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  tabs?: ReactNode;
  banner?: boolean;
}) {
  return (
    <div className="relative border-b border-neutral-200 bg-white" data-page-header>
      {banner && <HeaderBannerArt className="hidden xl:block" />}
      <div className="relative z-10 px-4 pt-4 pb-3 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-brand-600 bg-white text-brand-600">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">{title}</h1>
              {description && <p className="mt-0.5 max-w-3xl text-xs text-neutral-600 sm:text-sm">{description}</p>}
            </div>
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg lg:bg-white/85 lg:p-1 lg:backdrop-blur" data-print-hide>
              {actions}
            </div>
          )}
        </div>
        {tabs && <div className="mt-3">{tabs}</div>}
      </div>
    </div>
  );
}

/** Padded content region below a PageHeader. */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">{children}</div>;
}
