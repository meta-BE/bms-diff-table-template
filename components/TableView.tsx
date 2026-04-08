import { Fragment } from "react";
import type { TableEntry } from "@/lib/fetch-table-data";

interface TableViewProps {
  entries: TableEntry[];
  symbol: string;
  levelOrder: string[];
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

  // levelOrder順に並び替え
  const ordered = new Map<string, TableEntry[]>();
  for (const level of levelOrder) {
    if (groups.has(level)) {
      ordered.set(level, groups.get(level)!);
    }
  }
  // levelOrderに含まれないレベルを末尾に追加
  for (const [level, entries] of groups) {
    if (!ordered.has(level)) {
      ordered.set(level, entries);
    }
  }
  return ordered;
}

const LR2IR_BASE =
  "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5=";

export function TableView({ entries, symbol, levelOrder }: TableViewProps) {
  const grouped = groupByLevel(entries, levelOrder);

  return (
    <table className="table table-zebra w-full">
      <thead>
        <tr>
          <th className="w-[10%]">Level</th>
          <th className="w-[50%]">Title</th>
          <th className="w-[40%]">Artist</th>
        </tr>
      </thead>
      <tbody>
        {Array.from(grouped).map(([level, levelEntries]) => (
          <Fragment key={`level-${level}`}>
            <tr className="bg-base-300 text-center">
              <td colSpan={3} className="font-bold">
                {symbol}
                {level} ({levelEntries.length}譜面)
              </td>
            </tr>
            {levelEntries.map((entry) => (
              <tr key={entry.md5}>
                <td>
                  {symbol}
                  {level}
                </td>
                <td>
                  <a
                    href={`${LR2IR_BASE}${entry.md5}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-hover"
                  >
                    {entry.title || "(no title)"}
                  </a>
                </td>
                <td>{entry.artist || ""}</td>
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
