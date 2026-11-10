import { isMockApi } from "@/config/env";
import type { ReportDef } from "@/features/financial-reports/types";
import type { HomeSummary } from "@/features/home/types";
import type { Row } from "@/features/modules/types";
import type { PayablesOverview } from "@/features/payables/types";
import type { ReceivablesOverview } from "@/features/receivables/types";
import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import { delay } from "@/mocks/delay";
import { MODULE_LISTS } from "@/mocks/moduleLists";
import { MOCK_RECENT_REPORTS, MOCK_REPORT_DEFS } from "@/mocks/financialReports";
import { MOCK_HOME_SUMMARY, MOCK_PAYABLES_OVERVIEW, MOCK_RECEIVABLES_OVERVIEW } from "@/mocks/overviews";

/** Generic read service for module list screens, keyed "<module>/<tab>" (maps to GET /<module>/<tab>). */
export const moduleService = {
  async getList(key: string): Promise<Row[]> {
    if (isMockApi) {
      await delay(250 + Math.random() * 250);
      return MODULE_LISTS[key] ?? [];
    }
    const { data } = await apiClient.get<Row[]>(`/${key}`);
    return data;
  },

  async getHomeSummary(): Promise<HomeSummary> {
    if (isMockApi) {
      await delay();
      return MOCK_HOME_SUMMARY;
    }
    const { data } = await apiClient.get<HomeSummary>(API_ENDPOINTS.dashboard.summary);
    return data;
  },

  async getReceivablesOverview(): Promise<ReceivablesOverview> {
    if (isMockApi) {
      await delay();
      return MOCK_RECEIVABLES_OVERVIEW;
    }
    const { data } = await apiClient.get<ReceivablesOverview>(API_ENDPOINTS.receivablesOverview);
    return data;
  },

  async getPayablesOverview(): Promise<PayablesOverview> {
    if (isMockApi) {
      await delay();
      return MOCK_PAYABLES_OVERVIEW;
    }
    const { data } = await apiClient.get<PayablesOverview>(API_ENDPOINTS.payablesOverview);
    return data;
  },

  async getFinancialReports(): Promise<{ reports: ReportDef[]; recent: Array<{ name: string; at: string }> }> {
    if (isMockApi) {
      await delay();
      return { reports: MOCK_REPORT_DEFS, recent: MOCK_RECENT_REPORTS };
    }
    const { data } = await apiClient.get<{ reports: ReportDef[]; recent: Array<{ name: string; at: string }> }>(API_ENDPOINTS.financialReports);
    return data;
  },
};
