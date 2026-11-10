import type { Row } from "@/features/modules/types";
import type { ShareSlice } from "@/features/receivables/types";

export interface PayablesOverview {
  total: number;
  buckets: { current: number; d30: number; d60: number; d90: number };
  agingBySupplier: Row[];
  distribution: ShareSlice[];
  trend: Array<{ month: string; balance: number }>;
  recent: Array<{ ref: string; party: string; amount: number; date: string; status: string }>;
}
