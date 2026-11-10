import type { Row } from "@/features/modules/types";

export interface MonthlyCollection {
  month: string;
  billed: number;
  collected: number;
  rate: number;
}

export interface ShareSlice {
  name: string;
  value: number;
}

export interface ReceivablesOverview {
  totalBilled: number;
  totalCollected: number;
  collectionRate: number;
  uncollected: number;
  overdue: number;
  trend: MonthlyCollection[];
  byCustomer: ShareSlice[];
  collections: Row[];
}
