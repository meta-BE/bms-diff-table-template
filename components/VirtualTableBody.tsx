"use client";

// @tanstack/react-virtual を含むため、FilterableTable から next/dynamic で遅延読み込みする。
// 200行以下の表（多くの難易度表）では、このモジュールを読み込まない。
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { ColumnDef } from "@/lib/config";
import type { ClientRow } from "@/lib/client-rows";
import { pickSizerRows, type TableItem } from "@/lib/table-items";
import { LEVEL_HEADER_CLASS, TableRow, getCellText } from "@/components/TableRow";

// 行の高さの推定値（1行の表示で約41px）。実際の高さは描画後に実測して置き換える
const ESTIMATED_ROW_HEIGHT = 41;
const OVERSCAN = 10;
// サーバーとハイドレーション時に描画する先頭の件数（高さ 800px 分の推定行数 + 前後の余裕分）
const INITIAL_COUNT = Math.ceil(800 / ESTIMATED_ROW_HEIGHT) + OVERSCAN;

export interface VirtualTableBodyProps {
  items: TableItem[];
  /** 列幅の決定に使う全行（絞り込み前） */
  allRows: ClientRow[];
  columns: ColumnDef[];
  symbol: string;
  cellClassNames: string[];
  rowClassName: (indexInGroup: number) => string;
}

type ItemRenderProps = Omit<VirtualTableBodyProps, "items" | "allRows">;

function Spacer({ height, spacerRef }: { height: number; spacerRef?: React.Ref<HTMLDivElement> }) {
  return <div ref={spacerRef} className="col-span-full" style={{ height }} aria-hidden="true" />;
}

function Item({
  item,
  index,
  measureRef,
  columns,
  symbol,
  cellClassNames,
  rowClassName,
}: ItemRenderProps & { item: TableItem; index: number; measureRef?: (el: HTMLDivElement | null) => void }) {
  if (item.kind === "header") {
    return (
      <div ref={measureRef} data-index={index} aria-rowindex={index + 2} className={LEVEL_HEADER_CLASS} role="row">
        {symbol}{item.level} ({item.count}譜面)
      </div>
    );
  }
  return (
    <TableRow
      row={item.row}
      columns={columns}
      symbol={symbol}
      cellClassNames={cellClassNames}
      rowClassName={rowClassName(item.stripeIndex)}
      measureRef={measureRef}
      index={index}
    />
  );
}

const itemKey = (item: TableItem) => (item.kind === "header" ? `h:${item.level}` : `r:${item.row.md5}`);

/**
 * サーバーとハイドレーション時の描画。スクロール位置に依存しない先頭の範囲だけを描くので、
 * 再読み込みでブラウザがスクロール位置を復元していても、サーバーの HTML と食い違わない。
 */
function InitialItems({ items, ...rest }: ItemRenderProps & { items: TableItem[] }) {
  const head = items.slice(0, INITIAL_COUNT);
  return (
    <>
      <Spacer height={0} />
      {head.map((item, i) => (
        <Item key={itemKey(item)} item={item} index={i} {...rest} />
      ))}
      <Spacer height={(items.length - head.length) * ESTIMATED_ROW_HEIGHT} />
    </>
  );
}

/** マウント後の描画。表示範囲の行だけを描き、描画しない範囲は上下の全幅スペーサーで高さを確保する */
function VirtualItems({ items, ...rest }: ItemRenderProps & { items: TableItem[] }) {
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

  // 初期位置は既定（window.scrollY）のままにする。0 を指定すると、マウント時に復元済みのスクロール位置を先頭へ書き戻してしまう
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: OVERSCAN,
    scrollMargin,
    getItemKey: (i) => itemKey(items[i]),
  });
  const virtualItems = virtualizer.getVirtualItems();
  const first = virtualItems[0];
  const last = virtualItems[virtualItems.length - 1];
  const paddingTop = first ? first.start - scrollMargin : 0;
  const paddingBottom = last ? virtualizer.getTotalSize() - (last.end - scrollMargin) : 0;

  return (
    <>
      <Spacer height={paddingTop} spacerRef={startRef} />
      {virtualItems.map((virtualItem) => (
        <Item
          key={virtualItem.key}
          item={items[virtualItem.index]}
          index={virtualItem.index}
          measureRef={virtualizer.measureElement}
          {...rest}
        />
      ))}
      <Spacer height={paddingBottom} />
    </>
  );
}

/** 大きな表の本体。ハイドレーションまでは先頭の範囲を固定で描き、マウント後に仮想スクロールへ切り替える */
export function VirtualTableBody({ items, allRows, ...rest }: VirtualTableBodyProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // 再読み込み時、ブラウザはページの読み込みが終わるまでスクロール位置の復元を続ける。
    // その前に仮想スクロールがスクロール位置を書き込むと復元が打ち切られるので、load まで待ってから切り替える
    if (document.readyState === "complete") {
      setMounted(true);
      return;
    }
    const onLoad = () => setMounted(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // グリッドの列幅は、描画中の行の内容で決まる。描画する行がスクロールで入れ替わると列幅が揺れるため、
  // 各カラムで最も幅を取りそうな行を、高さ0の見えない行として常に置いておく
  const sizerRows = useMemo(() => pickSizerRows(allRows, rest.columns), [allRows, rest.columns]);

  return (
    <>
      {mounted ? <VirtualItems items={items} {...rest} /> : <InitialItems items={items} {...rest} />}
      {sizerRows.map((row) => (
        <div
          key={`sizer:${row.md5}`}
          role="presentation"
          aria-hidden="true"
          className="grid grid-cols-subgrid col-span-full h-0 overflow-hidden invisible"
        >
          {rest.columns.map((col, i) => (
            <div key={`${col.header}-${i}`} className={rest.cellClassNames[i]}>
              {getCellText(col, row, i, rest.symbol)}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
