// クライアント側（FilterableTable）からも読み込まれるため、lib/config などからは型以外を import しないこと。
// lib/config はモジュール読み込み時に fs で設定ファイルを読む。
import type { ColumnDef, FilterOrder } from "@/lib/config";

export type FilterSpec = { key: string; order: FilterOrder; levelMode: boolean };
export type FilterProblem = "badge" | "invalid" | "order";

function defaultKey(column: Exclude<ColumnDef, { type: "badge" }>): string {
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
