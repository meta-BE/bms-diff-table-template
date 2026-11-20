// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { waitFor } from "@testing-library/react";
import { VirtualTableBody } from "@/components/VirtualTableBody";
import { buildTableItems } from "@/lib/table-items";
import type { ClientRow } from "@/lib/client-rows";
import type { ColumnDef } from "@/lib/config";

const columns: ColumnDef[] = [{ header: "Title", type: "text", property: "title" }];
const rows: ClientRow[] = Array.from({ length: 2000 }, (_, i) => ({
  md5: `m${i}`,
  level: "1",
  texts: [`T${i}`],
  urls: [null],
  filterValues: [null],
}));
const items = buildTableItems(new Map([["1", rows]]), null);

const body = (
  <div className="table-grid">
    <VirtualTableBody
      items={items}
      allRows={rows}
      columns={columns}
      symbol="★"
      cellClassNames={["p-2"]}
      rowClassName={() => "grid grid-cols-subgrid col-span-full"}
    />
  </div>
);

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalScrollHeight = Object.getOwnPropertyDescriptor(Element.prototype, "scrollHeight");
const originalRect = Element.prototype.getBoundingClientRect;
let root: Root | null = null;

beforeAll(() => {
  // hydrateRoot を直接使うため、Testing Library の render と同じく act() 用の環境フラグを立てる
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  // jsdom にはレイアウトがないので、行の高さを 40px とみなす
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 40 });
  // ページの高さも 0 になり、0 以外のスクロール位置が「行き過ぎ」として無視されるため、実際のページに近い高さにする
  Object.defineProperty(Element.prototype, "scrollHeight", { configurable: true, get: () => 2001 * 40 + 1000 });
  // 表がページ先頭にある場合、ブラウザでは top が「-スクロール量」になる（jsdom は常に 0 を返す）
  Element.prototype.getBoundingClientRect = function () {
    const top = -window.scrollY;
    return { x: 0, y: top, top, left: 0, right: 1000, bottom: top + 40, width: 1000, height: 40, toJSON() {} } as DOMRect;
  };
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  Object.defineProperty(window, "pageYOffset", { configurable: true, value: 0 });
});

afterAll(() => {
  if (originalOffsetHeight) Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
  if (originalScrollHeight) Object.defineProperty(Element.prototype, "scrollHeight", originalScrollHeight);
  Element.prototype.getBoundingClientRect = originalRect;
});

describe("VirtualTableBody - ハイドレーション", () => {
  it("途中までスクロールした状態でハイドレーションしても、サーバーの HTML と食い違わない", async () => {
    // サーバーはスクロール位置 0 で描画する
    const html = renderToString(body);
    // ブラウザが再読み込み時にスクロール位置を復元した状態を再現する（ブラウザでは scrollY と pageYOffset は同じ値）
    Object.defineProperty(window, "scrollY", { configurable: true, value: 30000 });
    Object.defineProperty(window, "pageYOffset", { configurable: true, value: 30000 });
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const errors: unknown[] = [];
    const scrollCalls: unknown[] = [];
    window.scrollTo = ((...args: unknown[]) => scrollCalls.push(args)) as typeof window.scrollTo;
    await act(async () => {
      root = hydrateRoot(container, body, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);

    // ハイドレーションの後は、実際のスクロール位置の行が描画される
    await waitFor(() => {
      const indexes = Array.from(container.querySelectorAll("[data-index]")).map((el) => Number(el.getAttribute("data-index")));
      expect(Math.max(...indexes)).toBeGreaterThan(700);
    });
    // 復元されたスクロール位置を、先頭へ書き戻さない
    expect(scrollCalls.some((args) => JSON.stringify(args).includes('"top":0'))).toBe(false);
  });
});
