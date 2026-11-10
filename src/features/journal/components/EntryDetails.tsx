import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { entryTotal, type JournalEntry } from "../types";

export function EntryInfoList({ entry }: { entry: JournalEntry }) {
  const rows: Array<[string, React.ReactNode]> = [
    ["Transaction No.", <span key="n" className="font-mono font-semibold">{entry.transactionNo}</span>],
    ["Transaction Date", formatDate(entry.date)],
    ["Journal Type", entry.journalType],
    ["Reference No.", entry.referenceNo],
    ["Department", entry.department],
    ["Description", entry.description],
    ["Status", <StatusBadge key="s" status={entry.status} />],
    ["Posted By", entry.postedBy ?? "—"],
    ["Posted On", entry.postedAt ? formatDate(entry.postedAt, { year: "numeric", month: "short", day: "2-digit", hour: "numeric", minute: "2-digit" }) : "—"],
  ];
  return (
    <dl className="grid grid-cols-[minmax(0,130px)_1fr] gap-x-3 gap-y-1.5 text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-neutral-600">{k}</dt>
          <dd className="text-ink-900">: {v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EntryLinesTable({ entry, className }: { entry: Pick<JournalEntry, "lines">; className?: string }) {
  const total = entryTotal(entry);
  return (
    <div className={cn("scrollbar-thin relative overflow-x-auto", className)}>
      <table className="w-full min-w-[560px] text-xs">
        <caption className="sr-only">Accounting entries</caption>
        <thead>
          <tr className="bg-navy-900 text-white">
            <th scope="col" className="px-3 py-2 text-left font-semibold">No.</th>
            <th scope="col" className="px-3 py-2 text-left font-semibold">Account Code</th>
            <th scope="col" className="px-3 py-2 text-left font-semibold">Account Title</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Debit (₱)</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Credit (₱)</th>
            <th scope="col" className="px-3 py-2 text-left font-semibold">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {entry.lines.map((l, i) => (
            <tr key={i} className="border-b border-neutral-100">
              <td className="px-3 py-2">{i + 1}</td>
              <td className="px-3 py-2 font-mono">{l.accountCode}</td>
              <td className="px-3 py-2">{l.accountTitle}</td>
              <td className="px-3 py-2 text-right tabular-nums">{l.debit ? formatCurrency(l.debit).replace("₱", "") : "–"}</td>
              <td className="px-3 py-2 text-right tabular-nums">{l.credit ? formatCurrency(l.credit).replace("₱", "") : "–"}</td>
              <td className="px-3 py-2 text-neutral-600">{l.remarks}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-brand-50 font-bold text-ink-900">
            <td colSpan={3} className="px-3 py-2 text-right">Total</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(total)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(entry.lines.reduce((s, l) => s + l.credit, 0))}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
