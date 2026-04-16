import type { ColumnDef } from "./config";
import type { TableEntry } from "./fetch-table-data";
import { extractPlaceholderKeys } from "./resolve-template";

export interface ValidationIssue {
  level: "error" | "warning";
  column: string;
  detail: string;
  message: string;
  rows: number[];
}

export interface ValidationResult {
  issues: ValidationIssue[];
  totalEntries: number;
}

function collectMissingKeyRows(
  entries: TableEntry[],
  key: string,
  issueMap: Map<string, ValidationIssue>,
  mapKey: string,
  template: Omit<ValidationIssue, "rows">
): void {
  for (let i = 0; i < entries.length; i++) {
    if (!(key in entries[i])) {
      if (!issueMap.has(mapKey)) {
        issueMap.set(mapKey, { ...template, rows: [] });
      }
      issueMap.get(mapKey)!.rows.push(i + 1);
    }
  }
}

export function validateEntries(
  entries: TableEntry[],
  columns: ColumnDef[]
): ValidationResult {
  const issueMap = new Map<string, ValidationIssue>();

  for (const column of columns) {
    if (column.type === "text" || column.type === "link") {
      collectMissingKeyRows(entries, column.property, issueMap, `${column.header}:property:${column.property}`, {
        level: "error",
        column: column.header,
        detail: `property: "${column.property}"`,
        message: "キー未定義",
      });
    }

    if (column.type === "link" || column.type === "badge") {
      for (const templateKey of extractPlaceholderKeys(column.url)) {
        collectMissingKeyRows(entries, templateKey, issueMap, `${column.header}:url:${templateKey}`, {
          level: column.type === "badge" ? "error" : "warning",
          column: column.header,
          detail: `url key: "${templateKey}"`,
          message: "キー未定義",
        });
      }
    }
  }

  return { issues: Array.from(issueMap.values()), totalEntries: entries.length };
}
