// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { ValidationLogger } from "@/components/ValidationLogger";

describe("ValidationLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rows が空の警告には行の情報を出さない", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <ValidationLogger
        issues={[{ level: "warning", column: "DL", detail: "filter", message: "badge カラムでは filter は使えません", rows: [] }]}
        totalEntries={3}
      />
    );
    const output = String(warn.mock.calls[0][0]);
    expect(output).toContain('⚠ カラム "DL" (filter): badge カラムでは filter は使えません');
    expect(output).not.toContain("件 (");
  });

  it("rows がある警告には件数と行番号を出す", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <ValidationLogger
        issues={[{ level: "warning", column: "R", detail: 'filter key: "x"', message: "キー未定義", rows: [2] }]}
        totalEntries={3}
      />
    );
    expect(String(warn.mock.calls[0][0])).toContain("1件 (行: 2)");
  });
});
