import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { loadDescription } from "@/lib/load-description";

vi.mock("fs");

describe("loadDescription", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("description.local.html が存在する場合はそちらを優先する", () => {
    const localHtml = "<p>ローカル説明文</p>";
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(localHtml);

    const result = loadDescription();

    expect(result).toBe(localHtml);
    expect(fs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining("description.local.html")
    );
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("description.local.html"),
      "utf-8"
    );
  });

  it("description.local.html が存在しない場合は description.html を読む", () => {
    const html = "<p>通常説明文</p>";
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue(html);

    const result = loadDescription();

    expect(result).toBe(html);
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("description.html"),
      "utf-8"
    );
  });

  it("どちらのファイルも存在しない場合は null を返す", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error("ENOENT");
    });

    const result = loadDescription();

    expect(result).toBeNull();
  });

  it("a タグに target/rel が付加される", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue('<a href="https://example.com">link</a>');

    const result = loadDescription();

    expect(result).toBe('<a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>');
  });
});
