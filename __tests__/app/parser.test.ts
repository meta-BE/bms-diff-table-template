import { describe, it, expect } from "vitest";
import { GET } from "@/app/parser/route";

describe("GET /_parser", () => {
  it("text/html レスポンスを返す", async () => {
    const response = GET();
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8"
    );
  });

  it("bmstable メタタグを含む", async () => {
    const response = GET();
    const html = await response.text();
    expect(html).toContain('<meta name="bmstable" content="header.json" />');
  });

  it("bmstable メタタグが行頭にあり、パーサの split('\"')[3] で header.json が取れる", async () => {
    const response = GET();
    const html = await response.text();
    const lines = html.split("\n");
    const bmstableLine = lines.find((line) =>
      line.toLowerCase().includes('<meta name="bmstable"')
    );
    expect(bmstableLine).toBeDefined();
    const parts = bmstableLine!.split('"');
    expect(parts[3]).toBe("header.json");
  });
});
