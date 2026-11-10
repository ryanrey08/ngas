"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { env } from "@/config/env";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarCollapsed } from "@/store/slices/uiSlice";

function Toggle({ id, checked, onChange, label, description }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-ink-900">
          {label}
        </label>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-brand-600" : "bg-neutral-300"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export function PreferencesCard() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Preferences" description="Saved on this device." />
        <CardBody className="space-y-5">
          <Toggle
            id="pref-sidebar"
            label="Compact sidebar"
            description="Show only icons in the navigation sidebar."
            checked={collapsed}
            onChange={(v) => dispatch(setSidebarCollapsed(v))}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="System" />
        <CardBody>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">API mode</dt>
              <dd className="font-semibold text-ink-900 uppercase">{env.apiMode}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">API base URL</dt>
              <dd className="truncate font-mono text-xs text-ink-900">{env.apiBaseUrl}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Fiscal year</dt>
              <dd className="font-semibold text-ink-900">2026</dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
