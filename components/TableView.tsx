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

function toDisplayString(value: unknown): string {
  return value !== undefined && value !== null ? String(value) : "";
}

function getAlignClass(column: ColumnDef): string {
  if (!column.align || column.align === "left") return "";
  if (column.align === "center") return "text-center";
  if (column.align === "right") return "text-right";
  return "";
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

          {levelEntries.map((entry) => (
            <div key={entry.md5} className="contents" role="row">
              {columns.map((col, i) => (
                <div key={`${col.header}-${i}`} className={`p-2 border-b border-base-200 ${getAlignClass(col)}`.trim()} role="cell">
                  <CellContent column={col} entry={entry} symbol={symbol} level={level} />
                </div>
              ))}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
