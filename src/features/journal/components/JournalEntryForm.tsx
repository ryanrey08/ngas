"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, CircleAlert, CircleCheck, Info, ListOrdered, Paperclip, Plus, Trash2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type BaseSyntheticEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { DatePicker, FormInput, FormSelect, FormTextarea } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fetchAccounts } from "@/features/coa/coaSlice";
import { ENTRY_FORM_ID } from "@/features/modules/components/TabActions";
import { usePermission } from "@/hooks/usePermission";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { createJournalEntry } from "../journalSlice";
import { journalEntrySchema, type JournalEntryFormValues } from "../schemas";
import { ACCRUAL_TYPES, DEPARTMENTS, JOURNAL_TYPES, PROJECT_CODES, type JournalKind } from "../types";

const today = () => new Date().toISOString().slice(0, 10);

const blankLine = (department = "") => ({ accountCode: "", department, debit: 0, credit: 0, remarks: "" });

function defaults(kind: JournalKind): JournalEntryFormValues {
  return {
    date: today(),
    journalType: kind === "accrual" ? ACCRUAL_TYPES[0] : JOURNAL_TYPES[0],
    referenceNo: "",
    description: "",
    department: DEPARTMENTS[0],
    projectCode: "",
    lines: [blankLine(DEPARTMENTS[0]), blankLine(DEPARTMENTS[0])],
  };
}

const num = { setValueAs: (v: unknown) => (v === "" || v === null || v === undefined ? 0 : Number(v)) };

export function JournalEntryForm({ kind }: { kind: JournalKind }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const canManage = usePermission("transactions:manage");
  const user = useAppSelector((s) => s.auth.user);
  const { accounts, status: coaStatus } = useAppSelector((s) => s.coa);
  const submitting = useAppSelector((s) => s.journal.mutationStatus === "loading");
  const [selected, setSelected] = useState<number[]>([]);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<"attachments" | "documents" | null>(null);

  useEffect(() => {
    if (coaStatus === "idle") void dispatch(fetchAccounts());
  }, [coaStatus, dispatch]);

  const postable = useMemo(() => accounts.filter((a) => a.postable && a.uacs), [accounts]);
  const accountOptions = postable.map((a) => ({ value: a.uacs!, label: `${a.uacs} – ${a.title}` }));
  const titleOf = (code: string) => postable.find((a) => a.uacs === code)?.title ?? "";

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JournalEntryFormValues>({ resolver: zodResolver(journalEntrySchema), defaultValues: defaults(kind) });
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = useWatch({ control, name: "lines" });
  const description = useWatch({ control, name: "description" }) ?? "";
  const headerDept = useWatch({ control, name: "department" });

  const totalDebit = lines.reduce((s, l) => s + (Number(l?.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l?.credit) || 0), 0);
  const balanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.005;

  const onValid = async (values: JournalEntryFormValues, event?: BaseSyntheticEvent) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter;
    const post = submitter?.getAttribute("value") === "post";
    if (post && !balanced) {
      setBalanceError("Total debits must equal total credits before posting.");
      return;
    }
    setBalanceError(null);
    const res = await dispatch(
      createJournalEntry({
        ...values,
        kind,
        status: post ? "Posted" : "Draft",
        lines: values.lines.map((l) => ({ ...l, accountTitle: titleOf(l.accountCode) })),
      }),
    );
    if (createJournalEntry.fulfilled.match(res)) {
      dispatch(
        showToast({
          variant: "success",
          title: post ? "Entry posted to the books" : "Draft saved",
          description: `${res.payload.transactionNo} · ${formatCurrency(totalDebit)}`,
        }),
      );
      reset(defaults(kind));
      setSelected([]);
      if (post && kind === "double-entry") router.push("/double-entry/posted");
    } else {
      dispatch(showToast({ variant: "error", title: "Could not save entry", description: res.payload?.message }));
    }
  };

  const deleteSelected = () => {
    if (fields.length - selected.length < 2) {
      dispatch(showToast({ variant: "error", title: "Keep at least two lines" }));
      return;
    }
    remove(selected);
    setSelected([]);
  };

  const typeOptions = kind === "accrual" ? ACCRUAL_TYPES : JOURNAL_TYPES;
  const prefix = kind === "accrual" ? "ACR" : "GJ";

  return (
    <form
      id={ENTRY_FORM_ID}
      noValidate
      onSubmit={handleSubmit(onValid)}
      onReset={(e) => {
        e.preventDefault();
        reset(defaults(kind));
        setSelected([]);
        setBalanceError(null);
      }}
      className="space-y-4"
    >
      {!canManage && (
        <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <Info className="h-4 w-4" aria-hidden /> Your role can view this screen but cannot save or post entries.
        </p>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-card" aria-label="Transaction details">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FormInput label={kind === "accrual" ? "Accrual No." : "Transaction No."} required value={`${prefix}-2026-(auto)`} readOnly disabled hint="Assigned when saved" />
          <DatePicker label="Transaction Date" required error={errors.date?.message} {...register("date")} />
          <FormSelect label={kind === "accrual" ? "Accrual Type" : "Journal Type"} required options={typeOptions} error={errors.journalType?.message} {...register("journalType")} />
          <FormInput label="Reference No." required placeholder="e.g. RV-2026-0154" error={errors.referenceNo?.message} {...register("referenceNo")} />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink-800">Status</span>
            <span className="flex h-10 items-center">
              <StatusBadge status="Draft" />
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_1fr_1fr]">
          <div className="relative">
            <FormTextarea
              label={kind === "accrual" ? "Description" : "Transaction Description"}
              required
              rows={3}
              maxLength={255}
              placeholder="e.g. Recognition of utility expense (Meralco) for October 2026."
              error={errors.description?.message}
              {...register("description")}
            />
            <span className="pointer-events-none absolute right-2 bottom-2 text-[0.65rem] text-neutral-400" aria-hidden>
              {description.length} / 255
            </span>
          </div>
          <FormSelect label="Department / Cost Center" required options={DEPARTMENTS} error={errors.department?.message} {...register("department")} />
          <FormSelect label="Project Code" placeholder="- Select Project Code -" options={PROJECT_CODES} {...register("projectCode")} />
        </div>
      </section>

      <SectionCard
        title={kind === "accrual" ? "Accrual Entries" : "Accounting Entries (Double Entry)"}
        icon={ListOrdered}
        bodyClassName="p-0"
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Plus />} onClick={() => append(blankLine(headerDept))}>
              Add Line
            </Button>
            <Button size="sm" variant="outlineDanger" leftIcon={<Trash2 />} disabled={selected.length === 0} onClick={deleteSelected}>
              Delete Line
            </Button>
          </>
        }
      >
        <div className="scrollbar-thin relative overflow-x-auto">
          <table className="w-full min-w-[860px] text-xs">
            <caption className="sr-only">Journal lines</caption>
            <thead>
              <tr className="bg-navy-900 text-white">
                <th scope="col" className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all lines"
                    className="accent-brand-600"
                    checked={selected.length > 0 && selected.length === fields.length}
                    onChange={(e) => setSelected(e.target.checked ? fields.map((_, i) => i) : [])}
                  />
                </th>
                <th scope="col" className="w-10 px-2 py-2 text-left font-semibold">No.</th>
                <th scope="col" className="px-2 py-2 text-left font-semibold">Account Code</th>
                <th scope="col" className="px-2 py-2 text-left font-semibold">Account Title</th>
                <th scope="col" className="px-2 py-2 text-left font-semibold">Department / Cost Center</th>
                <th scope="col" className="w-32 px-2 py-2 text-right font-semibold">Debit (₱)</th>
                <th scope="col" className="w-32 px-2 py-2 text-right font-semibold">Credit (₱)</th>
                <th scope="col" className="px-2 py-2 text-left font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => {
                const lineErr = errors.lines?.[i];
                const code = lines[i]?.accountCode ?? "";
                const cell = "h-8 w-full rounded border bg-white px-2 text-xs focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none";
                return (
                  <tr key={f.id} className="border-b border-neutral-100 align-top">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select line ${i + 1}`}
                        className="mt-2 accent-brand-600"
                        checked={selected.includes(i)}
                        onChange={(e) => setSelected((s) => (e.target.checked ? [...s, i] : s.filter((x) => x !== i)))}
                      />
                    </td>
                    <td className="px-2 py-2 pt-3.5">{i + 1}</td>
                    <td className="px-2 py-2">
                      <select aria-label={`Account code, line ${i + 1}`} aria-invalid={lineErr?.accountCode ? true : undefined} className={cn(cell, lineErr?.accountCode ? "border-brand-600" : "border-neutral-300")} {...register(`lines.${i}.accountCode`)}>
                        <option value="">Select account…</option>
                        {accountOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {lineErr?.accountCode && <p className="mt-0.5 text-[0.65rem] text-brand-700">{lineErr.accountCode.message}</p>}
                    </td>
                    <td className="px-2 py-2 pt-3.5 text-ink-900">{titleOf(code) || <span className="text-neutral-400">—</span>}</td>
                    <td className="px-2 py-2">
                      <select aria-label={`Department, line ${i + 1}`} className={cn(cell, "border-neutral-300")} {...register(`lines.${i}.department`)}>
                        {DEPARTMENTS.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" step="0.01" min="0" aria-label={`Debit, line ${i + 1}`} aria-invalid={lineErr?.debit ? true : undefined} className={cn(cell, "text-right tabular-nums", lineErr?.debit ? "border-brand-600" : "border-neutral-300")} {...register(`lines.${i}.debit`, num)} />
                      {lineErr?.debit && <p className="mt-0.5 text-[0.65rem] text-brand-700">{lineErr.debit.message}</p>}
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" step="0.01" min="0" aria-label={`Credit, line ${i + 1}`} className={cn(cell, "text-right tabular-nums border-neutral-300")} {...register(`lines.${i}.credit`, num)} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" aria-label={`Remarks, line ${i + 1}`} className={cn(cell, "border-neutral-300")} {...register(`lines.${i}.remarks`)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-stretch gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
          <span className="text-sm font-bold text-ink-900 sm:mr-2">Total</span>
          <span className="rounded-md bg-neutral-100 px-4 py-1.5 text-right text-sm font-bold tabular-nums" aria-label="Total debit">
            {formatCurrency(totalDebit)}
          </span>
          <span className="rounded-md bg-neutral-100 px-4 py-1.5 text-right text-sm font-bold tabular-nums" aria-label="Total credit">
            {formatCurrency(totalCredit)}
          </span>
          <span
            role="status"
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md border px-4 py-1.5 text-sm font-bold",
              balanced ? "border-green-300 bg-green-50 text-green-700" : "border-brand-200 bg-brand-50 text-brand-700",
            )}
          >
            {balanced ? <CircleCheck className="h-4 w-4" aria-hidden /> : <CircleAlert className="h-4 w-4" aria-hidden />}
            {balanced ? "Balanced" : "Not balanced"}
          </span>
        </div>
        {((balanceError && !balanced) || errors.lines?.root?.message || errors.lines?.message) && (
          <p role="alert" className="border-t border-brand-100 bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-800">
            {(!balanced && balanceError) || errors.lines?.root?.message || errors.lines?.message}
          </p>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-2">
          {([
            ["attachments", "Attachments (0)", Paperclip, "No files attached. Attach the signed voucher, bill or OR (PDF/JPG, max 10 MB)."],
            ["documents", "Supporting Documents", FileText, "Supporting documents (e.g., purchase order, inspection report) can be linked after saving."],
          ] as const).map(([key, label, Icon, text]) => (
            <div key={key} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <button
                type="button"
                onClick={() => setOpenPanel((p) => (p === key ? null : key))}
                aria-expanded={openPanel === key}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold text-ink-900 hover:bg-neutral-50"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" aria-hidden /> {label}
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", openPanel === key && "rotate-180")} aria-hidden />
              </button>
              {openPanel === key && <p className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-600">{text}</p>}
            </div>
          ))}
        </div>
        <SectionCard title={kind === "accrual" ? "Transaction Details" : "Journal Details"} icon={Info} bodyClassName="flex flex-wrap gap-x-8 gap-y-1 p-3 text-xs text-neutral-700">
          <span>Created By: <b className="text-ink-900">{user?.name ?? "—"}</b></span>
          <span>Created On: <b className="text-ink-900">{formatDate(new Date(), { year: "numeric", month: "short", day: "2-digit" })}</b></span>
          <span>Status: <b className="text-ink-900">{submitting ? "Saving…" : "Unsaved draft"}</b></span>
        </SectionCard>
      </div>
    </form>
  );
}
