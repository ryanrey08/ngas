import type { LucideIcon } from "lucide-react";
import type { StatTone } from "@/components/ui/StatTile";

export type Row = Record<string, string | number>;

export type ColumnKind = "text" | "strong" | "mono" | "currency" | "signedCurrency" | "date" | "status" | "number" | "percent";

export interface ListColumn {
  key: string;
  header: string;
  kind?: ColumnKind;
  align?: "left" | "right" | "center";
  hideOnMobile?: boolean;
}

/** A KPI tile above a list. Its value is `metric` from `GET /<resource>/summary`. */
export interface ListTile {
  label: string;
  icon: LucideIcon;
  tone: StatTone;
  metric: string;
  format?: "currency" | "count";
}

export interface ListConfig {
  /** Heading of the table card */
  title: string;
  icon: LucideIcon;
  columns: ListColumn[];
  searchKeys: string[];
  /** Columns offered as dropdown filters (options are derived from the data) */
  filters?: Array<{ key: string; label: string }>;
  tiles?: ListTile[];
  /** Numeric columns summed in a total row */
  totals?: string[];
  pageSize?: number;
}
