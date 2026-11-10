import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageBody, PageHeader } from "@/components/shared/PageHeader";
import { getModule, getTab } from "@/config/modules";
import { TabActions } from "@/features/modules/components/TabActions";
import { ModuleTabs } from "./ModuleTabs";

/**
 * Server-rendered frame shared by all module screens: header band (icon, title, actions),
 * optional pill tabs, and the tab's client view.
 */
export function ModulePage({
  moduleKey,
  tab,
  children,
  showTabs = true,
}: {
  moduleKey: string;
  tab: string;
  children: ReactNode;
  showTabs?: boolean;
}) {
  const mod = getModule(moduleKey);
  const t = getTab(moduleKey, tab);
  if (!t) notFound();
  return (
    <>
      <PageHeader
        title={t.title ?? t.label}
        description={t.description}
        icon={t.icon}
        actions={t.actions?.length ? <TabActions actions={t.actions} newLabel={t.newLabel} /> : undefined}
        tabs={showTabs ? <ModuleTabs module={mod} active={tab} /> : undefined}
      />
      <PageBody>{children}</PageBody>
    </>
  );
}

export function moduleStaticParams(moduleKey: string) {
  return getModule(moduleKey).tabs.map((t) => ({ tab: t.slug }));
}

export function moduleMetadata(moduleKey: string, tab: string) {
  const t = getTab(moduleKey, tab);
  return { title: t ? `${t.title ?? t.label}` : getModule(moduleKey).label };
}
