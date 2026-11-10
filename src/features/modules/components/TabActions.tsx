"use client";

import { ChevronLeft, FileSpreadsheet, Play, Plus, Printer, Save, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { TabAction } from "@/config/modules";
import { usePermission } from "@/hooks/usePermission";
import { emitPageCommand } from "@/lib/events";

/** Form id used by entry screens so header buttons can submit them via the `form` attribute. */
export const ENTRY_FORM_ID = "journal-entry-form";

export function TabActions({ actions, newLabel = "New" }: { actions: TabAction[]; newLabel?: string }) {
  const router = useRouter();
  const canManage = usePermission("transactions:manage");

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
              <Button key={a} variant="outline" size="sm" leftIcon={<Save />} type="submit" form={ENTRY_FORM_ID} value="draft">
                Save Draft
              </Button>
            ) : null;
          case "post":
            return canManage ? (
              <Button key={a} variant="success" size="sm" leftIcon={<Send />} type="submit" form={ENTRY_FORM_ID} value="post">
                Post Entry
              </Button>
            ) : null;
          case "cancel":
            return canManage ? (
              <Button key={a} variant="outlineDanger" size="sm" leftIcon={<X />} type="reset" form={ENTRY_FORM_ID}>
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
              <Button key={a} variant="excel" size="sm" leftIcon={<Play />} onClick={() => emitPageCommand("generate")}>
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
