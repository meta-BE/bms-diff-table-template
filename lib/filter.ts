// クライアント側（FilterableTable）からも読み込まれるため、lib/config などからは型以外を import しないこと。
// lib/config はモジュール読み込み時に fs で設定ファイルを読む。
import type { ColumnDef, FilterableColumn, FilterOrder } from "@/lib/config";
import type { ClientRow } from "@/lib/client-rows";

export type FilterSpec = { key: string; order: FilterOrder; levelMode: boolean };
export type FilterProblem = "badge" | "invalid" | "order";
export type FilterOption = { value: string; label: string; count: number };
export type FilterState = { columnIndex: number; values: ReadonlySet<string> };

export const EMPTY_LABEL = "（空）";

// 年や難易度などの数字を数値として比べる（"2" が "10" より前）
const collator = new Intl.Collator("ja", { numeric: true });

function defaultKey(column: FilterableColumn): string {
  return column.type === "level" ? "level" : column.property;
}

/**
 * カラムの filter 設定を解釈する。設定は JSON から型チェックなしで読み込まれるため、生の値として判定する。
 * 検証（validate-entries）と実際の動作の両方がこの結果を使い、判定の食い違いを防ぐ。
 */
export function inspectFilter(column: ColumnDef): { spec: FilterSpec | null; problems: FilterProblem[] } {
  const raw = (column as { filter?: unknown }).filter;
  if (raw === undefined) return { spec: null, problems: [] };
  if (column.type === "badge") return { spec: null, problems: ["badge"] };

  if (raw === true) {
    return { spec: { key: defaultKey(column), order: "asc", levelMode: column.type === "level" }, problems: [] };
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { spec: null, problems: ["invalid"] };
  }

  const { property, order } = raw as { property?: unknown; order?: unknown };
  if (property !== undefined && (typeof property !== "string" || property === "")) {
    return { spec: null, problems: ["invalid"] };
  }

  const problems: FilterProblem[] = [];
  let resolvedOrder: FilterOrder = "asc";
  if (order === "asc" || order === "desc") {
    resolvedOrder = order;
  } else if (order !== undefined) {
    problems.push("order");
  }

  const key = property ?? defaultKey(column);
  // Lv 特例（難易度順の並びと symbol 付きのラベル）は property を省略したときだけ適用する
  const levelMode = column.type === "level" && property === undefined;
  return { spec: { key, order: resolvedOrder, levelMode }, problems };
}

export function resolveFilterSpec(column: ColumnDef): FilterSpec | null {
  return inspectFilter(column).spec;
}

export function normalizeFilterValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  return String(value);
}

export function buildFilterOptions(
  rows: readonly ClientRow[],
  columnIndex: number,
  spec: FilterSpec,
  ctx: { levelOrder: readonly string[]; symbol: string }
): FilterOption[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row.filterValues[columnIndex];
    if (value === null || value === undefined) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const values = Array.from(counts.keys()).filter((v) => v !== "");
  if (spec.levelMode) {
    const rank = new Map(ctx.levelOrder.map((level, i) => [level, i]));
    values.sort((a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity) || collator.compare(a, b));
  } else {
    values.sort(collator.compare);
  }
  if (spec.order === "desc") values.reverse();

  const options = values.map((value) => ({
    value,
    label: spec.levelMode ? `${ctx.symbol}${value}` : value,
    count: counts.get(value)!,
  }));
  const emptyCount = counts.get("");
  if (emptyCount) options.push({ value: "", label: EMPTY_LABEL, count: emptyCount });
  return options;
}

export function applyFilter(rows: readonly ClientRow[], filter: FilterState | null): readonly ClientRow[] {
  if (!filter) return rows;
  return rows.filter((row) => {
    const value = row.filterValues[filter.columnIndex];
    return value !== null && value !== undefined && filter.values.has(value);
  });
}
