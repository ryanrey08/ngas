/**
 * Central cache-tag vocabulary. Queries `provide` these, mutations `invalidate` them, so a change
 * made on one screen refreshes exactly the other screens that show the same data.
 */
export const TAG_TYPES = [
  "Dashboard",
  "Notification",
  "Institution",
  "Settings",
  "JournalEntry",
  "Account",
  "Record",
  "RecordSummary",
  "Overview",
  "ReportCatalog",
  "GeneratedReport",
  "User",
  "Role",
  "Permission",
] as const;

export type TagType = (typeof TAG_TYPES)[number];
export type Tag = TagType | { type: TagType; id: string | number };

export const LIST = "LIST";

/** Tags of a generic module resource ("<module>/<tab>", e.g. "payables/disbursements"). */
export const recordListTag = (resource: string): Tag => ({ type: "Record", id: `${resource}::${LIST}` });
export const recordTag = (resource: string, id: string): Tag => ({ type: "Record", id: `${resource}::${id}` });
export const recordSummaryTag = (resource: string): Tag => ({ type: "RecordSummary", id: resource });

/** A list query's tags: one per row plus the collection tag (so creates/deletes refetch it). */
export function listTags<T>(type: TagType, rows: T[] | undefined, id: (row: T) => string): Tag[] {
  return [...(rows ?? []).map((r) => ({ type, id: id(r) })), { type, id: LIST }];
}

/** Journal books that a journal entry of a given journal type is recorded in. */
const BOOK_OF_TYPE: Record<string, string> = {
  "General Journal (GJ)": "journals/gj",
  "Cash Receipts (CRJ)": "journals/crj",
  "Cash Disbursements (CDJ)": "journals/cdj",
  "Check Disbursements (CkDJ)": "journals/ckdj",
};

export function bookOfJournalType(journalType: string): string | undefined {
  return BOOK_OF_TYPE[journalType];
}

/**
 * Data on OTHER screens that a change to `resource` affects (the server recomputes these):
 * summary tiles, the module overview dashboards, the home dashboard and linked registers.
 */
export function relatedTags(resource: string): Tag[] {
  const [module] = resource.split("/");
  const tags: Tag[] = [recordSummaryTag(resource)];
  if (["journals", "cash", "double-entry", "accrual"].includes(module)) tags.push("Dashboard");
  if (module === "receivables") tags.push({ type: "Overview", id: "receivables" });
  if (module === "payables") tags.push({ type: "Overview", id: "payables" });
  // Releasing a disbursement voucher pays it out: it lands in the cash book and the CDJ.
  if (resource === "payables/disbursements") {
    tags.push(recordListTag("cash/transactions"), recordSummaryTag("cash/transactions"), recordListTag("journals/cdj"), recordSummaryTag("journals/cdj"), "Dashboard");
  }
  // A deposited collection settles the receivable it was issued against.
  if (resource === "receivables/collections") tags.push(recordListTag("receivables/receivables"), recordSummaryTag("receivables/receivables"));
  if (resource.startsWith("coa/")) tags.push(recordListTag("coa/history"));
  return tags;
}

/** What creating, posting or reversing a journal entry changes elsewhere. */
export function journalEntryEffects(journalType?: string): Tag[] {
  const book = journalType ? bookOfJournalType(journalType) : undefined;
  const tags: Tag[] = [
    { type: "JournalEntry", id: LIST },
    "Dashboard",
    recordListTag("journals/gl"),
    recordSummaryTag("journals/gl"),
    recordListTag("accrual/inquiry"),
  ];
  if (book) tags.push(recordListTag(book), recordSummaryTag(book));
  else for (const b of Object.values(BOOK_OF_TYPE)) tags.push(recordListTag(b), recordSummaryTag(b));
  return tags;
}
