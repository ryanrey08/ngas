import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ModulePage, moduleMetadata, moduleStaticParams } from "@/components/layout/ModulePage";
import { RecordListView } from "@/features/modules/components/RecordListView";
import { ChartOfAccountsView } from "@/features/coa/components/ChartOfAccountsView";

const MODULE = "coa";
type Props = { params: Promise<{ tab: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return moduleStaticParams(MODULE);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return moduleMetadata(MODULE, (await params).tab);
}

export default async function Page({ params }: Props) {
  const { tab } = await params;
  const VIEWS: Record<string, ReactNode> = {
    accounts: <ChartOfAccountsView />,
  };
  return (
    <ModulePage moduleKey={MODULE} tab={tab}>
      {VIEWS[tab] ?? <RecordListView listKey={`${MODULE}/${tab}`} />}
    </ModulePage>
  );
}
