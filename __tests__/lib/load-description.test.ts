import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { loadDescription } from "@/lib/load-description";

vi.mock("fs");

describe("loadDescription", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("description.html が存在する場合、その内容を返す", () => {
    const html = '<p>テスト説明文</p>';
    vi.mocked(fs.readFileSync).mockReturnValue(html);

    const result = loadDescription();

    expect(result).toBe(html);
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("description.html"),
      "utf-8"
    );
  });

  it("description.html が存在しない場合、null を返す", () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error("ENOENT");
    });

    const result = loadDescription();

    expect(result).toBeNull();
  });
});
