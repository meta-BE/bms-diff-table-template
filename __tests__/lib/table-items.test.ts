import { describe, it, expect } from "vitest";
import { buildTableItems, VIRTUALIZE_THRESHOLD } from "@/lib/table-items";
import type { ClientRow } from "@/lib/client-rows";

const row = (md5: string, level: string): ClientRow => ({ md5, level, texts: [], urls: [], filterValues: [] });

const a = row("a", "1");
const b = row("b", "1");
const c = row("c", "1");
const d = row("d", "2");
const groups = new Map<string, ClientRow[]>([
  ["1", [a, b, c]],
  ["2", [d]],
]);

const describeItems = (items: ReturnType<typeof buildTableItems>) =>
  items.map((item) => (item.kind === "header" ? `H${item.level}:${item.count}` : `${item.row.md5}#${item.stripeIndex}`));

describe("buildTableItems", () => {
  it("visible が null なら、見出しの直後にその難易度の全行が続く", () => {
    expect(describeItems(buildTableItems(groups, null))).toEqual(["H1:3", "a#0", "b#1", "c#2", "H2:1", "d#0"]);
  });

  it("表示中の行だけを並べ、件数とストライプの番号を難易度ごとに数え直す", () => {
    expect(describeItems(buildTableItems(groups, new Set([a, c, d])))).toEqual(["H1:2", "a#0", "c#1", "H2:1", "d#0"]);
  });

  it("0件の難易度は見出しだけを残す", () => {
    expect(describeItems(buildTableItems(groups, new Set([d])))).toEqual(["H1:0", "H2:1", "d#0"]);
  });

  it("仮想スクロールに切り替える行数は 200", () => {
    expect(VIRTUALIZE_THRESHOLD).toBe(200);
  });
});
