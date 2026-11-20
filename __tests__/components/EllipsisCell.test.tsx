// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { EllipsisCell } from "@/components/EllipsisCell";

// jsdom には ResizeObserver もレイアウトもないため、通知とサイズの読み取りを手動で再現する
type Callback = (entries: { target: Element }[]) => void;
// EllipsisCell は ResizeObserver をモジュール内で1つだけ作って使い回すため、記録はテスト間でリセットしない
// （アンマウントで unobserve されるので、前のテストのセルが通知に混ざることはない）
const observers: { callback: Callback; targets: Set<Element> }[] = [];
const log: string[] = [];

class FakeResizeObserver {
  private record: { callback: Callback; targets: Set<Element> };
  constructor(callback: Callback) {
    this.record = { callback, targets: new Set() };
    observers.push(this.record);
  }
  observe(target: Element) {
    this.record.targets.add(target);
  }
  unobserve(target: Element) {
    this.record.targets.delete(target);
  }
  disconnect() {
    this.record.targets.clear();
  }
}

// ブラウザがレイアウト後に、監視中の全要素の通知を配る動きを再現する
function deliverAll() {
  for (const { callback, targets } of observers) {
    if (targets.size > 0) callback(Array.from(targets, (target) => ({ target })));
  }
}

// マウント時の読み取りも記録できるよう、描画前にプロトタイプへ getter を仕込む
const sizes = new WeakMap<Element, { scrollWidth: number; clientWidth: number }>();
function setSize(el: Element, scrollWidth: number, clientWidth: number) {
  sizes.set(el, { scrollWidth, clientWidth });
}
const originalScrollWidth = Object.getOwnPropertyDescriptor(Element.prototype, "scrollWidth");
const originalClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");

function renderCells(texts: string[]) {
  const { container } = render(
    <div>
      {texts.map((t) => (
        <EllipsisCell key={t} text={t}>
          {t}
        </EllipsisCell>
      ))}
    </div>
  );
  const outers = Array.from(container.firstElementChild!.children) as HTMLElement[];
  const inners = outers.map((o) => o.firstElementChild as HTMLElement);
  return { outers, inners };
}

beforeAll(() => {
  global.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  log.length = 0;
  Object.defineProperty(Element.prototype, "scrollWidth", {
    configurable: true,
    get(this: Element) {
      log.push("read");
      return sizes.get(this)?.scrollWidth ?? 0;
    },
  });
  Object.defineProperty(Element.prototype, "clientWidth", {
    configurable: true,
    get(this: Element) {
      return sizes.get(this)?.clientWidth ?? 0;
    },
  });
});

afterEach(() => {
  cleanup();
  if (originalScrollWidth) Object.defineProperty(Element.prototype, "scrollWidth", originalScrollWidth);
  if (originalClientWidth) Object.defineProperty(Element.prototype, "clientWidth", originalClientWidth);
});

describe("EllipsisCell", () => {
  it("マウントしただけではサイズを読まない（強制レイアウトを起こさない）", () => {
    renderCells(["a", "b"]);
    expect(log).toEqual([]);
  });

  it("はみ出しているセルにだけツールチップを付ける", () => {
    const { outers, inners } = renderCells(["長いコメント", "短い"]);
    setSize(inners[0], 200, 100);
    setSize(inners[1], 50, 100);
    deliverAll();
    expect(outers[0].classList.contains("tooltip")).toBe(true);
    expect(outers[0].getAttribute("data-tip")).toBe("長いコメント");
    expect(outers[1].classList.contains("tooltip")).toBe(false);
    expect(outers[1].hasAttribute("data-tip")).toBe(false);
  });

  it("全セルのサイズを読んでから書き込む（読み書きを交互にしない）", () => {
    const { outers, inners } = renderCells(["a", "b", "c"]);
    inners.forEach((inner) => setSize(inner, 200, 100));
    outers.forEach((outer) => {
      const original = outer.setAttribute.bind(outer);
      outer.setAttribute = (name: string, value: string) => {
        log.push("write");
        original(name, value);
      };
    });
    deliverAll();
    expect(log).toEqual(["read", "read", "read", "write", "write", "write"]);
  });

  it("はみ出さなくなったらツールチップを外す", () => {
    const { outers, inners } = renderCells(["a"]);
    setSize(inners[0], 200, 100);
    deliverAll();
    setSize(inners[0], 100, 100);
    deliverAll();
    expect(outers[0].classList.contains("tooltip")).toBe(false);
    expect(outers[0].hasAttribute("data-tip")).toBe(false);
  });

  it("アンマウントしたセルは監視をやめる", () => {
    const { inners } = renderCells(["a"]);
    cleanup();
    expect(observers.every(({ targets }) => !targets.has(inners[0]))).toBe(true);
  });
});
