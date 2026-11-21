"use client";

import { ChevronLeft, FileSpreadsheet, Play, Plus, Printer, Save, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { TabAction } from "@/config/modules";
import { usePermission } from "@/hooks/usePermission";
import { emitPageCommand } from "@/lib/events";
import { SAVE_ENTRY_KEY, useCreateJournalEntryMutation } from "@/services/api/endpoints/journalApi";
import { useGenerateAutoJournalMutation } from "@/services/api/endpoints/recordsApi";

/** Form id used by entry screens so header buttons can submit them via the `form` attribute. */
export const ENTRY_FORM_ID = "journal-entry-form";

export function TabActions({ actions, newLabel = "New" }: { actions: TabAction[]; newLabel?: string }) {
  const router = useRouter();
  const canManage = usePermission("transactions:manage");
  // Same mutation cache as the entry form: Save/Post stay disabled while a save is in flight.
  const [, { isLoading: saving }] = useCreateJournalEntryMutation({ fixedCacheKey: SAVE_ENTRY_KEY });
  const [, { isLoading: generating }] = useGenerateAutoJournalMutation({ fixedCacheKey: "auto-journal-generate" });

  return (
    <>
      {actions.map((a) => {
        switch (a) {
          case "back":
            return (
              <Button key={a} variant="outline" size="sm" leftIcon={<ChevronLeft />} onClick={() => router.back()}>
                Back
              </Button>
            );
          case "saveDraft":
            return canManage ? (
              <Button key={a} variant="outline" size="sm" leftIcon={<Save />} type="submit" form={ENTRY_FORM_ID} value="draft" disabled={saving}>
                Save Draft
              </Button>
            ) : null;
          case "post":
            return canManage ? (
              <Button key={a} variant="success" size="sm" leftIcon={<Send />} type="submit" form={ENTRY_FORM_ID} value="post" loading={saving}>
                Post Entry
              </Button>
            ) : null;
          case "cancel":
            return canManage ? (
              <Button key={a} variant="outlineDanger" size="sm" leftIcon={<X />} type="reset" form={ENTRY_FORM_ID} disabled={saving}>
                Cancel
              </Button>
            ) : null;
          case "exportExcel":
            return (
              <Button key={a} variant="excel" size="sm" leftIcon={<FileSpreadsheet />} onClick={() => emitPageCommand("export")}>
                Export to Excel
              </Button>
            );
          case "print":
            return (
              <Button key={a} variant="outline" size="sm" leftIcon={<Printer />} onClick={() => window.print()}>
                Print
              </Button>
            );
          case "new":
            return canManage ? (
              <Button key={a} variant="success" size="sm" leftIcon={<Plus />} onClick={() => emitPageCommand("new")}>
                {newLabel}
              </Button>
            ) : null;
          case "generate":
            return (
              <Button key={a} variant="excel" size="sm" leftIcon={<Play />} loading={generating} onClick={() => emitPageCommand("generate")}>
                Generate Entries
              </Button>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
