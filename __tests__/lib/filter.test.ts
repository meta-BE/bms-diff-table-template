import { describe, it, expect } from "vitest";
import {
  inspectFilter,
  resolveFilterSpec,
  normalizeFilterValue,
  buildFilterOptions,
  applyFilter,
  EMPTY_LABEL,
  type FilterSpec,
} from "@/lib/filter";
import type { ColumnDef } from "@/lib/config";
import type { ClientRow } from "@/lib/client-rows";

// JSON から読み込まれる不正な設定を再現するためのキャスト
const asColumn = (c: unknown) => c as ColumnDef;

describe("inspectFilter", () => {
  it("filter 未指定なら spec は null、problems は空", () => {
    expect(inspectFilter({ header: "R", type: "text", property: "rating" })).toEqual({ spec: null, problems: [] });
  });

  it("text に true を指定すると property をキーにして昇順", () => {
    expect(inspectFilter({ header: "R", type: "text", property: "rating", filter: true })).toEqual({
      spec: { key: "rating", order: "asc", levelMode: false },
      problems: [],
    });
  });

  it("link で order: desc を指定すると降順", () => {
    expect(
      inspectFilter({ header: "T", type: "link", property: "title", url: "{{url}}", filter: { order: "desc" } }).spec
    ).toEqual({ key: "title", order: "desc", levelMode: false });
  });

  it("level に true を指定すると Lv 特例になる", () => {
    expect(inspectFilter({ header: "Lv", type: "level", filter: true }).spec).toEqual({
      key: "level",
      order: "asc",
      levelMode: true,
    });
  });

  it("level で property を指定すると Lv 特例にならない", () => {
    expect(inspectFilter({ header: "Lv", type: "level", filter: { property: "x" } }).spec).toEqual({
      key: "x",
      order: "asc",
      levelMode: false,
    });
  });

  it("別のキーを指定できる", () => {
    expect(
      inspectFilter({ header: "P", type: "text", property: "published_at", filter: { property: "published_year" } }).spec
    ).toEqual({ key: "published_year", order: "asc", levelMode: false });
  });

  it("badge に filter を指定すると無効", () => {
    expect(inspectFilter(asColumn({ header: "DL", type: "badge", label: "DL", url: "{{u}}", filter: true }))).toEqual({
      spec: null,
      problems: ["badge"],
    });
  });

  it.each([
    ["文字列", "published_year"],
    ["null", null],
    ["false", false],
    ["空文字の property", { property: "" }],
    ["数値の property", { property: 1 }],
    ["配列", ["published_year"]],
  ])("不正な形の指定は無効（%s）", (_label, filter) => {
    expect(inspectFilter(asColumn({ header: "P", type: "text", property: "p", filter }))).toEqual({
      spec: null,
      problems: ["invalid"],
    });
  });

  it("不正な order は asc として扱い、警告する", () => {
    expect(inspectFilter(asColumn({ header: "P", type: "text", property: "p", filter: { order: "up" } }))).toEqual({
      spec: { key: "p", order: "asc", levelMode: false },
      problems: ["order"],
    });
  });

  it("resolveFilterSpec は inspectFilter の spec と同じ", () => {
    const columns: ColumnDef[] = [
      { header: "R", type: "text", property: "rating", filter: true },
      { header: "Lv", type: "level", filter: { order: "desc" } },
      { header: "T", type: "text", property: "title" },
      asColumn({ header: "DL", type: "badge", label: "DL", url: "{{u}}", filter: true }),
    ];
    for (const column of columns) {
      expect(resolveFilterSpec(column)).toEqual(inspectFilter(column).spec);
    }
  });

  it("badge の filter は型エラーになる", () => {
    const column: ColumnDef = {
      header: "DL",
      type: "badge",
      label: "DL",
      url: "{{u}}",
      // @ts-expect-error badge カラムには filter を指定できない
      filter: true,
    };
    expect(inspectFilter(column).problems).toEqual(["badge"]);
  });
});

describe("normalizeFilterValue", () => {
  it("空の値は空文字にする", () => {
    expect(normalizeFilterValue(undefined)).toBe("");
    expect(normalizeFilterValue(null)).toBe("");
    expect(normalizeFilterValue("")).toBe("");
  });

  it("数値や真偽値は文字列にし、0 や false を空として扱わない", () => {
    expect(normalizeFilterValue(2024)).toBe("2024");
    expect(normalizeFilterValue(0)).toBe("0");
    expect(normalizeFilterValue(false)).toBe("false");
    expect(normalizeFilterValue("★★★☆☆")).toBe("★★★☆☆");
  });
});

// 1カラム（index 0）だけを持つ行を作る
function rowsWith(values: string[], levels?: string[]): ClientRow[] {
  return values.map((v, i) => ({
    md5: `m${i}`,
    level: levels?.[i] ?? "1",
    texts: [null],
    urls: [null],
    filterValues: [v],
  }));
}

const asc: FilterSpec = { key: "k", order: "asc", levelMode: false };
const desc: FilterSpec = { key: "k", order: "desc", levelMode: false };
const ctx = { levelOrder: [] as string[], symbol: "Σ" };

describe("buildFilterOptions", () => {
  it("数値を考慮して昇順に並べる", () => {
    expect(buildFilterOptions(rowsWith(["10", "2", "1"]), 0, asc, ctx).map((o) => o.value)).toEqual(["1", "2", "10"]);
  });

  it("desc では逆順にする", () => {
    expect(buildFilterOptions(rowsWith(["10", "2", "1"]), 0, desc, ctx).map((o) => o.value)).toEqual(["10", "2", "1"]);
  });

  it("★ の表記は asc で ★★★★★ が先頭になる", () => {
    const values = ["★★★☆☆", "★☆☆☆☆", "★★★★★", "★★☆☆☆", "★★★★☆"];
    expect(buildFilterOptions(rowsWith(values), 0, asc, ctx).map((o) => o.value)).toEqual([
      "★★★★★",
      "★★★★☆",
      "★★★☆☆",
      "★★☆☆☆",
      "★☆☆☆☆",
    ]);
  });

  it("空の値は（空）として最後に置き、desc でも最後のまま", () => {
    for (const spec of [asc, desc]) {
      const options = buildFilterOptions(rowsWith(["", "2024", "2025"]), 0, spec, ctx);
      expect(options.at(-1)).toEqual({ value: "", label: EMPTY_LABEL, count: 1 });
    }
    expect(EMPTY_LABEL).toBe("（空）");
  });

  it("空の値がなければ（空）を出さない", () => {
    const options = buildFilterOptions(rowsWith(["2024"]), 0, asc, ctx);
    expect(options.some((o) => o.value === "")).toBe(false);
  });

  it("count は全行を対象に数え、ラベルは値そのもの", () => {
    expect(buildFilterOptions(rowsWith(["2025", "2024", "2025"]), 0, asc, ctx)).toEqual([
      { value: "2024", label: "2024", count: 1 },
      { value: "2025", label: "2025", count: 2 },
    ]);
  });

  it("levelMode では ctx.levelOrder の順に並べ、ラベルを symbol+level にする", () => {
    const spec: FilterSpec = { key: "level", order: "asc", levelMode: true };
    const options = buildFilterOptions(rowsWith(["1", "2", "1"]), 0, spec, { levelOrder: ["2", "1"], symbol: "Σ" });
    expect(options.map((o) => o.value)).toEqual(["2", "1"]);
    expect(options.map((o) => o.label)).toEqual(["Σ2", "Σ1"]);
  });

  it("levelMode で desc なら逆順にする", () => {
    const spec: FilterSpec = { key: "level", order: "desc", levelMode: true };
    const options = buildFilterOptions(rowsWith(["1", "2"]), 0, spec, { levelOrder: ["2", "1"], symbol: "Σ" });
    expect(options.map((o) => o.value)).toEqual(["1", "2"]);
  });
});

describe("applyFilter", () => {
  const rows = rowsWith(["2024", "2025", "2026", "", "2024"]);

  it("filter が null なら同じ配列を返す", () => {
    expect(applyFilter(rows, null)).toBe(rows);
  });

  it("OR 条件で、一致する行だけを元の順番のまま返す", () => {
    const result = applyFilter(rows, { columnIndex: 0, values: new Set(["2026", "2024"]) });
    expect(result.map((r) => r.md5)).toEqual(["m0", "m2", "m4"]);
  });

  it("（空）を選ぶと、値が空の行を返す", () => {
    const result = applyFilter(rows, { columnIndex: 0, values: new Set([""]) });
    expect(result.map((r) => r.md5)).toEqual(["m3"]);
  });

  it("filterValues が null の行は一致しない", () => {
    const withNull: ClientRow[] = [{ md5: "n", level: "1", texts: [null], urls: [null], filterValues: [null] }];
    expect(applyFilter(withNull, { columnIndex: 0, values: new Set([""]) })).toEqual([]);
  });
});
