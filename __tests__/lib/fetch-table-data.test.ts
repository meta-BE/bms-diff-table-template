import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTableData } from "@/lib/fetch-table-data";

describe("fetchTableData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("URLからJSONデータを取得して返す", async () => {
    const mockData = [
      { md5: "abc123", level: "1", title: "Test Song", artist: "Artist" },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );

    const result = await fetchTableData("https://example.com/data.json");
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith("https://example.com/data.json", {
      redirect: "follow",
      next: { revalidate: 300 },
    });
  });

  it("fetch失敗時にエラーをthrowする", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })
    );

    await expect(
      fetchTableData("https://example.com/data.json")
    ).rejects.toThrow("データの取得に失敗しました: 500 Internal Server Error");
  });
});
