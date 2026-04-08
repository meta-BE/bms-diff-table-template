import { describe, it, expect } from "vitest";

describe("config", () => {
  it("必須フィールドが読み込まれる", async () => {
    const { config } = await import("@/lib/config");
    expect(config.name).toBe("Sample BMS Table");
    expect(config.symbol).toBe("★");
    expect(config.dataUrl).toContain("https://");
  });

  it("デフォルト値が適用される", async () => {
    const { config } = await import("@/lib/config");
    expect(config.revalidate).toBeTypeOf("number");
    expect(config.revalidate).toBeGreaterThan(0);
    expect(config.siteDescription).toBeTypeOf("string");
    expect(config.lightTheme).toBeTypeOf("string");
    expect(config.darkTheme).toBeTypeOf("string");
    expect(config.darkMode).toMatch(/^(light|dark|system)$/);
    expect(config.levelOrder).toBeInstanceOf(Array);
    expect(config.course).toBeInstanceOf(Array);
  });
});
