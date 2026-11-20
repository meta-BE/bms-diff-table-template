"use client";

import { memo } from "react";
// lib/config と lib/client-rows はサーバー専用の処理（fs）を含むため、型だけを読み込む
import type { Align, ColumnDef } from "@/lib/config";
import type { ClientRow } from "@/lib/client-rows";
import { EllipsisCell } from "@/components/EllipsisCell";

export const LEVEL_HEADER_CLASS = "table-grid-header-row bg-base-300 text-center font-bold p-2";

const ALIGN_CLASS: Record<Align, string> = {
  left: "",
  center: "text-center",
  right: "text-right",
};

export function cellClassName(column: ColumnDef): string {
  const parts = ["p-2", "border-b", "border-base-200"];
  const align = column.align ? ALIGN_CLASS[column.align] : "";
  if (align) parts.push(align);
  if (column.nowrap) parts.push("whitespace-nowrap");
  if (column.ellipsis) parts.push("min-w-0");
  return parts.join(" ");
}

export function getCellText(column: ColumnDef, row: ClientRow, index: number, symbol: string): string {
  switch (column.type) {
    case "level":
      return `${symbol}${row.level}`;
    case "badge":
      return column.label;
    default:
      return row.texts[index] ?? "";
  }
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link link-hover">
      {children}
    </a>
  );
}

function CellContent({ column, row, index, symbol }: { column: ColumnDef; row: ClientRow; index: number; symbol: string }) {
  const text = row.texts[index];
  const url = row.urls[index];
  switch (column.type) {
    case "level":
      return <>{symbol}{row.level}</>;
    case "text":
      return <>{text}</>;
    case "link":
      if (text === null) return null;
      if (url) return <ExternalLink href={url}>{text}</ExternalLink>;
      return <>{text}</>;
    case "badge":
      if (!url) return null;
      return <ExternalLink href={url}>{column.label}</ExternalLink>;
  }
}

export interface TableRowProps {
  row: ClientRow;
  columns: ColumnDef[];
  symbol: string;
  cellClassNames: string[];
  rowClassName: string;
  hidden?: boolean;
  /** 仮想スクロールで行の高さを実測するための ref と、その行の位置 */
  measureRef?: (el: HTMLDivElement | null) => void;
  index?: number;
}

// フィルタを切り替えたときに、表示内容が変わらない行の再描画を省く
export const TableRow = memo(function TableRow({
  row,
  columns,
  symbol,
  cellClassNames,
  rowClassName,
  hidden,
  measureRef,
  index,
}: TableRowProps) {
  return (
    <div
      ref={measureRef}
      data-index={index}
      aria-rowindex={index === undefined ? undefined : index + 2}
      className={rowClassName}
      role="row"
      hidden={hidden}
    >
      {columns.map((col, i) => (
        <div key={`${col.header}-${i}`} className={cellClassNames[i]} role="cell">
          {col.ellipsis ? (
            <EllipsisCell text={getCellText(col, row, i, symbol)}>
              <CellContent column={col} row={row} index={i} symbol={symbol} />
            </EllipsisCell>
          ) : (
            <CellContent column={col} row={row} index={i} symbol={symbol} />
          )}
        </div>
      ))}
    </div>
  );
});
