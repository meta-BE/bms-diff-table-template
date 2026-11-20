"use client";

import { Fragment, memo, useMemo } from "react";
// lib/config と lib/client-rows はサーバー専用の処理（fs）を含むため、型だけを読み込む
import type { Align, ColumnDef, TableStyle } from "@/lib/config";
import type { ClientRow } from "@/lib/client-rows";
import { groupRowsByLevel, resolveLevelOrder } from "@/lib/group-by-level";
import { EllipsisCell } from "@/components/EllipsisCell";

export interface FilterableTableConfig {
  symbol: string;
  levelOrder: string[];
  columns: ColumnDef[];
  tableStyle: TableStyle;
}

const ALIGN_CLASS: Record<Align, string> = {
  left: "",
  center: "text-center",
  right: "text-right",
};

function cellClassName(column: ColumnDef): string {
  const parts = ["p-2", "border-b", "border-base-200"];
  const align = column.align ? ALIGN_CLASS[column.align] : "";
  if (align) parts.push(align);
  if (column.nowrap) parts.push("whitespace-nowrap");
  if (column.ellipsis) parts.push("min-w-0");
  return parts.join(" ");
}

function getCellText(column: ColumnDef, row: ClientRow, index: number, symbol: string): string {
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

interface TableRowProps {
  row: ClientRow;
  columns: ColumnDef[];
  symbol: string;
  cellClassNames: string[];
  rowClassName: string;
}

// フィルタを切り替えたときに、表示内容が変わらない行の再描画を省く
const TableRow = memo(function TableRow({ row, columns, symbol, cellClassNames, rowClassName }: TableRowProps) {
  return (
    <div className={rowClassName} role="row">
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

export function FilterableTable({ rows, config }: { rows: ClientRow[]; config: FilterableTableConfig }) {
  const { symbol, columns, tableStyle } = config;

  const levelOrder = useMemo(
    () => resolveLevelOrder(rows.map((row) => row.level), config.levelOrder),
    [rows, config.levelOrder]
  );
  const groups = useMemo(() => groupRowsByLevel(rows, levelOrder), [rows, levelOrder]);
  const cellClassNames = useMemo(() => columns.map(cellClassName), [columns]);

  const rowClassName = (indexInGroup: number) =>
    [
      "grid grid-cols-subgrid col-span-full",
      tableStyle.hover ? "hover:bg-base-content/10 transition-colors" : "",
      tableStyle.stripe && indexInGroup % 2 === 0 ? "bg-base-content/5" : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="table-grid w-full" role="table">
      <div className="contents" role="row">
        {columns.map((col, i) => (
          <div key={`${col.header}-${i}`} className="font-bold bg-base-200 text-center p-2" role="columnheader">
            {col.header}
          </div>
        ))}
      </div>

      {Array.from(groups).map(([level, levelRows]) => (
        <Fragment key={`level-${level}`}>
          <div className="table-grid-header-row bg-base-300 text-center font-bold p-2" role="row">
            {symbol}{level} ({levelRows.length}譜面)
          </div>

          {levelRows.map((row, indexInGroup) => (
            <TableRow
              key={row.md5}
              row={row}
              columns={columns}
              symbol={symbol}
              cellClassNames={cellClassNames}
              rowClassName={rowClassName(indexInGroup)}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
