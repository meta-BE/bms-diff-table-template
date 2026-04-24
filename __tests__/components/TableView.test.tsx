// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { TableView } from "@/components/TableView";
import type { TableEntry } from "@/lib/fetch-table-data";
import type { ColumnDef } from "@/lib/config";

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

describe("TableView - ellipsis", () => {
  it("ellipsis: true のカラムで min-w-0 がセルに、overflow-hidden / text-ellipsis / whitespace-nowrap が内側に付与される", () => {
    const columns: ColumnDef[] = [
      { header: "タイトル", type: "text", property: "title", ellipsis: true },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        symbol="★"
        levelOrder={["1"]}
        columns={columns}
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
        symbol="★"
        levelOrder={["1"]}
        columns={columns}
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
        symbol="★"
        levelOrder={["1"]}
        columns={columns}
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
        symbol="★"
        levelOrder={["1"]}
        columns={columns}
      />
    );

    const cells = container.querySelectorAll('[role="cell"]');
    // cells[0] = 難易度セル (nowrap なし), cells[1] = タイトルセル (nowrap あり)
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
        symbol="★"
        levelOrder={["1"]}
        columns={columns}
      />
    );

    const cells = container.querySelectorAll('[role="cell"]');
    expect(cells[0].className).not.toContain("whitespace-nowrap");
    expect(cells[1].className).not.toContain("whitespace-nowrap");
  });
});
