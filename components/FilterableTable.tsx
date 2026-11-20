"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
// lib/config と lib/client-rows はサーバー専用の処理（fs）を含むため、型だけを読み込む
import type { ColumnDef, TableStyle } from "@/lib/config";
import type { ClientRow } from "@/lib/client-rows";
import { groupRowsByLevel, resolveLevelOrder } from "@/lib/group-by-level";
import { applyFilter, buildFilterOptions, resolveFilterSpec, type FilterState } from "@/lib/filter";
import { buildTableItems, VIRTUALIZE_THRESHOLD } from "@/lib/table-items";
import { FilterDropdown } from "@/components/FilterDropdown";
import { LEVEL_HEADER_CLASS, TableRow, cellClassName } from "@/components/TableRow";

// 仮想スクロール（@tanstack/react-virtual）は大きな表でしか使わないため、必要になったときだけ読み込む
const VirtualTableBody = dynamic(() => import("@/components/VirtualTableBody").then((m) => m.VirtualTableBody));

export interface FilterableTableConfig {
  symbol: string;
  levelOrder: string[];
  columns: ColumnDef[];
  tableStyle: TableStyle;
}

const NO_SELECTION: ReadonlySet<string> = new Set();

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
    <div
      // 仮想スクロールの表は、ブラウザのスクロールアンカーの対象から外す。再読み込み時、Chrome は基準の要素を
      // たどって位置を復元するが、仮想スクロールの行は再読み込み直後の HTML に無いので、別の要素に行き着いてずれる
      className={items ? "table-grid w-full [overflow-anchor:none]" : "table-grid w-full"}
      role="table"
      aria-rowcount={items ? items.length + 1 : undefined}
    >
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
        <VirtualTableBody
          items={items}
          allRows={rows}
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
