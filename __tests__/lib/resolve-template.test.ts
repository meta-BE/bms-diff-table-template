import { describe, it, expect } from "vitest";
import { resolveTemplate } from "@/lib/resolve-template";

describe("resolveTemplate", () => {
  it("単一プレースホルダーを展開する", () => {
    const result = resolveTemplate(
      "http://example.com?md5={{md5}}",
      { md5: "abc123" }
    );
    expect(result).toBe("http://example.com?md5=abc123");
  });

  it("複数プレースホルダーを展開する", () => {
    const result = resolveTemplate(
      "http://example.com?a={{propA}}&b={{propB}}",
      { propA: "x", propB: "y" }
    );
    expect(result).toBe("http://example.com?a=x&b=y");
  });

  it("プロパティ値のみのテンプレートを展開する", () => {
    const result = resolveTemplate(
      "{{url_diff}}",
      { url_diff: "https://example.com/dl" }
    );
    expect(result).toBe("https://example.com/dl");
  });

  it("プロパティが未定義の場合 null を返す", () => {
    const result = resolveTemplate(
      "http://example.com?md5={{md5}}",
      {}
    );
    expect(result).toBeNull();
  });

  it("プロパティが空文字列の場合 null を返す", () => {
    const result = resolveTemplate(
      "http://example.com?md5={{md5}}",
      { md5: "" }
    );
    expect(result).toBeNull();
  });

  it("複数プレースホルダーの一部が未定義の場合 null を返す", () => {
    const result = resolveTemplate(
      "http://example.com?a={{propA}}&b={{propB}}",
      { propA: "x" }
    );
    expect(result).toBeNull();
  });
});
