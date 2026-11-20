// クライアント側から読み込まれるため、lib/config と lib/client-rows からは型だけを読み込む
import type { ColumnDef } from "@/lib/config";
import type { ClientRow } from "@/lib/client-rows";

/**
 * 全件がこの行数を超える表は仮想スクロールで描画する。
 * これ以下なら全行を描画したほうが、ページ内検索が効き、フィルタ操作も十分速い（65行で解除 65ms）。
 */
export const VIRTUALIZE_THRESHOLD = 200;

export type TableItem =
  | { kind: "header"; level: string; count: number }
  | { kind: "row"; row: ClientRow; stripeIndex: number };

/** 難易度の見出しと表示中の行を、描画順の1本のリストにする（仮想スクロール用） */
export function buildTableItems(
  groups: ReadonlyMap<string, readonly ClientRow[]>,
  visible: ReadonlySet<ClientRow> | null
): TableItem[] {
  const items: TableItem[] = [];
  for (const [level, levelRows] of groups) {
    const shown = visible ? levelRows.filter((row) => visible.has(row)) : levelRows;
    items.push({ kind: "header", level, count: shown.length });
    shown.forEach((row, stripeIndex) => items.push({ kind: "row", row, stripeIndex }));
  }
  return items;
}

// 日本語（かな・漢字・全角記号）は文字ごとに折り返せるので、空白と同じく単語の区切りとして扱う
const BREAKABLE = /[\s\u3000-\u30ff\u3400-\u9fff\uff00-\uffef]+/;
const longestWord = (text: string) => Math.max(0, ...text.split(BREAKABLE).map((word) => word.length));

/**
 * 列幅を決めるための行を選ぶ（仮想スクロール用）。各カラムで、表示文字列が最も長い行と、
 * 折り返せない単語が最も長い行を選ぶ。グリッドの列の最小幅は、この2つでほぼ決まる。
 * 返す順番は入力の順番で、同じ行は1回だけ含める。
 */
export function pickSizerRows(rows: readonly ClientRow[], columns: readonly ColumnDef[]): ClientRow[] {
  const picked = new Set<ClientRow>();
  const pickMax = (measure: (row: ClientRow) => number) => {
    let best: ClientRow | undefined;
    let bestValue = -1;
    for (const row of rows) {
      const value = measure(row);
      if (value > bestValue) {
        best = row;
        bestValue = value;
      }
    }
    if (best) picked.add(best);
  };

  columns.forEach((column, i) => {
    if (column.type === "level") {
      pickMax((row) => row.level.length);
    } else if (column.type === "text" || column.type === "link") {
      pickMax((row) => (row.texts[i] ?? "").length);
      pickMax((row) => longestWord(row.texts[i] ?? ""));
    }
    // badge は全行で同じラベルなので、列幅は行によって変わらない
  });
  return rows.filter((row) => picked.has(row));
}
