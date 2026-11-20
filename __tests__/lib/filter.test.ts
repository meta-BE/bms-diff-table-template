import { describe, it, expect } from "vitest";
import { inspectFilter, resolveFilterSpec, normalizeFilterValue } from "@/lib/filter";
import type { ColumnDef } from "@/lib/config";

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
