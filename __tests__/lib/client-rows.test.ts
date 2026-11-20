import { describe, it, expect } from "vitest";
import { toClientRows } from "@/lib/client-rows";
import type { ColumnDef } from "@/lib/config";
import type { TableEntry } from "@/lib/fetch-table-data";

const always = () => true;

function rowOf(entry: TableEntry, columns: ColumnDef[], fileExists: (p: string) => boolean = always) {
  return toClientRows([entry], columns, fileExists)[0];
}

describe("toClientRows", () => {
  it("text: texts に表示用の文字列が入り、filter がなければ urls と filterValues は null", () => {
    const row = rowOf({ md5: "a", level: "1", title: "曲" }, [{ header: "T", type: "text", property: "title" }]);
    expect(row.texts).toEqual(["曲"]);
    expect(row.urls).toEqual([null]);
    expect(row.filterValues).toEqual([null]);
  });

  it("text: 値が未定義なら texts は空文字", () => {
    const row = rowOf({ md5: "a", level: "1" }, [{ header: "C", type: "text", property: "comment" }]);
    expect(row.texts).toEqual([""]);
  });

  it("link: property がない行では texts が null", () => {
    const row = rowOf({ md5: "a", level: "1" }, [{ header: "A", type: "link", property: "artist", url: "{{url}}" }]);
    expect(row.texts).toEqual([null]);
  });

  it("link: urls に解決済みの URL が入り、テンプレートの値が空なら null", () => {
    const columns: ColumnDef[] = [{ header: "A", type: "link", property: "artist", url: "{{url}}" }];
    expect(rowOf({ md5: "a", level: "1", artist: "X", url: "https://a" }, columns).urls).toEqual(["https://a"]);
    expect(rowOf({ md5: "a", level: "1", artist: "X", url: "" }, columns).urls).toEqual([null]);
  });

  it("badge: /downloads/ のファイルが存在しなければ urls は null", () => {
    const columns: ColumnDef[] = [{ header: "M", type: "badge", label: "DL", url: "/downloads/{{no}}.zip" }];
    const entry: TableEntry = { md5: "a", level: "1", no: "26" };
    expect(rowOf(entry, columns, () => false).urls).toEqual([null]);
    expect(rowOf(entry, columns, () => true).urls).toEqual(["/downloads/26.zip"]);
  });

  it("level と badge の texts は null", () => {
    const row = rowOf({ md5: "a", level: "1", u: "https://x" }, [
      { header: "Lv", type: "level" },
      { header: "DL", type: "badge", label: "DL", url: "{{u}}" },
    ]);
    expect(row.texts).toEqual([null, null]);
  });

  it("filter 付き: filterValues に正規化した値が入る", () => {
    const columns: ColumnDef[] = [
      { header: "P", type: "text", property: "published_at", filter: { property: "published_year" } },
    ];
    expect(rowOf({ md5: "a", level: "1", published_at: "2024-07-18", published_year: 2024 }, columns).filterValues).toEqual([
      "2024",
    ]);
    expect(rowOf({ md5: "a", level: "1", published_at: "2024-07-18" }, columns).filterValues).toEqual([""]);
  });

  it("level の filter: true では level の値を使う", () => {
    const row = rowOf({ md5: "a", level: "8" }, [{ header: "Lv", type: "level", filter: true }]);
    expect(row.filterValues).toEqual(["8"]);
  });

  it("level と md5 は文字列にする", () => {
    const row = rowOf({ md5: 123 as unknown as string, level: 8 as unknown as string }, []);
    expect(row.md5).toBe("123");
    expect(row.level).toBe("8");
  });
});
