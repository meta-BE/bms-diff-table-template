/**
 * 表に出す難易度の並びを決める。levelOrder にある難易度を先に並べ、残りはデータに出てきた順に続ける。
 * 絞り込みで0件になった難易度も見出しを残すため、並びは絞り込み前の全行から決める。
 */
export function resolveLevelOrder(levels: readonly string[], levelOrder: readonly string[]): string[] {
  const present = new Set(levels);
  const ordered = levelOrder.filter((level) => present.has(level));
  const seen = new Set(ordered);
  for (const level of levels) {
    if (!seen.has(level)) {
      seen.add(level);
      ordered.push(level);
    }
  }
  return ordered;
}

export function groupRowsByLevel<T extends { level: string }>(
  rows: readonly T[],
  order: readonly string[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>(order.map((level) => [level, []]));
  for (const row of rows) {
    let group = groups.get(row.level);
    if (!group) {
      group = [];
      groups.set(row.level, group);
    }
    group.push(row);
  }
  return groups;
}
