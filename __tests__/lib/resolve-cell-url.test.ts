import { describe, it, expect } from "vitest";
import { resolveCellUrl } from "@/lib/resolve-cell-url";

describe("resolveCellUrl", () => {
  const always = () => true;
  const never = () => false;

  it("外部URLはそのまま返す（実在チェックしない）", () => {
    expect(resolveCellUrl("{{url_diff}}", { url_diff: "https://x/y" }, never)).toBe("https://x/y");
  });

  it("/downloads/ 配下で実在するとき URL を返す", () => {
    expect(resolveCellUrl("/downloads/{{no}}.zip", { no: "26" }, always)).toBe("/downloads/26.zip");
  });

  it("/downloads/ 配下で実ファイルが無いとき null", () => {
    expect(resolveCellUrl("/downloads/{{no}}.zip", { no: "26" }, never)).toBeNull();
  });

  it("先頭スラッシュなしの downloads/ もゲート対象", () => {
    expect(resolveCellUrl("downloads/{{no}}.zip", { no: "26" }, never)).toBeNull();
  });

  it("ネストした /downloads/ 配下もゲート対象", () => {
    expect(resolveCellUrl("/downloads/2024/{{no}}.zip", { no: "26" }, never)).toBeNull();
  });

  it("/downloads/ 以外の内部パスはチェックせず常に表示", () => {
    expect(resolveCellUrl("/guide", {}, never)).toBe("/guide");
  });

  it("/downloads/ 配下でも拡張子なし（ページ）はチェックせず常に表示", () => {
    expect(resolveCellUrl("/downloads/guide", {}, never)).toBe("/downloads/guide");
  });

  it("プレースホルダが空なら null（実在チェック以前）", () => {
    expect(resolveCellUrl("/downloads/{{no}}.zip", {}, always)).toBeNull();
  });
});
