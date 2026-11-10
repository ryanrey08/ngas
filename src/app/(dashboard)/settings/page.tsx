import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageBody, PageHeader } from "@/components/shared/PageHeader";
import { PreferencesCard } from "@/features/settings/components/PreferencesCard";
import { ProfileForm } from "@/features/settings/components/ProfileForm";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" icon={Settings} description="Manage your profile and application preferences." />
      <PageBody>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ProfileForm />
        </div>
        <PreferencesCard />
      </div>
      </PageBody>
    </>
  );
}
