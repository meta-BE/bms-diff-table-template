import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "fs";
import { localPublicPath, publicFileExists } from "@/lib/local-file";

describe("localPublicPath", () => {
  it("サイト絶対パスはそのまま pathname を返す", () => {
    expect(localPublicPath("/downloads/26.zip")).toBe("/downloads/26.zip");
  });

  it("パス相対もサイトルート基準で解決する", () => {
    expect(localPublicPath("downloads/26.zip")).toBe("/downloads/26.zip");
  });

  it("../ を正規化してルート内に丸める", () => {
    expect(localPublicPath("../../downloads/26.zip")).toBe("/downloads/26.zip");
  });

  it("クエリ/ハッシュは pathname から除かれる", () => {
    expect(localPublicPath("/downloads/26.zip?v=1#x")).toBe("/downloads/26.zip");
  });

  it("URLエンコードはデコードして返す", () => {
    expect(localPublicPath("/downloads/a%20b.zip")).toBe("/downloads/a b.zip");
  });

  it("絶対URL(http/https)は null（外部）", () => {
    expect(localPublicPath("https://stellabms.xyz/upload/4203")).toBeNull();
  });

  it("プロトコル相対(//host)は null（外部）", () => {
    expect(localPublicPath("//cdn.example/x.zip")).toBeNull();
  });

  it("mailto: は null（非ファイル）", () => {
    expect(localPublicPath("mailto:foo@example.com")).toBeNull();
  });

  it("不正なパーセントエンコーディングを含む相対パスは null（throwしない）", () => {
    expect(localPublicPath("/downloads/%zz.zip")).toBeNull();
  });
});

describe("publicFileExists", () => {
  // existsCache はモジュールスコープでテスト間もリセットされない（プロセス生存キャッシュ）。
  // spy 呼び出し回数を正しく検証するため、各テストは相異なる pathname を使うこと。
  afterEach(() => vi.restoreAllMocks());

  it("実在するとき true", () => {
    const spy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
    expect(publicFileExists("/downloads/exists-1.zip")).toBe(true);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("実在しないとき false", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    expect(publicFileExists("/downloads/missing-1.zip")).toBe(false);
  });

  it("public 配下を出るパスは fs を呼ばず false（含有チェック）", () => {
    const spy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
    expect(publicFileExists("/../secret-1.txt")).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("同一パスの2回目はキャッシュを返し fs を再呼び出ししない", () => {
    const spy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
    expect(publicFileExists("/downloads/cached-1.zip")).toBe(true);
    expect(publicFileExists("/downloads/cached-1.zip")).toBe(true);
    expect(spy).toHaveBeenCalledOnce();
  });
});
