import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";

vi.mock("fs");

const sampleConfig = {
  name: "My BMS Table",
  symbol: "★",
  dataUrl: "https://your-gas-url/exec",
  columns: [
    { header: "Lv", type: "level" },
    { header: "Title", type: "link", property: "title", url: "{{url}}" },
    { header: "Artist", type: "text", property: "artist" },
  ],
};

describe("loadConfig", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("table.config.local.json が存在する場合はそちらを優先する", async () => {
    const localConfig = { name: "Local", symbol: "L", dataUrl: "http://local" };
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("table.config.local.json")
    );
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(localConfig));

    const { loadConfig } = await import("@/lib/config");
    const config = loadConfig();

    expect(config.name).toBe("Local");
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("table.config.local.json"),
      "utf-8"
    );
  });

  it("table.config.local.json が存在しない場合は table.config.json を読む", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(sampleConfig));

    const { loadConfig } = await import("@/lib/config");
    const config = loadConfig();

    expect(config.name).toBe("My BMS Table");
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("table.config.json"),
      "utf-8"
    );
  });

  it("デフォルト値が適用される", async () => {
    const minimalConfig = { name: "Test", symbol: "T", dataUrl: "http://test" };
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(minimalConfig));

    const { loadConfig } = await import("@/lib/config");
    const config = loadConfig();

    expect(config.lightTheme).toBe("light");
    expect(config.darkTheme).toBe("dark");
    expect(config.darkMode).toBe("system");
    expect(config.levelOrder).toEqual([]);
    expect(config.course).toEqual([]);
    expect(config.columns).toEqual([]);
  });

  it("level 型カラムが定義できる", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(sampleConfig));

    const { loadConfig } = await import("@/lib/config");
    const config = loadConfig();
    const levelCol = config.columns.find((c) => c.type === "level");

    expect(levelCol).toBeDefined();
    expect(levelCol!.header).toBe("Lv");
  });
});
