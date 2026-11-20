import type { TableEntry } from "@/lib/fetch-table-data";
import type { TableConfig } from "@/lib/config";
import { toClientRows } from "@/lib/client-rows";
import { FilterableTable } from "@/components/FilterableTable";

interface TableViewProps {
  entries: TableEntry[];
  config: TableConfig;
  fileExists?: (pathname: string) => boolean;
}

/**
 * サーバーコンポーネント。fileExists（fs を使う）を評価できるのはサーバーだけなので、
 * セルの値と URL をここで解決し、描画とフィルタはクライアントの FilterableTable に任せる。
 */
export function TableView({ entries, config, fileExists = () => true }: TableViewProps) {
  const { symbol, levelOrder, columns, tableStyle } = config;
  const rows = toClientRows(entries, columns, fileExists);
  // クライアントコンポーネントの props は RSC ペイロードにそのまま載る。
  // 設定全体を渡すと dataUrl（GAS の URL）がページに出るため、必要な4項目だけのオブジェクトを作る
  return <FilterableTable rows={rows} config={{ symbol, levelOrder, columns, tableStyle }} />;
}
