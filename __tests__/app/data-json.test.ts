import { describe, it, expect, vi, beforeEach } from "vitest";

describe("GET /data.json", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchTableDataの結果をJSONレスポンスとして返す", async () => {
    const mockData = [
      { md5: "abc123", level: "1", title: "Song", artist: "Artist" },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );

    const { GET } = await import("@/app/data.json/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(body).toEqual(mockData);
  });

  it("fetch失敗時に502を返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })
    );

    const { GET } = await import("@/app/data.json/route");
    const response = await GET();

    expect(response.status).toBe(502);
  });
});
