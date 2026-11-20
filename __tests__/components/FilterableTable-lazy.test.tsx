// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import type { TableEntry } from "@/lib/fetch-table-data";
import type { TableConfig } from "@/lib/config";

// 仮想スクロール用のモジュール（@tanstack/react-virtual を含む）が読み込まれたかを記録する
const loaded = vi.hoisted(() => ({ value: false }));
vi.mock("@/components/VirtualTableBody", async (importOriginal) => {
  loaded.value = true;
  return importOriginal();
});

import { TableView } from "@/components/TableView";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 40 });
});

const config = (): TableConfig => ({
  name: "T",
  symbol: "★",
  dataUrl: "http://test",
  siteDescription: "",
  lightTheme: "light",
  darkTheme: "dark",
  darkMode: "system",
  levelOrder: [],
  course: [],
  columns: [{ header: "Title", type: "text", property: "title" }],
  tableStyle: { maxWidth: 1536, stripe: false, hover: false },
});
const entries = (n: number): TableEntry[] =>
  Array.from({ length: n }, (_, i) => ({ md5: `m${i}`, level: "1", title: `T${i}` }));

// モジュールの読み込み状態はテスト間で共有されるため、小さい表 → 大きい表の順に確認する
describe("仮想スクロールの遅延読み込み", () => {
  it("200行以下の表では、仮想スクロール用のモジュールを読み込まない", async () => {
    render(<TableView entries={entries(200)} config={config()} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(loaded.value).toBe(false);
    cleanup();
  });

  it("200行を超える表では、仮想スクロール用のモジュールを読み込んで描画する", async () => {
    const { container } = render(<TableView entries={entries(300)} config={config()} />);
    await waitFor(() => expect(container.querySelectorAll('[role="row"].grid-cols-subgrid').length).toBeGreaterThan(0));
    expect(loaded.value).toBe(true);
    cleanup();
  });
});
