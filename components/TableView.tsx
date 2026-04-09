import { Fragment } from "react";
import type { TableEntry } from "@/lib/fetch-table-data";
import type { ColumnDef } from "@/lib/config";
import { resolveTemplate } from "@/lib/resolve-template";

interface TableViewProps {
  entries: TableEntry[];
  symbol: string;
  levelOrder: string[];
  columns: ColumnDef[];
}

function groupByLevel(
  entries: TableEntry[],
  levelOrder: string[]
): Map<string, TableEntry[]> {
  const groups = new Map<string, TableEntry[]>();

  for (const entry of entries) {
    const level = entry.level;
    if (!groups.has(level)) {
      groups.set(level, []);
    }
    groups.get(level)!.push(entry);
  }

  if (levelOrder.length === 0) {
    return groups;
  }

  const ordered = new Map<string, TableEntry[]>();
  for (const level of levelOrder) {
    if (groups.has(level)) {
      ordered.set(level, groups.get(level)!);
    }
  }
  for (const [level, entries] of groups) {
    if (!ordered.has(level)) {
      ordered.set(level, entries);
    }
  }
  return ordered;
}

function CellContent({ column, entry }: { column: ColumnDef; entry: TableEntry }) {
  switch (column.type) {
    case "text": {
      const value = entry[column.property];
      return <>{value !== undefined && value !== null ? String(value) : ""}</>;
    }
    case "link": {
      const text = entry[column.property];
      const displayText = text !== undefined && text !== null ? String(text) : "";
      const url = resolveTemplate(column.url, entry);
      if (url) {
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover"
          >
            {displayText}
          </a>
        );
      }
      return <>{displayText}</>;
    }
    case "badge": {
      const url = resolveTemplate(column.url, entry);
      if (!url) return null;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="link link-hover"
        >
          {column.label}
        </a>
      );
    }
  }
}

export function TableView({ entries, symbol, levelOrder, columns }: TableViewProps) {
  const grouped = groupByLevel(entries, levelOrder);

  return (
    <div className="table-grid w-full" role="table">
      {/* ヘッダー */}
      <div className="font-bold bg-base-200 p-2" role="columnheader">Level</div>
      {columns.map((col) => (
        <div key={col.header} className="font-bold bg-base-200 p-2" role="columnheader">
          {col.header}
        </div>
      ))}

      {/* ボディ */}
      {Array.from(grouped).map(([level, levelEntries]) => (
        <Fragment key={`level-${level}`}>
          {/* グループヘッダー */}
          <div className="table-grid-header-row bg-base-300 text-center font-bold p-2" role="row">
            {symbol}{level} ({levelEntries.length}譜面)
          </div>

          {/* 行 */}
          {levelEntries.map((entry) => (
            <Fragment key={entry.md5}>
              <div className="p-2 border-b border-base-200" role="cell">
                {symbol}{level}
              </div>
              {columns.map((col) => (
                <div key={col.header} className="p-2 border-b border-base-200" role="cell">
                  <CellContent column={col} entry={entry} />
                </div>
              ))}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
