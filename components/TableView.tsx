import { Fragment } from "react";
import type { TableEntry } from "@/lib/fetch-table-data";
import type { ColumnDef, Align } from "@/lib/config";
import { resolveTemplate } from "@/lib/resolve-template";
import { EllipsisCell } from "@/components/EllipsisCell";

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

function toDisplayString(value: unknown): string {
  return value !== undefined && value !== null ? String(value) : "";
}

function getCellText(column: ColumnDef, entry: TableEntry, symbol: string, level: string): string {
  switch (column.type) {
    case "level":
      return `${symbol}${level}`;
    case "text":
      return toDisplayString(entry[column.property]);
    case "link":
      return column.property in entry ? toDisplayString(entry[column.property]) : "";
    case "badge":
      return column.label;
  }
}

const ALIGN_CLASS: Record<Align, string> = {
  left: "",
  center: "text-center",
  right: "text-right",
};

function getAlignClass(column: ColumnDef): string {
  return column.align ? ALIGN_CLASS[column.align] : "";
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link link-hover">
      {children}
    </a>
  );
}

function CellContent({ column, entry, symbol, level }: { column: ColumnDef; entry: TableEntry; symbol: string; level: string }) {
  switch (column.type) {
    case "level":
      return <>{symbol}{level}</>;
    case "text":
      return <>{toDisplayString(entry[column.property])}</>;
    case "link": {
      if (!(column.property in entry)) return null;
      const displayText = toDisplayString(entry[column.property]);
      const url = resolveTemplate(column.url, entry);
      if (url) return <ExternalLink href={url}>{displayText}</ExternalLink>;
      return <>{displayText}</>;
    }
    case "badge": {
      const url = resolveTemplate(column.url, entry);
      if (!url) return null;
      return <ExternalLink href={url}>{column.label}</ExternalLink>;
    }
  }
}

export function TableView({ entries, symbol, levelOrder, columns }: TableViewProps) {
  const grouped = groupByLevel(entries, levelOrder);
  const cellClassNames = columns.map((col) => {
    const parts = ["p-2", "border-b", "border-base-200"];
    const align = getAlignClass(col);
    if (align) parts.push(align);
    if (col.nowrap) parts.push("whitespace-nowrap");
    if (col.ellipsis) parts.push("min-w-0");
    return parts.join(" ");
  });

  return (
    <div className="table-grid w-full" role="table">
      <div className="contents" role="row">
        {columns.map((col, i) => (
          <div key={`${col.header}-${i}`} className="font-bold bg-base-200 p-2" role="columnheader">
            {col.header}
          </div>
        ))}
      </div>

      {Array.from(grouped).map(([level, levelEntries]) => (
        <Fragment key={`level-${level}`}>
          <div className="table-grid-header-row bg-base-300 text-center font-bold p-2" role="row">
            {symbol}{level} ({levelEntries.length}譜面)
          </div>

          {levelEntries.map((entry, entryIndex) => (
            <div
              key={entry.md5}
              className={`grid grid-cols-subgrid col-span-full hover:bg-base-content/10 transition-colors${entryIndex % 2 === 0 ? " bg-base-content/5" : ""}`}
              role="row"
            >
              {columns.map((col, i) => (
                <div key={`${col.header}-${i}`} className={cellClassNames[i]} role="cell">
                  {col.ellipsis ? (
                    <EllipsisCell text={getCellText(col, entry, symbol, level)}>
                      <CellContent column={col} entry={entry} symbol={symbol} level={level} />
                    </EllipsisCell>
                  ) : (
                    <CellContent column={col} entry={entry} symbol={symbol} level={level} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
