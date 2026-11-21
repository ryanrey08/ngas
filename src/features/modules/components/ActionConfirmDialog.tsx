"use client";

import { useEffect, useState } from "react";
import { FormTextarea } from "@/components/forms";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import type { RecordAction } from "../recordWorkflows";

/** Confirms a workflow action; collects remarks (required) for rejections, returns and reversals. */
export function ActionConfirmDialog({
  action,
  recordLabel,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  action: RecordAction | null;
  recordLabel: string;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (remarks?: string) => void;
}) {
  const [remarks, setRemarks] = useState("");
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (action) {
      setRemarks("");
      setTouched(false);
    }
  }, [action]);
  const missing = Boolean(action?.remarks) && !remarks.trim();
  return (
    <ConfirmationDialog
      open={Boolean(action)}
      onClose={onClose}
      loading={loading}
      title={`${action?.label ?? ""}?`}
      confirmLabel={action?.label ?? "Confirm"}
      variant={action?.tone === "danger" ? "danger" : "primary"}
      onConfirm={() => {
        setTouched(true);
        if (!missing) onConfirm(remarks.trim() || undefined);
      }}
      description={
        <div className="space-y-3">
          <p>
            {action?.key === "delete" ? (
              <>
                <b className="text-ink-900">{recordLabel}</b> will be deleted permanently.
              </>
            ) : (
              <>
                <b className="text-ink-900">{recordLabel}</b> will be marked <b>{action?.to}</b>.
              </>
            )}
          </p>
          {action?.remarks && (
            <FormTextarea label="Remarks / reason" required rows={2} maxLength={255} value={remarks} onChange={(e) => setRemarks(e.target.value)} error={touched && missing ? "Enter the reason" : error} />
          )}
          {!action?.remarks && error && <p className="text-xs font-semibold text-brand-700">{error}</p>}
        </div>
      }
    />
  );
}
