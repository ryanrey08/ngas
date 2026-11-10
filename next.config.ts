import type { NextConfig } from "next";

/** Module landing paths → their first tab (mirrors src/config/modules.ts). */
const MODULE_DEFAULT_TABS: Record<string, string> = {
  "/double-entry": "entry",
  "/accrual": "entry",
  "/coa": "accounts",
  "/journals": "crj",
  "/cash": "transactions",
  "/receivables": "overview",
  "/payables": "overview",
  "/financial-reports": "list",
  "/setup": "funds",
};

const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(MODULE_DEFAULT_TABS).map(([source, tab]) => ({
      source,
      destination: `${source}/${tab}`,
      permanent: false,
    }));
  },
};

export default nextConfig;
