import type { ColumnDef } from "./config";
import type { TableEntry } from "./fetch-table-data";

export interface ValidationIssue {
  level: "error" | "warning";
  column: string;
  detail: string;
  message: string;
  rows: number[];
  totalEntries: number;
}

export interface ValidationResult {
  issues: ValidationIssue[];
}

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

function extractPlaceholderKeys(template: string): string[] {
  return Array.from(template.matchAll(PLACEHOLDER_RE), (m) => m[1]);
}

export function validateEntries(
  entries: TableEntry[],
  columns: ColumnDef[]
): ValidationResult {
  const issueMap = new Map<string, ValidationIssue>();

  for (const column of columns) {
    if (column.type === "text" || column.type === "link") {
      const mapKey = `${column.header}:property:${column.property}`;
      for (let i = 0; i < entries.length; i++) {
        if (!(column.property in entries[i])) {
          if (!issueMap.has(mapKey)) {
            issueMap.set(mapKey, {
              level: "error",
              column: column.header,
              detail: `property: "${column.property}"`,
              message: "キー未定義",
              rows: [],
              totalEntries: entries.length,
            });
          }
          issueMap.get(mapKey)!.rows.push(i + 1);
        }
      }
    }

    if (column.type === "link" || column.type === "badge") {
      const templateKeys = extractPlaceholderKeys(column.url);
      for (const templateKey of templateKeys) {
        const mapKey = `${column.header}:url:${templateKey}`;
        for (let i = 0; i < entries.length; i++) {
          if (!(templateKey in entries[i])) {
            if (!issueMap.has(mapKey)) {
              issueMap.set(mapKey, {
                level: column.type === "badge" ? "error" : "warning",
                column: column.header,
                detail: `url key: "${templateKey}"`,
                message: "キー未定義",
                rows: [],
                totalEntries: entries.length,
              });
            }
            issueMap.get(mapKey)!.rows.push(i + 1);
          }
        }
      }
    }
  }

  return { issues: Array.from(issueMap.values()) };
}
