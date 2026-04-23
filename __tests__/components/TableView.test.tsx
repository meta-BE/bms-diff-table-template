// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TableView } from "@/components/TableView";
import type { TableEntry } from "@/lib/fetch-table-data";
import type { ColumnDef } from "@/lib/config";

const entries: TableEntry[] = [
  { md5: "abc123", level: "1", title: "テスト曲", artist: "テストアーティスト" },
];

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
