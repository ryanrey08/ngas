"use client";

import { Save, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormInput, FormSelect, FormTextarea } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { errorMessage, fieldErrors } from "@/services/api/errors";
import { useCreateRecordMutation, useUpdateRecordMutation, type RecordRow } from "@/services/api/endpoints/recordsApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { RECORD_FORMS } from "../recordForms";

/** Create / edit form for module records that have a form definition (see recordForms.ts). */
export function RecordFormModal({ resource, open, editing, onClose }: { resource: string; open: boolean; editing: RecordRow | null; onClose: () => void }) {
  const form = RECORD_FORMS[resource];
  const dispatch = useAppDispatch();
  const [create, createState] = useCreateRecordMutation();
  const [update, updateState] = useUpdateRecordMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const blank = Object.fromEntries((form?.fields ?? []).map((f) => [f.key, f.options?.[0] ?? ""]));
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Record<string, string>>({ defaultValues: blank });

  useEffect(() => {
    if (open) reset(editing ? Object.fromEntries((form?.fields ?? []).map((f) => [f.key, String(editing[f.key] ?? "")])) : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  if (!form) return null;

  const onValid = async (values: Record<string, string>) => {
    if (saving) return;
    const result = editing ? await update({ resource, id: editing.id, values }) : await create({ resource, values });
    if ("error" in result && result.error) {
      const fields = fieldErrors(result.error);
      Object.entries(fields).forEach(([k, m]) => setError(k, { message: m }));
      if (!Object.keys(fields).length) dispatch(showToast({ variant: "error", title: `Could not save ${form.title.toLowerCase()}`, description: errorMessage(result.error) }));
      return;
    }
    dispatch(showToast({ variant: "success", title: editing ? `${form.title} updated` : `${form.title} created`, description: values.code || values.name }));
    onClose();
  };

  const formId = `record-form-${resource.replace("/", "-")}`;
  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!saving}
      size="lg"
      title={editing ? `Edit ${form.title}` : `New ${form.title}`}
      footer={
        <>
          <Button variant="outline" leftIcon={<X />} onClick={onClose} disabled={saving} className="sm:mr-auto">
            Cancel
          </Button>
          <Button variant="blue" leftIcon={<Save />} type="submit" form={formId} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={handleSubmit(onValid)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {form.fields.map((f) => {
          const rules = {
            required: f.required ? `${f.label} is required` : false,
            maxLength: f.maxLength ? { value: f.maxLength, message: `Max ${f.maxLength} characters` } : undefined,
            pattern: f.pattern ? { value: new RegExp(f.pattern.regex), message: f.pattern.message } : undefined,
          };
          const common = { label: f.label, required: f.required, error: errors[f.key]?.message, containerClassName: f.wide ? "sm:col-span-2" : undefined };
          if (f.type === "select") return <FormSelect key={f.key} {...common} options={f.options ?? []} {...register(f.key, rules)} />;
          if (f.type === "textarea") return <FormTextarea key={f.key} {...common} rows={3} maxLength={f.maxLength} placeholder={f.placeholder} {...register(f.key, rules)} />;
          return <FormInput key={f.key} {...common} placeholder={f.placeholder} maxLength={f.maxLength} disabled={Boolean(editing && f.lockedOnEdit)} {...register(f.key, rules)} />;
        })}
      </form>
    </Modal>
  );
}
