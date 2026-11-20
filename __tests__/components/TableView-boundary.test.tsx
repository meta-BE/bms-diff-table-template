// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { TableConfig } from "@/lib/config";

// FilterableTable はクライアントコンポーネントで、props がそのまま RSC ペイロードに載る。
// サーバー側の TableView が何を渡しているかを確かめるため、props を捕まえる。
const captured = vi.hoisted(() => ({ props: [] as Array<Record<string, unknown>> }));
vi.mock("@/components/FilterableTable", () => ({
  FilterableTable: (props: Record<string, unknown>) => {
    captured.props.push(props);
    return null;
  },
}));

import { TableView } from "@/components/TableView";

const config: TableConfig = {
  name: "Test",
  symbol: "★",
  dataUrl: "https://secret.example/exec",
  siteDescription: "",
  lightTheme: "light",
  darkTheme: "dark",
  darkMode: "system",
  levelOrder: ["1"],
  course: [],
  columns: [{ header: "T", type: "text", property: "title" }],
  tableStyle: { maxWidth: 1536, stripe: false, hover: false },
};

describe("TableView - クライアントとの境界", () => {
  beforeEach(() => {
    captured.props.length = 0;
  });

  it("FilterableTable には設定の4項目だけを渡す", () => {
    render(<TableView entries={[{ md5: "abc", level: "1", title: "曲" }]} config={config} />);
    const passed = captured.props[0].config as Record<string, unknown>;
    expect(Object.keys(passed).sort()).toEqual(["columns", "levelOrder", "symbol", "tableStyle"]);
  });

  it("dataUrl が RSC に渡る props に含まれない", () => {
    render(<TableView entries={[{ md5: "abc", level: "1", title: "曲" }]} config={config} />);
    expect(JSON.stringify(captured.props[0])).not.toContain("secret.example");
  });

  it("rows は toClientRows の結果になっている", () => {
    render(<TableView entries={[{ md5: "abc", level: "1", title: "曲" }]} config={config} />);
    const rows = captured.props[0].rows as Array<{ md5: string; texts: unknown[] }>;
    expect(rows[0].md5).toBe("abc");
    expect(rows[0].texts).toEqual(["曲"]);
  });
});
