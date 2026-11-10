"use client";

import { ChevronDown, ChevronRight, CircleAlert, Copy, FileText, Filter, ListTree, Pencil, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FormInput, FormSelect } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePageCommand } from "@/hooks/usePageCommand";
import { cn, downloadCsv } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { fetchAccounts } from "../coaSlice";
import { ACCOUNT_CLASSIFICATIONS, type Account } from "../types";
import { NewAccountModal } from "./NewAccountModal";

const EMPTY = { keyword: "", classification: "", type: "", status: "Active" };

export function ChartOfAccountsView() {
  const dispatch = useAppDispatch();
  const { accounts, status, error } = useAppSelector((s) => s.coa);
  const [draft, setDraft] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(["1.02", "2", "3", "4", "5", "6"]));
  const [selectedCode, setSelectedCode] = useState("1.01.01");
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    if (status === "idle") void dispatch(fetchAccounts());
  }, [status, dispatch]);

  usePageCommand("new", () => setNewOpen(true));
  usePageCommand("export", () => {
    downloadCsv("engas-chart-of-accounts.csv", accounts.map((a) => ({ Code: a.code, Title: a.title, UACS: a.uacs ?? "", Classification: a.classification, Type: a.accountType, "Normal Balance": a.normalBalance, Status: a.status })));
    dispatch(showToast({ variant: "success", title: "Chart of Accounts exported" }));
  });

  const filtering = Boolean(applied.keyword || applied.classification || applied.type || applied.status !== "Active");
  const hasChildren = useMemo(() => new Set(accounts.map((a) => a.parentCode).filter(Boolean) as string[]), [accounts]);

  const visible = useMemo(() => {
    const k = applied.keyword.trim().toLowerCase();
    const matches = (a: Account) =>
      (!k || a.code.includes(k) || a.title.toLowerCase().includes(k) || (a.uacs ?? "").includes(k)) &&
      (!applied.classification || a.classification === applied.classification) &&
      (!applied.type || a.accountType === applied.type) &&
      (!applied.status || a.status === applied.status);
    if (filtering) return accounts.filter(matches);
    // Tree mode: hide rows whose ancestor is collapsed
    return accounts.filter((a) => {
      const parts = a.code.split(".");
      for (let i = 1; i < parts.length; i++) if (collapsed.has(parts.slice(0, i).join("."))) return false;
      return true;
    });
  }, [accounts, applied, collapsed, filtering]);

  const selected = accounts.find((a) => a.code === selectedCode) ?? null;
  const toggle = (code: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });

  return (
    <>
      <SectionCard title="Search / Filter" icon={Filter} bodyClassName="p-3">
        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(draft);
          }}
        >
          <FormInput label="Account Code / Title" placeholder="Search account code or title…" value={draft.keyword} onChange={(e) => setDraft({ ...draft, keyword: e.target.value })} />
          <FormSelect label="Account Classification" placeholder="All Classifications" options={ACCOUNT_CLASSIFICATIONS} value={draft.classification} onChange={(e) => setDraft({ ...draft, classification: e.target.value })} />
          <FormSelect label="Account Type" placeholder="All Types" options={["Balance Sheet", "Income Statement"]} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} />
          <FormSelect label="Status" placeholder="All" options={["Active", "Inactive"]} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} />
          <div className="flex items-end gap-2">
            <Button type="submit" variant="blue" leftIcon={<Search />}>
              Search
            </Button>
            <Button
              variant="outline"
              leftIcon={<RotateCcw />}
              onClick={() => {
                setDraft(EMPTY);
                setApplied(EMPTY);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <SectionCard
          title="Chart of Accounts (RCA)"
          icon={ListTree}
          bodyClassName="p-0"
          actions={<span className="text-xs text-neutral-600">Total Records: <b className="text-ink-900">{accounts.length.toLocaleString()}</b></span>}
        >
          {status === "failed" ? (
            <ErrorState message={error} onRetry={() => dispatch(fetchAccounts())} />
          ) : status !== "succeeded" ? (
            <div className="py-16 text-center">
              <LoadingSpinner size="lg" label="Loading accounts…" />
            </div>
          ) : (
            <div className="scrollbar-thin relative overflow-x-auto">
              <table className="w-full min-w-[720px] text-xs">
                <caption className="sr-only">Chart of accounts</caption>
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th scope="col" className="px-3 py-2.5 text-left font-semibold">Account Code</th>
                    <th scope="col" className="px-3 py-2.5 text-left font-semibold">Account Title</th>
                    <th scope="col" className="px-3 py-2.5 text-left font-semibold">Classification</th>
                    <th scope="col" className="px-3 py-2.5 text-left font-semibold">Account Type</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">Status</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                        No accounts match your filters.
                      </td>
                    </tr>
                  )}
                  {visible.map((a) => {
                    const isParent = hasChildren.has(a.code);
                    const open = !collapsed.has(a.code);
                    const isSel = a.code === selectedCode;
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedCode(a.code)}
                        className={cn("cursor-pointer border-b border-neutral-100 hover:bg-brand-50/40", isSel && "bg-blue-50", !a.postable && "font-semibold")}
                      >
                        <td className="px-3 py-1.5 whitespace-nowrap" style={{ paddingLeft: filtering ? undefined : 12 + (a.level - 1) * 16 }}>
                          <span className="inline-flex items-center gap-1">
                            {isParent && !filtering ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggle(a.code);
                                }}
                                aria-label={`${open ? "Collapse" : "Expand"} ${a.title}`}
                                aria-expanded={open}
                                className="rounded p-0.5 text-neutral-500 hover:bg-neutral-200"
                              >
                                {open ? <ChevronDown className="h-3.5 w-3.5" aria-hidden /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
                              </button>
                            ) : (
                              <span className="w-[18px]" aria-hidden />
                            )}
                            <span className="font-mono">{a.code}</span>
                          </span>
                        </td>
                        <td className="px-3 py-1.5">{a.title}</td>
                        <td className="px-3 py-1.5">{a.classification}</td>
                        <td className="px-3 py-1.5">{a.accountType}</td>
                        <td className="px-3 py-1.5 text-center">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <span className="inline-flex gap-1">
                            <button type="button" aria-label={`Edit ${a.code}`} className="rounded p-1 text-neutral-600 hover:bg-neutral-100" onClick={() => dispatch(showToast({ variant: "info", title: "Editing is disabled in demo mode" }))}>
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </button>
                            <button
                              type="button"
                              aria-label={`Copy ${a.code}`}
                              className="rounded p-1 text-neutral-600 hover:bg-neutral-100"
                              onClick={() => {
                                void navigator.clipboard?.writeText(`${a.code} ${a.title}`);
                                dispatch(showToast({ variant: "success", title: "Copied", description: `${a.code} – ${a.title}` }));
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Account Details" icon={CircleAlert}>
            {selected ? (
              <dl className="grid grid-cols-[minmax(0,120px)_1fr] gap-y-1.5 text-xs">
                {(
                  [
                    ["Account Code", selected.code],
                    ["Account Title", selected.title],
                    ["UACS Code", selected.uacs ?? "—"],
                    ["Classification", selected.classification],
                    ["Account Type", selected.accountType],
                    ["Parent Account", selected.parentCode ? `${selected.parentCode} – ${accounts.find((a) => a.code === selected.parentCode)?.title ?? ""}` : "—"],
                    ["Level", String(selected.level)],
                    ["Normal Balance", selected.normalBalance],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="font-semibold text-neutral-600">{k}</dt>
                    <dd className="text-ink-900">: {v}</dd>
                  </div>
                ))}
                <dt className="font-semibold text-neutral-600">Status</dt>
                <dd>
                  : <StatusBadge status={selected.status} />
                </dd>
              </dl>
            ) : (
              <p className="text-xs text-neutral-500">Select an account to view its details.</p>
            )}
          </SectionCard>
          <SectionCard title="Description" icon={FileText}>
            <p className="text-xs text-neutral-700">{selected?.description ?? "—"}</p>
          </SectionCard>
        </div>
      </div>
      <NewAccountModal open={newOpen} onClose={() => setNewOpen(false)} />
    </>
  );
}
