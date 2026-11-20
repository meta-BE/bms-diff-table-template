import { describe, it, expect } from "vitest";
import { resolveLevelOrder, groupRowsByLevel } from "@/lib/group-by-level";

describe("resolveLevelOrder", () => {
  it("levelOrder が空なら、データに出てきた順に重複なしで並べる", () => {
    expect(resolveLevelOrder(["2", "1", "2", "3"], [])).toEqual(["2", "1", "3"]);
  });

  it("levelOrder に従って並べ、levelOrder にない難易度はデータに出てきた順で後ろに付ける", () => {
    expect(resolveLevelOrder(["3", "1", "9", "2"], ["2", "1"])).toEqual(["2", "1", "3", "9"]);
  });

  it("levelOrder にあってデータにない難易度は含めない", () => {
    expect(resolveLevelOrder(["1"], ["0", "1"])).toEqual(["1"]);
  });
});

describe("groupRowsByLevel", () => {
  it("order に含まれる難易度はすべてキーになり、行がなければ空の配列になる", () => {
    const row = { level: "1", id: "a" };
    const groups = groupRowsByLevel([row], ["1", "2"]);
    expect(Array.from(groups.keys())).toEqual(["1", "2"]);
    expect(groups.get("1")).toEqual([row]);
    expect(groups.get("2")).toEqual([]);
  });

  it("行は入力の順番を保って振り分ける", () => {
    const rows = [
      { level: "1", id: "a" },
      { level: "2", id: "x" },
      { level: "1", id: "b" },
      { level: "1", id: "c" },
    ];
    const groups = groupRowsByLevel(rows, ["1", "2"]);
    expect(groups.get("1")!.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("order にない難易度の行は、末尾にグループを追加して振り分ける", () => {
    const groups = groupRowsByLevel([{ level: "9" }], ["1"]);
    expect(Array.from(groups.keys())).toEqual(["1", "9"]);
  });
});
