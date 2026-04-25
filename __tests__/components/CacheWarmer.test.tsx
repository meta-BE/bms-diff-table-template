// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { CacheWarmer } from "@/components/CacheWarmer";

describe("CacheWarmer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("マウント時に /data.json へフェッチリクエストを送る", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response());
    render(<CacheWarmer />);
    expect(fetchSpy).toHaveBeenCalledWith("/data.json");
  });

  it("UIを何もレンダリングしない", () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response());
    const { container } = render(<CacheWarmer />);
    expect(container.innerHTML).toBe("");
  });
});
