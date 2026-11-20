"use client";

// @tanstack/react-virtual を含むため、FilterableTable から next/dynamic で遅延読み込みする。
// 200行以下の表（多くの難易度表）では、このモジュールを読み込まない。
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { ColumnDef } from "@/lib/config";
import type { ClientRow } from "@/lib/client-rows";
import { pickSizerRows, type TableItem } from "@/lib/table-items";
import { LEVEL_HEADER_CLASS, TableRow, getCellText } from "@/components/TableRow";

// 行の高さの推定値（1行の表示で約41px）。実際の高さは描画後に実測して置き換える
const ESTIMATED_ROW_HEIGHT = 41;
// SSR とハイドレーション直後に使う表示サイズの仮定。サーバーは先頭のこの範囲だけを HTML に含める
const INITIAL_RECT = { width: 1280, height: 800 };

export interface VirtualTableBodyProps {
  items: TableItem[];
  /** 列幅の決定に使う全行（絞り込み前） */
  allRows: ClientRow[];
  columns: ColumnDef[];
  symbol: string;
  cellClassNames: string[];
  rowClassName: (indexInGroup: number) => string;
}

/** 大きな表で、表示範囲の行だけを描画する。描画しない範囲は上下の全幅スペーサーで高さを確保する */
export function VirtualTableBody({ items, allRows, columns, symbol, cellClassNames, rowClassName }: VirtualTableBodyProps) {
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

  // グリッドの列幅は、描画中の行の内容で決まる。描画する行がスクロールで入れ替わると列幅が揺れるため、
  // 各カラムで最も幅を取りそうな行を、高さ0の見えない行として常に置いておく
  const sizerRows = useMemo(() => pickSizerRows(allRows, columns), [allRows, columns]);

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
      {sizerRows.map((row) => (
        <div
          key={`sizer:${row.md5}`}
          role="presentation"
          aria-hidden="true"
          className="grid grid-cols-subgrid col-span-full h-0 overflow-hidden invisible"
        >
          {columns.map((col, i) => (
            <div key={`${col.header}-${i}`} className={cellClassNames[i]}>
              {getCellText(col, row, i, symbol)}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
