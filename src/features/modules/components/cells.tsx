import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { ColumnKind } from "../types";

const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}/.test(v);

/** Renders a list cell according to its declared kind. */
export function renderCell(kind: ColumnKind | undefined, value: string | number | undefined) {
  if (value === undefined || value === "") return <span className="text-neutral-400">—</span>;
  switch (kind) {
    case "strong":
      return <span className="font-semibold text-ink-900">{value}</span>;
    case "mono":
      return <span className="font-mono text-[0.72rem] font-semibold whitespace-nowrap text-ink-900">{value}</span>;
    case "currency":
      return <span className="whitespace-nowrap tabular-nums">{formatCurrency(Number(value)).replace("₱", "")}</span>;
    case "signedCurrency": {
      const n = Number(value);
      const s = formatCurrency(Math.abs(n)).replace("₱", "");
      return <span className={cn("whitespace-nowrap tabular-nums", n < 0 && "text-brand-600")}>{n < 0 ? `(${s})` : s}</span>;
    }
    case "date":
      return <span className="whitespace-nowrap">{typeof value === "string" && isIsoDate(value) ? formatDate(value) : value}</span>;
    case "status":
      return <StatusBadge status={String(value)} />;
    case "percent":
      return <span className="tabular-nums">{value}%</span>;
    case "number":
      return <span className="tabular-nums">{value}</span>;
    default:
      return <span>{value}</span>;
  }
}

export function plainCell(kind: ColumnKind | undefined, value: string | number | undefined): string {
  if (value === undefined) return "";
  if (kind === "currency" || kind === "signedCurrency") return formatCurrency(Number(value));
  if (kind === "date" && typeof value === "string" && isIsoDate(value)) return formatDate(value);
  if (kind === "percent") return `${value}%`;
  return String(value);
}
