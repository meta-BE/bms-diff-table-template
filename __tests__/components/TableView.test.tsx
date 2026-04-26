// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { TableView } from "@/components/TableView";
import type { TableEntry } from "@/lib/fetch-table-data";
import type { ColumnDef, TableConfig } from "@/lib/config";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const entries: TableEntry[] = [
  { md5: "abc123", level: "1", title: "テスト曲", artist: "テストアーティスト" },
];

function makeConfig(overrides: Partial<TableConfig> = {}): TableConfig {
  return {
    name: "Test",
    symbol: "★",
    dataUrl: "http://test",
    siteDescription: "",
    lightTheme: "light",
    darkTheme: "dark",
    darkMode: "system",
    levelOrder: ["1"],
    course: [],
    columns: [],
    tableStyle: { maxWidth: 1536, stripe: false, hover: false },
    ...overrides,
  };
}

describe("TableView - ellipsis", () => {
  it("ellipsis: true のカラムで min-w-0 がセルに、overflow-hidden / text-ellipsis / whitespace-nowrap が内側に付与される", () => {
    const columns: ColumnDef[] = [
      { header: "タイトル", type: "text", property: "title", ellipsis: true },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        config={makeConfig({ columns })}
      />
    );

    const cell = container.querySelectorAll('[role="cell"]')[0];
    expect(cell.className).toContain("min-w-0");
    const ellipsisInner = cell.querySelector(".overflow-hidden.text-ellipsis.whitespace-nowrap");
    expect(ellipsisInner).not.toBeNull();
  });

  it("ellipsis: true のカラムでテキスト内容が正しく表示される", () => {
    const columns: ColumnDef[] = [
      { header: "タイトル", type: "text", property: "title", ellipsis: true },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        config={makeConfig({ columns })}
      />
    );

    const cell = container.querySelectorAll('[role="cell"]')[0];
    expect(cell.textContent).toBe("テスト曲");
  });

  it("ellipsis 未指定のカラムには min-w-0 が付与されない", () => {
    const columns: ColumnDef[] = [
      { header: "タイトル", type: "text", property: "title" },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        config={makeConfig({ columns })}
      />
    );

    const cell = container.querySelectorAll('[role="cell"]')[0];
    expect(cell.className).not.toContain("min-w-0");
  });
});

describe("TableView - nowrap", () => {
  it("nowrap: true のカラムセルに whitespace-nowrap クラスが付与される", () => {
    const columns: ColumnDef[] = [
      { header: "難易度", type: "level" },
      { header: "タイトル", type: "text", property: "title", nowrap: true },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        config={makeConfig({ columns })}
      />
    );

    const cells = container.querySelectorAll('[role="cell"]');
    expect(cells[0].className).not.toContain("whitespace-nowrap");
    expect(cells[1].className).toContain("whitespace-nowrap");
  });

  it("nowrap 未指定のカラムセルには whitespace-nowrap クラスが付与されない", () => {
    const columns: ColumnDef[] = [
      { header: "難易度", type: "level" },
      { header: "タイトル", type: "text", property: "title" },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        config={makeConfig({ columns })}
      />
    );

    const cells = container.querySelectorAll('[role="cell"]');
    expect(cells[0].className).not.toContain("whitespace-nowrap");
    expect(cells[1].className).not.toContain("whitespace-nowrap");
  });
});

describe("TableView - zebra stripe & hover", () => {
  const columns: ColumnDef[] = [
    { header: "難易度", type: "level" },
    { header: "タイトル", type: "text", property: "title" },
  ];

  const multiEntries: TableEntry[] = [
    { md5: "aaa", level: "1", title: "曲A" },
    { md5: "bbb", level: "1", title: "曲B" },
    { md5: "ccc", level: "1", title: "曲C" },
  ];

  it("曲行が subgrid 構造を持つ（grid grid-cols-subgrid col-span-full）", () => {
    const { container } = render(
      <TableView entries={multiEntries} config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: true, hover: true } })} />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    // songRows[0] = ヘッダー行, songRows[1] = レベル区分行, songRows[2..4] = 曲行
    const firstSongRow = songRows[2];
    expect(firstSongRow.className).toContain("grid");
    expect(firstSongRow.className).toContain("grid-cols-subgrid");
    expect(firstSongRow.className).toContain("col-span-full");
    expect(firstSongRow.className).not.toContain("contents");
  });

  it("奇数行（インデックス0,2）に bg-base-content/5 が付与される", () => {
    const { container } = render(
      <TableView entries={multiEntries} config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: true, hover: true } })} />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    // 曲行は songRows[2], songRows[3], songRows[4]
    expect(songRows[2].className).toContain("bg-base-content/5");
    expect(songRows[3].className).not.toContain("bg-base-content/5");
    expect(songRows[4].className).toContain("bg-base-content/5");
  });

  it("全曲行に hover:bg-base-content/10 が付与される", () => {
    const { container } = render(
      <TableView entries={multiEntries} config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: true, hover: true } })} />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    for (let i = 2; i <= 4; i++) {
      expect(songRows[i].className).toContain("hover:bg-base-content/10");
    }
  });

  it("全曲行に transition-colors が付与される", () => {
    const { container } = render(
      <TableView entries={multiEntries} config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: true, hover: true } })} />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    for (let i = 2; i <= 4; i++) {
      expect(songRows[i].className).toContain("transition-colors");
    }
  });
});

describe("TableView - tableStyle 条件分岐", () => {
  const columns: ColumnDef[] = [
    { header: "難易度", type: "level" },
    { header: "タイトル", type: "text", property: "title" },
  ];

  const multiEntries: TableEntry[] = [
    { md5: "aaa", level: "1", title: "曲A" },
    { md5: "bbb", level: "1", title: "曲B" },
    { md5: "ccc", level: "1", title: "曲C" },
  ];

  it("stripe: false の場合、bg-base-content/5 が付与されない", () => {
    const { container } = render(
      <TableView
        entries={multiEntries}
        config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: false, hover: false } })}
      />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    for (let i = 2; i <= 4; i++) {
      expect(songRows[i].className).not.toContain("bg-base-content/5");
    }
  });

  it("hover: false の場合、hover:bg-base-content/10 が付与されない", () => {
    const { container } = render(
      <TableView
        entries={multiEntries}
        config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: false, hover: false } })}
      />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    for (let i = 2; i <= 4; i++) {
      expect(songRows[i].className).not.toContain("hover:bg-base-content/10");
      expect(songRows[i].className).not.toContain("transition-colors");
    }
  });

  it("stripe: true の場合、偶数インデックス行に bg-base-content/5 が付与される", () => {
    const { container } = render(
      <TableView
        entries={multiEntries}
        config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: true, hover: false } })}
      />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    expect(songRows[2].className).toContain("bg-base-content/5");
    expect(songRows[3].className).not.toContain("bg-base-content/5");
    expect(songRows[4].className).toContain("bg-base-content/5");
  });

  it("hover: true の場合、全曲行に hover:bg-base-content/10 が付与される", () => {
    const { container } = render(
      <TableView
        entries={multiEntries}
        config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: false, hover: true } })}
      />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    for (let i = 2; i <= 4; i++) {
      expect(songRows[i].className).toContain("hover:bg-base-content/10");
      expect(songRows[i].className).toContain("transition-colors");
    }
  });
});
