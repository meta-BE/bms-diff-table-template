// クライアント側から読み込まれるため、lib/client-rows からは型だけを読み込む
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
