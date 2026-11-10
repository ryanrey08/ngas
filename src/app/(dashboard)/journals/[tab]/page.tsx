import type { Metadata } from "next";
import { ModulePage, moduleMetadata, moduleStaticParams } from "@/components/layout/ModulePage";
import { RecordListView } from "@/features/modules/components/RecordListView";

import { getModule } from "@/config/modules";
import { SubmoduleMenu } from "@/features/modules/components/SubmoduleMenu";

const MODULE = "journals";
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
  return (
    <ModulePage moduleKey={MODULE} tab={tab} showTabs={false}>
      <RecordListView listKey={`${MODULE}/${tab}`} aside={<SubmoduleMenu module={getModule(MODULE)} active={tab} />} />
    </ModulePage>
  );
}
