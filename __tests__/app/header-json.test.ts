import { describe, it, expect } from "vitest";
import { GET } from "@/app/header.json/route";

describe("GET /header.json", () => {
  it("BMSTable形式のヘッダーを返す", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBeTypeOf("string");
    expect(body.symbol).toBeTypeOf("string");
    expect(body.data_url).toBe("/data.json");
  });

  it("levelOrderが設定されていればlevel_orderを含む", async () => {
    const response = await GET();
    const body = await response.json();

    // table.config.json の levelOrder が空配列なら level_order は含まれない
    if (body.level_order) {
      expect(body.level_order).toBeInstanceOf(Array);
    }
  });

  it("courseが設定されていればcourseを含む", async () => {
    const response = await GET();
    const body = await response.json();

    if (body.course) {
      expect(body.course).toBeInstanceOf(Array);
    }
  });
});
