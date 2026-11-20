// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { FilterDropdown } from "@/components/FilterDropdown";
import type { FilterOption } from "@/lib/filter";
import { installPopoverStub } from "../helpers/popover-stub";

beforeAll(() => {
  installPopoverStub();
});

// vitest の globals が無効なため、Testing Library の自動クリーンアップが働かない
afterEach(() => {
  cleanup();
});

const options: FilterOption[] = [
  { value: "2026", label: "2026", count: 19 },
  { value: "2025", label: "2025", count: 15 },
  { value: "", label: "（空）", count: 1 },
];

function setup(selected: Set<string> = new Set()) {
  const onToggle = vi.fn();
  const onClear = vi.fn();
  render(<FilterDropdown header="Published" options={options} selected={selected} onToggle={onToggle} onClear={onClear} />);
  // 閉じたパネルは display: none でアクセシビリティツリーから外れるため、ボタンの aria-controls からたどる
  const button = screen.getByRole("button", { name: /^Published でフィルタ/ });
  const dialog = document.getElementById(button.getAttribute("aria-controls")!)!;
  return { onToggle, onClear, dialog };
}

describe("FilterDropdown", () => {
  it("ボタンに aria-haspopup=dialog と aria-controls（パネルの id）が付き、aria-label は「Published でフィルタ」", () => {
    const { dialog } = setup();
    const button = screen.getByRole("button", { name: "Published でフィルタ" });
    expect(button.getAttribute("aria-haspopup")).toBe("dialog");
    expect(button.getAttribute("aria-controls")).toBe(dialog.id);
    expect(button.className).not.toContain("text-primary");
  });

  it("選択中は、aria-label が「Published でフィルタ（2件選択中）」になり、ボタンに text-primary が付く", () => {
    setup(new Set(["2026", "2025"]));
    const button = screen.getByRole("button", { name: "Published でフィルタ（2件選択中）" });
    expect(button.className).toContain("text-primary");
  });

  it("ボタンに hidden と supports-[selector(:popover-open)]:inline-flex のクラスが付く", () => {
    setup();
    const classes = screen.getByRole("button", { name: "Published でフィルタ" }).className.split(" ");
    expect(classes).toContain("hidden");
    expect(classes).toContain("supports-[selector(:popover-open)]:inline-flex");
  });

  it("パネルは popover=auto・role=dialog で、aria-label は「Published の絞り込み」", () => {
    const { dialog } = setup();
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("popover")).toBe("auto");
    expect(dialog.getAttribute("aria-label")).toBe("Published の絞り込み");
  });

  it("選択肢を「ラベル (件数)」で表示し、selected に含まれる値はチェック済みになっている", () => {
    const { dialog } = setup(new Set(["2025"]));
    const boxes = within(dialog).getAllByRole("checkbox", { hidden: true }) as HTMLInputElement[];
    expect(boxes.map((b) => b.closest("label")!.textContent)).toEqual(["2026 (19)", "2025 (15)", "（空） (1)"]);
    expect(boxes.map((b) => b.checked)).toEqual([false, true, false]);
  });

  it("チェックボックスを押しても、ラベルの文字を押しても onToggle(value) が呼ばれる", () => {
    const { dialog, onToggle } = setup();
    const boxes = within(dialog).getAllByRole("checkbox", { hidden: true });
    fireEvent.click(boxes[0]);
    expect(onToggle).toHaveBeenLastCalledWith("2026");
    fireEvent.click(within(dialog).getByText("（空）"));
    expect(onToggle).toHaveBeenLastCalledWith("");
  });

  it("解除ボタンを押すと onClear が呼ばれ、選択がないときは disabled になる", () => {
    const { dialog, onClear } = setup(new Set(["2026"]));
    fireEvent.click(within(dialog).getByText("解除"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("選択がないときは解除ボタンが disabled になる", () => {
    const { dialog } = setup();
    expect(within(dialog).getByText("解除")).toHaveProperty("disabled", true);
  });

  it("ボタンは popovertarget でパネルを指し、押すとパネルが開いて aria-expanded が true になる", () => {
    const { dialog } = setup();
    const button = screen.getByRole("button", { name: "Published でフィルタ" });
    expect(button.getAttribute("popovertarget")).toBe(dialog.id);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("FilterDropdown - 位置", () => {
  it("上に開くとき、枠線を含めたパネルの高さでボタンの真上に置く", () => {
    const { dialog } = setup();
    const button = screen.getByRole("button", { name: "Published でフィルタ" });
    button.getBoundingClientRect = () => ({ top: 500, bottom: 520, left: 100 }) as DOMRect;
    // 中身の高さ 300px ＋ 上下の枠線 1px ずつ
    Object.defineProperty(dialog, "scrollHeight", { configurable: true, get: () => 300 });
    Object.defineProperty(dialog, "clientHeight", { configurable: true, get: () => 300 });
    Object.defineProperty(dialog, "offsetHeight", { configurable: true, get: () => 302 });
    Object.defineProperty(dialog, "offsetWidth", { configurable: true, get: () => 150 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1000 });
    fireEvent.click(button);
    expect(dialog.style.top).toBe(`${500 - 302}px`);
  });
});
