import { describe, it, expect } from "vitest";
import { buildTableItems, pickSizerRows, VIRTUALIZE_THRESHOLD } from "@/lib/table-items";
import type { ColumnDef } from "@/lib/config";
import type { ClientRow } from "@/lib/client-rows";

const row = (md5: string, level: string, texts: (string | null)[] = []): ClientRow => ({
  md5,
  level,
  texts,
  urls: [],
  filterValues: [],
});

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

describe("pickSizerRows", () => {
  const columns: ColumnDef[] = [
    { header: "Lv", type: "level" },
    { header: "Title", type: "text", property: "title" },
    { header: "Date", type: "text", property: "date", nowrap: true },
    { header: "DL", type: "badge", label: "DL", url: "{{u}}" },
  ];

  it("最も長い表示文字列の行と、最も長い単語を含む行を、入力の順番で選ぶ", () => {
    const titleOnly: ColumnDef[] = [{ header: "Title", type: "text", property: "title" }];
    const longText = row("long", "1", ["あいうえおかきくけこさしすせそたちつてとなにぬねの"]);
    const longWord = row("word", "1", ["Supercalifragilistic x"]);
    const plain = row("plain", "1", ["abc"]);
    expect(pickSizerRows([plain, longText, longWord], titleOnly).map((r) => r.md5)).toEqual(["long", "word"]);
  });

  it("level カラムでは、最も長い難易度の行を選ぶ", () => {
    const short = row("s", "1", [null, "a", "d", null]);
    const long = row("l", "14", [null, "a", "d", null]);
    expect(pickSizerRows([short, long], columns).map((r) => r.md5)).toContain("l");
  });

  it("日本語は文字ごとに折り返せるので、長い単語として扱わない", () => {
    const titleOnly: ColumnDef[] = [{ header: "Title", type: "text", property: "title" }];
    const japanese = row("ja", "1", ["あいうえおかきくけこさしすせそたちつてと"]);
    const english = row("en", "1", ["Supercalifragilistic"]);
    expect(pickSizerRows([japanese, english], titleOnly).map((r) => r.md5)).toEqual(["ja", "en"]);
  });

  it("同じ行は1回だけ選ぶ", () => {
    const only = row("only", "14", [null, "Supercalifragilistic あいうえお", "2024-01-01", null]);
    const other = row("other", "1", [null, "a", "d", null]);
    expect(pickSizerRows([other, only], columns).map((r) => r.md5)).toEqual(["only"]);
  });

  it("行がなければ空の配列を返す", () => {
    expect(pickSizerRows([], columns)).toEqual([]);
  });
});
