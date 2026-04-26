import { describe, it, expect } from "vitest";

import { buildMinWidth, buildCss } from "../../scripts/generate-css.mjs";

describe("buildMinWidth", () => {
  it("width指定なしカラムは80pxとして計算する", () => {
    const columns = [
      { header: "Lv", type: "level" },
      { header: "Title", type: "text", property: "title" },
    ];
    // 80 + 80 = 160 → フロア600に引き上げ
    expect(buildMinWidth(columns)).toBe(600);
  });

  it("width指定ありカラムはパーセント値を8px/1%として計算する", () => {
    const columns = [
      { header: "Lv", type: "level" },
      { header: "Title", type: "text", property: "t", width: "30%" },
      { header: "Artist", type: "text", property: "a", width: "25%" },
      { header: "Comment", type: "text", property: "c", width: "30%" },
    ];
    // 80 + 240 + 200 + 240 = 760
    expect(buildMinWidth(columns)).toBe(760);
  });

  it("合計が600px未満の場合は600pxにフロアされる", () => {
    const columns = [
      { header: "A", type: "text", property: "a" },
      { header: "B", type: "text", property: "b" },
    ];
    // 80 + 80 = 160 → 600
    expect(buildMinWidth(columns)).toBe(600);
  });

  it("px指定のwidthはそのまま数値として使用する", () => {
    const columns = [
      { header: "A", type: "text", property: "a", width: "120px" },
      { header: "B", type: "text", property: "b", width: "150px" },
      { header: "C", type: "text", property: "c", width: "200px" },
      { header: "D", type: "text", property: "d", width: "200px" },
    ];
    // 120 + 150 + 200 + 200 = 670
    expect(buildMinWidth(columns)).toBe(670);
  });

  it("カラムが空の場合は600pxを返す", () => {
    expect(buildMinWidth([])).toBe(600);
  });
});

describe("buildCss - table-container", () => {
  it("tableStyle.maxWidth に応じた .table-container が生成される", () => {
    const config = {
      lightTheme: "light",
      darkTheme: "dark",
      columns: [],
      tableStyle: { maxWidth: 1200 },
    };
    const css = buildCss(config);
    expect(css).toContain(".table-container");
    expect(css).toContain("max-width: 1200px");
    expect(css).toContain("margin-left: auto");
    expect(css).toContain("margin-right: auto");
  });

  it("tableStyle 未指定時はデフォルト値 1536px が使用される", () => {
    const config = {
      lightTheme: "light",
      darkTheme: "dark",
      columns: [],
    };
    const css = buildCss(config);
    expect(css).toContain("max-width: 1536px");
  });

  it("tableStyle.maxWidth のみ指定時はその値が使用される", () => {
    const config = {
      lightTheme: "light",
      darkTheme: "dark",
      columns: [],
      tableStyle: { maxWidth: 1600 },
    };
    const css = buildCss(config);
    expect(css).toContain("max-width: 1600px");
  });
});
