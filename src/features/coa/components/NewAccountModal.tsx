"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Layers, ListTree, Save, SlidersHorizontal, X } from "lucide-react";
import type { BaseSyntheticEvent } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormInput, FormSelect, FormTextarea } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { errorMessage, fieldErrors } from "@/services/api/errors";
import { useCreateAccountMutation, useGetAccountsQuery, useUpdateAccountMutation } from "@/services/api/endpoints/coaApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { accountSchema, type AccountFormValues } from "../schemas";
import { ACCOUNT_CLASSIFICATIONS, type Account, type AccountInput } from "../types";

const DEFAULTS: AccountFormValues = {
  code: "",
  title: "",
  parentCode: "1.01",
  classification: "Asset",
  accountType: "Balance Sheet",
  normalBalance: "Debit",
  uacs: "",
  postable: true,
  active: true,
  description: "",
};

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-900">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-neutral-300"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
      {label}
    </label>
  );
}

const toForm = (a: Account): AccountFormValues => ({
  code: a.code,
  title: a.title,
  parentCode: a.parentCode ?? "",
  classification: a.classification,
  accountType: a.accountType,
  normalBalance: a.normalBalance,
  uacs: a.uacs ?? "",
  postable: a.postable,
  active: a.status === "Active",
  description: a.description,
});

/** New Account (`POST /coa/accounts`) and Edit Account (`PATCH /coa/accounts/{id}`). */
export function AccountFormModal({ open, editing, onClose }: { open: boolean; editing?: Account | null; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { data: accounts = [] } = useGetAccountsQuery();
  const parents = accounts.filter((a) => !a.postable);
  const [createAccount, createState] = useCreateAccountMutation();
  const [updateAccount, updateState] = useUpdateAccountMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountFormValues>({ resolver: zodResolver(accountSchema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (open) reset(editing ? toForm(editing) : DEFAULTS);
  }, [open, editing, reset]);

  const onValid = async (v: AccountFormValues, e?: BaseSyntheticEvent) => {
    if (saving) return;
    const again = !editing && (e?.nativeEvent as SubmitEvent | undefined)?.submitter?.getAttribute("value") === "again";
    const input: AccountInput = {
      code: v.code,
      title: v.title,
      parentCode: v.parentCode || null,
      classification: v.classification,
      accountType: v.accountType,
      normalBalance: v.normalBalance,
      uacs: v.uacs || undefined,
      postable: v.postable,
      status: v.active ? "Active" : "Inactive",
      description: v.description || `${v.title} account.`,
    };
    const res = editing
      ? await updateAccount({ id: editing.id, patch: { title: input.title, classification: input.classification, accountType: input.accountType, normalBalance: input.normalBalance, uacs: input.uacs, postable: input.postable, status: input.status, description: input.description } })
      : await createAccount(input);
    if ("data" in res && res.data) {
      dispatch(showToast({ variant: "success", title: editing ? "Account updated" : "Account created", description: `${v.code} – ${v.title}` }));
      if (again) reset({ ...DEFAULTS, parentCode: v.parentCode, classification: v.classification });
      else onClose();
      return;
    }
    const fields = fieldErrors(res.error);
    (Object.keys(fields) as Array<keyof AccountFormValues>).forEach((k) => setError(k, { message: fields[k] }));
    if (!Object.keys(fields).length) dispatch(showToast({ variant: "error", title: editing ? "Could not update account" : "Could not create account", description: errorMessage(res.error) }));
  };

  const formId = "new-account-form";
  const box = "rounded-lg border border-neutral-200 p-4";
  const boxTitle = "mb-3 flex items-center gap-2 text-sm font-bold text-ink-900 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-brand-600";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit Account ${editing.code}` : "New Account"}
      icon={<ListTree />}
      size="xl"
      dismissible={!saving}
      footer={
        <>
          <Button variant="outline" leftIcon={<X />} onClick={onClose} disabled={saving} className="sm:mr-auto">
            Cancel
          </Button>
          {!editing && (
            <Button variant="outline" leftIcon={<Save />} type="submit" form={formId} value="again" disabled={saving}>
              Save &amp; Add Another
            </Button>
          )}
          <Button variant="blue" leftIcon={<Save />} type="submit" form={formId} value="save" loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={handleSubmit(onValid)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <fieldset className={box}>
            <legend className="sr-only">Account information</legend>
            <p className={boxTitle}>
              <FileText aria-hidden /> Account Information
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput label="Account Code" required placeholder="1.01.07" readOnly={Boolean(editing)} hint={editing ? "Codes cannot be changed once created" : undefined} error={errors.code?.message} {...register("code")} />
              <FormInput label="UACS Object Code" placeholder="1990199000" inputMode="numeric" maxLength={10} error={errors.uacs?.message} {...register("uacs")} />
              <FormInput label="Account Title" required placeholder="Other Current Assets" error={errors.title?.message} containerClassName="sm:col-span-2" {...register("title")} />
              <FormSelect
                label="Parent Account"
                required
                disabled={Boolean(editing)}
                options={parents.map((p) => ({ value: p.code, label: `${p.code} – ${p.title}` }))}
                error={errors.parentCode?.message}
                {...register("parentCode")}
              />
              <FormSelect label="Account Classification" required options={ACCOUNT_CLASSIFICATIONS} error={errors.classification?.message} {...register("classification")} />
              <FormSelect label="Financial Statement" required options={["Balance Sheet", "Income Statement"]} {...register("accountType")} />
            </div>
          </fieldset>
          <div className="space-y-4">
            <fieldset className={box}>
              <legend className="sr-only">Account properties</legend>
              <p className={boxTitle}>
                <Layers aria-hidden /> Account Properties
              </p>
              <div className="flex items-center gap-5 text-sm">
                <span className="font-semibold text-ink-800">Normal Balance *</span>
                {(["Debit", "Credit"] as const).map((v) => (
                  <label key={v} className="inline-flex items-center gap-1.5">
                    <input type="radio" value={v} className="accent-blue-600" {...register("normalBalance")} /> {v}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className={box}>
              <legend className="sr-only">Reporting and control</legend>
              <p className={boxTitle}>
                <SlidersHorizontal aria-hidden /> Reporting &amp; Control
              </p>
              <div className="space-y-2.5">
                <Switch label="Allow Posting" checked={watch("postable")} onChange={(v) => setValue("postable", v, { shouldDirty: true })} />
                <Switch label="Active" checked={watch("active")} onChange={(v) => setValue("active", v, { shouldDirty: true })} />
              </div>
            </fieldset>
          </div>
        </div>
        <FormTextarea label="Description" rows={3} placeholder="Accounts for other current assets not classified elsewhere…" error={errors.description?.message} {...register("description")} />
      </form>
    </Modal>
  );
}
