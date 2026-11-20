import type { ColumnDef } from "./config";
import type { TableEntry } from "./fetch-table-data";
import { extractPlaceholderKeys } from "./resolve-template";
import { inspectFilter, type FilterProblem } from "./filter";

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

const FILTER_PROBLEM_MESSAGES: Record<FilterProblem, string> = {
  badge: "badge カラムでは filter は使えません",
  invalid: "filter の指定が不正です（true または { property, order }）",
  order: "order の値が不正です（asc / desc）",
};

function addFilterIssues(entries: TableEntry[], column: ColumnDef, issueMap: Map<string, ValidationIssue>): void {
  const { spec, problems } = inspectFilter(column);

  for (const problem of problems) {
    const detail =
      problem === "order"
        ? `filter.order: "${String((column as { filter?: { order?: unknown } }).filter?.order)}"`
        : "filter";
    // 設定の誤りは特定の行に結び付かないため rows は空にする
    issueMap.set(`${column.header}:filter:${problem}`, {
      level: "warning",
      column: column.header,
      detail,
      message: FILTER_PROBLEM_MESSAGES[problem],
      rows: [],
    });
  }

  if (!spec || spec.levelMode) return;
  // カラム自身の property と同じキーなら、既存の property チェックが同じことを確認している
  if ((column.type === "text" || column.type === "link") && spec.key === column.property) return;
  collectMissingKeyRows(entries, spec.key, issueMap, `${column.header}:filter-key:${spec.key}`, {
    level: "warning",
    column: column.header,
    detail: `filter key: "${spec.key}"`,
    message: "キー未定義",
  });
}

export function validateEntries(
  entries: TableEntry[],
  columns: ColumnDef[]
): ValidationResult {
  const issueMap = new Map<string, ValidationIssue>();

  for (const column of columns) {
    addFilterIssues(entries, column, issueMap);
    if (column.type === "level") continue;

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
