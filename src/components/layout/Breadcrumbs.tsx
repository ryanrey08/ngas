"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SEGMENT_LABELS, tabLabel } from "@/config/navigation";
import { ROUTES } from "@/lib/constants";

function labelFor(segments: string[], i: number) {
  const seg = segments[i];
  if (i === 1) {
    const t = tabLabel(segments[0], seg);
    if (t) return t;
  }
  return SEGMENT_LABELS[seg] ?? decodeURIComponent(seg).replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).filter((s) => s !== "dashboard");

  return (
    <nav aria-label="Breadcrumb" className="border-b border-neutral-200 bg-white px-4 py-1.5 sm:px-6" data-print-hide>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-neutral-600">
        <li>
          {segments.length === 0 ? (
            <span aria-current="page" className="font-semibold text-ink-900">
              Home
            </span>
          ) : (
            <Link href={ROUTES.dashboard} className="hover:text-brand-700">
              Home
            </Link>
          )}
        </li>
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const last = i === segments.length - 1;
          return (
            <li key={href} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
              {last ? (
                <span aria-current="page" className="font-semibold text-ink-900">
                  {labelFor(segments, i)}
                </span>
              ) : (
                <Link href={href} className="hover:text-brand-700">
                  {labelFor(segments, i)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
