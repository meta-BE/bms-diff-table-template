import { describe, it, expect } from "vitest";
import { computePanelPosition } from "@/lib/panel-position";

const viewport = { width: 1000, height: 800 };

describe("computePanelPosition", () => {
  it("下に収まるなら below に開き、top は anchor.bottom、left は anchor.left", () => {
    expect(computePanelPosition({ top: 100, bottom: 120, left: 50 }, { width: 200, height: 150 }, viewport)).toEqual({
      top: 120,
      left: 50,
      maxHeight: 800 - 120 - 8,
      maxWidth: 1000 - 16,
      placement: "below",
    });
  });

  it("下に収まらず、上のほうが広ければ above に開き、top は anchor.top - height", () => {
    const pos = computePanelPosition(
      { top: 600, bottom: 620, left: 50 },
      { width: 200, height: 300 },
      { width: 1000, height: 700 }
    );
    expect(pos).toEqual({ top: 300, left: 50, maxHeight: 600 - 8, maxWidth: 1000 - 16, placement: "above" });
  });

  it("上下どちらにも収まらなければ、空きが広いほうに開き、maxHeight をその空きにする", () => {
    const pos = computePanelPosition(
      { top: 100, bottom: 120, left: 50 },
      { width: 200, height: 500 },
      { width: 1000, height: 300 }
    );
    expect(pos).toEqual({ top: 120, left: 50, maxHeight: 300 - 120 - 8, maxWidth: 1000 - 16, placement: "below" });
  });

  it("上に開いてパネルが空きより高い場合、top は余白より上に出ない", () => {
    const pos = computePanelPosition(
      { top: 200, bottom: 280, left: 50 },
      { width: 200, height: 500 },
      { width: 1000, height: 300 }
    );
    expect(pos.placement).toBe("above");
    expect(pos.top).toBe(8);
    expect(pos.maxHeight).toBe(200 - 8);
  });

  it("右端では viewport.width - 8 - width に寄せる", () => {
    expect(computePanelPosition({ top: 0, bottom: 20, left: 900 }, { width: 200, height: 100 }, viewport).left).toBe(
      1000 - 8 - 200
    );
  });

  it("左端では left が 8 より小さくならない", () => {
    expect(computePanelPosition({ top: 0, bottom: 20, left: 2 }, { width: 200, height: 100 }, viewport).left).toBe(8);
  });

  it("パネルの最大幅は、画面の幅から左右の余白を引いた値になる", () => {
    expect(computePanelPosition({ top: 0, bottom: 20, left: 300 }, { width: 1200, height: 100 }, { width: 375, height: 800 }).maxWidth).toBe(
      375 - 16
    );
  });

  it("パネルの幅が画面より広ければ left は 8", () => {
    expect(computePanelPosition({ top: 0, bottom: 20, left: 300 }, { width: 1200, height: 100 }, viewport).left).toBe(8);
  });
});
