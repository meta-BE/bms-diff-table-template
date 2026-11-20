// サーバー専用: resolveCellUrl が lib/local-file 経由で fs を読み込むため、クライアント側からは import type のみ許可する。
import type { ColumnDef } from "@/lib/config";
import type { TableEntry } from "@/lib/fetch-table-data";
import { resolveCellUrl } from "@/lib/resolve-cell-url";
import { normalizeFilterValue, resolveFilterSpec } from "@/lib/filter";

/** クライアントに渡す1行分のデータ。配列はすべて columns と同じ順番。 */
export interface ClientRow {
  md5: string;
  level: string;
  /** text: 表示文字列 / link: 表示文字列（property がなければ null）/ level・badge: null */
  texts: (string | null)[];
  /** link・badge: 解決済みの URL（ファイル実在ゲート込み）/ それ以外: null */
  urls: (string | null)[];
  /** filter が有効なカラム: 正規化した値（空は ""）/ それ以外: null */
  filterValues: (string | null)[];
}

function toDisplayString(value: unknown): string {
  return value !== undefined && value !== null ? String(value) : "";
}

function cellText(column: ColumnDef, entry: TableEntry): string | null {
  switch (column.type) {
    case "text":
      return toDisplayString(entry[column.property]);
    case "link":
      return column.property in entry ? toDisplayString(entry[column.property]) : null;
    default:
      return null;
  }
}

/**
 * fileExists はサーバーでしか評価できない（fs を使う）ため、URL の解決までをここで済ませ、
 * クライアントには結果の文字列だけを渡す。
 */
export function toClientRows(
  entries: readonly TableEntry[],
  columns: readonly ColumnDef[],
  fileExists: (pathname: string) => boolean
): ClientRow[] {
  const specs = columns.map(resolveFilterSpec);
  return entries.map((entry) => ({
    md5: String(entry.md5),
    level: String(entry.level),
    texts: columns.map((column) => cellText(column, entry)),
    urls: columns.map((column) =>
      column.type === "link" || column.type === "badge" ? resolveCellUrl(column.url, entry, fileExists) : null
    ),
    filterValues: specs.map((spec) => (spec ? normalizeFilterValue(entry[spec.key]) : null)),
  }));
}
