"use client";

import { Fragment, memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
// lib/config と lib/client-rows はサーバー専用の処理（fs）を含むため、型だけを読み込む
import type { Align, ColumnDef, TableStyle } from "@/lib/config";
import type { ClientRow } from "@/lib/client-rows";
import { groupRowsByLevel, resolveLevelOrder } from "@/lib/group-by-level";
import { applyFilter, buildFilterOptions, resolveFilterSpec, type FilterState } from "@/lib/filter";
import { buildTableItems, VIRTUALIZE_THRESHOLD, type TableItem } from "@/lib/table-items";
import { EllipsisCell } from "@/components/EllipsisCell";
import { FilterDropdown } from "@/components/FilterDropdown";

export interface FilterableTableConfig {
  symbol: string;
  levelOrder: string[];
  columns: ColumnDef[];
  tableStyle: TableStyle;
}

const NO_SELECTION: ReadonlySet<string> = new Set();

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
  hidden?: boolean;
  /** 仮想スクロールで行の高さを実測するための ref と、その行の位置 */
  measureRef?: (el: HTMLDivElement | null) => void;
  index?: number;
}

// フィルタを切り替えたときに、表示内容が変わらない行の再描画を省く
const TableRow = memo(function TableRow({
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

const LEVEL_HEADER_CLASS = "table-grid-header-row bg-base-300 text-center font-bold p-2";
// 行の高さの推定値（1行の表示で約41px）。実際の高さは描画後に実測して置き換える
const ESTIMATED_ROW_HEIGHT = 41;
// SSR とハイドレーション直後に使う表示サイズの仮定。サーバーは先頭のこの範囲だけを HTML に含める
const INITIAL_RECT = { width: 1280, height: 800 };

interface VirtualBodyProps {
  items: TableItem[];
  columns: ColumnDef[];
  symbol: string;
  cellClassNames: string[];
  rowClassName: (indexInGroup: number) => string;
}

/** 大きな表で、表示範囲の行だけを描画する。描画しない範囲は上下の全幅スペーサーで高さを確保する */
function VirtualBody({ items, columns, symbol, cellClassNames, rowClassName }: VirtualBodyProps) {
  const startRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // 表の上にある説明文などの高さが変わると、リストの開始位置（ページ先頭からの距離）も変わる
  useLayoutEffect(() => {
    const update = () => {
      if (startRef.current) setScrollMargin(startRef.current.getBoundingClientRect().top + window.scrollY);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 10,
    scrollMargin,
    initialRect: INITIAL_RECT,
    getItemKey: (i) => {
      const item = items[i];
      return item.kind === "header" ? `h:${item.level}` : `r:${item.row.md5}`;
    },
  });
  const virtualItems = virtualizer.getVirtualItems();
  const first = virtualItems[0];
  const last = virtualItems[virtualItems.length - 1];
  const paddingTop = first ? first.start - scrollMargin : 0;
  const paddingBottom = last ? virtualizer.getTotalSize() - (last.end - scrollMargin) : 0;

  return (
    <>
      <div ref={startRef} className="col-span-full" style={{ height: paddingTop }} aria-hidden="true" />
      {virtualItems.map((virtualItem) => {
        const item = items[virtualItem.index];
        if (item.kind === "header") {
          return (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              aria-rowindex={virtualItem.index + 2}
              className={LEVEL_HEADER_CLASS}
              role="row"
            >
              {symbol}{item.level} ({item.count}譜面)
            </div>
          );
        }
        return (
          <TableRow
            key={virtualItem.key}
            row={item.row}
            columns={columns}
            symbol={symbol}
            cellClassNames={cellClassNames}
            rowClassName={rowClassName(item.stripeIndex)}
            measureRef={virtualizer.measureElement}
            index={virtualItem.index}
          />
        );
      })}
      <div className="col-span-full" style={{ height: paddingBottom }} aria-hidden="true" />
    </>
  );
}

export function FilterableTable({ rows, config }: { rows: ClientRow[]; config: FilterableTableConfig }) {
  const { symbol, columns, tableStyle } = config;

  const [filter, setFilter] = useState<FilterState | null>(null);

  // 難易度の並びと選択肢は絞り込み前の全行から決める（0件の難易度の見出しを残すため）
  const levelOrder = useMemo(
    () => resolveLevelOrder(rows.map((row) => row.level), config.levelOrder),
    [rows, config.levelOrder]
  );
  const specs = useMemo(() => columns.map(resolveFilterSpec), [columns]);
  const optionsByColumn = useMemo(
    () => specs.map((spec, i) => (spec ? buildFilterOptions(rows, i, spec, { levelOrder, symbol }) : null)),
    [specs, rows, levelOrder, symbol]
  );
  // 除外した行はアンマウントせず hidden で隠す。解除のたびに全行の DOM を作り直すと、
  // 2,000行規模で1秒以上かかるため
  const visibleSet = useMemo(() => (filter ? new Set(applyFilter(rows, filter)) : null), [rows, filter]);
  const groups = useMemo(() => groupRowsByLevel(rows, levelOrder), [rows, levelOrder]);
  // 絞り込み前の全件で決める（絞り込みのたびに描画方式が切り替わらないように）
  const virtual = rows.length > VIRTUALIZE_THRESHOLD;
  const items = useMemo(() => (virtual ? buildTableItems(groups, visibleSet) : null), [virtual, groups, visibleSet]);
  const cellClassNames = useMemo(() => columns.map(cellClassName), [columns]);

  // 同時に有効なのは1カラムだけ。別のカラムで選んだら、それまでの選択は捨てる
  const toggleValue = useCallback((columnIndex: number, value: string) => {
    setFilter((current) => {
      const values = new Set(current?.columnIndex === columnIndex ? current.values : []);
      if (values.has(value)) values.delete(value);
      else values.add(value);
      return values.size > 0 ? { columnIndex, values } : null;
    });
  }, []);
  const clearColumn = useCallback((columnIndex: number) => {
    setFilter((current) => (current?.columnIndex === columnIndex ? null : current));
  }, []);

  const rowClassName = useCallback(
    (indexInGroup: number) =>
    [
      "grid grid-cols-subgrid col-span-full",
      tableStyle.hover ? "hover:bg-base-content/10 transition-colors" : "",
      tableStyle.stripe && indexInGroup % 2 === 0 ? "bg-base-content/5" : "",
    ]
      .filter(Boolean)
      .join(" "),
    [tableStyle.hover, tableStyle.stripe]
  );

  return (
    <div className="table-grid w-full" role="table" aria-rowcount={items ? items.length + 1 : undefined}>
      <div className="contents" role="row" aria-rowindex={items ? 1 : undefined}>
        {columns.map((col, i) => (
          <div key={`${col.header}-${i}`} className="font-bold bg-base-200 text-center p-2" role="columnheader">
            {col.header}
            {optionsByColumn[i] && (
              <FilterDropdown
                header={col.header}
                options={optionsByColumn[i]}
                selected={filter?.columnIndex === i ? filter.values : NO_SELECTION}
                onToggle={(value) => toggleValue(i, value)}
                onClear={() => clearColumn(i)}
              />
            )}
          </div>
        ))}
      </div>

      {items ? (
        <VirtualBody
          items={items}
          columns={columns}
          symbol={symbol}
          cellClassNames={cellClassNames}
          rowClassName={rowClassName}
        />
      ) : (
        Array.from(groups).map(([level, levelRows]) => {
          // ストライプと件数は、表示中の行だけで数え直す
          let visibleIndex = 0;
          const levelItems = levelRows.map((row) => {
            const visible = !visibleSet || visibleSet.has(row);
            return { row, visible, index: visible ? visibleIndex++ : 0 };
          });
          return (
            <Fragment key={`level-${level}`}>
              <div className={LEVEL_HEADER_CLASS} role="row">
                {symbol}{level} ({visibleIndex}譜面)
              </div>

              {levelItems.map(({ row, visible, index }) => (
                <TableRow
                  key={row.md5}
                  row={row}
                  columns={columns}
                  symbol={symbol}
                  cellClassNames={cellClassNames}
                  rowClassName={rowClassName(index)}
                  hidden={!visible}
                />
              ))}
            </Fragment>
          );
        })
      )}
    </div>
  );
}
