import { describe, it, expect } from "vitest";
import { validateEntries } from "@/lib/validate-entries";
import type { ColumnDef } from "@/lib/config";
import type { TableEntry } from "@/lib/fetch-table-data";

describe("validateEntries", () => {
  const baseEntries: TableEntry[] = [
    { md5: "abc", level: "1", title: "Song A", artist: "Art A", url: "http://a.com" },
    { md5: "def", level: "2", title: "Song B", artist: "Art B", url: "http://b.com" },
  ];

  it("正常なデータでは問題を検出しない", () => {
    const columns: ColumnDef[] = [
      { header: "Title", type: "text", property: "title" },
    ];
    const result = validateEntries(baseEntries, columns);
    expect(result.issues).toHaveLength(0);
  });

  it("空文字列はエラーとして扱わない", () => {
    const entries: TableEntry[] = [
      { md5: "abc", level: "1", comment: "" },
    ];
    const columns: ColumnDef[] = [
      { header: "Comment", type: "text", property: "comment" },
    ];
    const result = validateEntries(entries, columns);
    expect(result.issues).toHaveLength(0);
  });

  it("カラム定義が空なら問題を検出しない", () => {
    const result = validateEntries(baseEntries, []);
    expect(result.issues).toEqual([]);
  });

  it("text型: propertyキーが未定義の場合エラーを検出する", () => {
    const columns: ColumnDef[] = [
      { header: "Comment", type: "text", property: "comment" },
    ];
    const result = validateEntries(baseEntries, columns);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      level: "error",
      column: "Comment",
      detail: 'property: "comment"',
      message: "キー未定義",
      rows: [1, 2],
      totalEntries: 2,
    });
  });

  it("link型: propertyキーが未定義の場合エラーを検出する", () => {
    const columns: ColumnDef[] = [
      { header: "Title", type: "link", property: "nonexistent", url: "http://example.com?md5={{md5}}" },
    ];
    const result = validateEntries(baseEntries, columns);
    const propertyIssue = result.issues.find((i) => i.detail.startsWith("property:"));
    expect(propertyIssue).toBeDefined();
    expect(propertyIssue!.level).toBe("error");
    expect(propertyIssue!.rows).toEqual([1, 2]);
  });

  it("link型: URLテンプレートキーが未定義の場合ワーニングを検出する", () => {
    const columns: ColumnDef[] = [
      { header: "Artist", type: "link", property: "artist", url: "{{missing_url}}" },
    ];
    const result = validateEntries(baseEntries, columns);
    const urlIssue = result.issues.find((i) => i.detail.includes("url key:"));
    expect(urlIssue).toBeDefined();
    expect(urlIssue!.level).toBe("warning");
    expect(urlIssue!.rows).toEqual([1, 2]);
  });

  it("badge型: URLテンプレートキーが未定義の場合エラーを検出する", () => {
    const columns: ColumnDef[] = [
      { header: "DL", type: "badge", label: "DL", url: "{{url_diff}}" },
    ];
    const result = validateEntries(baseEntries, columns);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      level: "error",
      column: "DL",
      detail: 'url key: "url_diff"',
      message: "キー未定義",
    });
  });

  it("一部のエントリのみキー未定義の場合、該当行番号のみ報告する", () => {
    const entries: TableEntry[] = [
      { md5: "abc", level: "1", comment: "ok" },
      { md5: "def", level: "2" },
      { md5: "ghi", level: "3", comment: "fine" },
    ];
    const columns: ColumnDef[] = [
      { header: "Comment", type: "text", property: "comment" },
    ];
    const result = validateEntries(entries, columns);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].rows).toEqual([2]);
    expect(result.issues[0].totalEntries).toBe(3);
  });

  it("link型: propertyとURLテンプレート両方に問題がある場合、別々のissueとして報告する", () => {
    const columns: ColumnDef[] = [
      { header: "Link", type: "link", property: "missing_prop", url: "{{missing_key}}" },
    ];
    const result = validateEntries(baseEntries, columns);
    expect(result.issues).toHaveLength(2);
    const levels = result.issues.map((i) => i.level);
    expect(levels).toContain("error");
    expect(levels).toContain("warning");
  });
});
