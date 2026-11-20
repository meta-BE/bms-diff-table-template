// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { TableView } from "@/components/TableView";
import type { TableEntry } from "@/lib/fetch-table-data";
import type { ColumnDef, TableConfig } from "@/lib/config";
import { installPopoverStub } from "../helpers/popover-stub";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const entries: TableEntry[] = [
  { md5: "abc123", level: "1", title: "テスト曲", artist: "テストアーティスト" },
];

function makeConfig(overrides: Partial<TableConfig> = {}): TableConfig {
  return {
    name: "Test",
    symbol: "★",
    dataUrl: "http://test",
    siteDescription: "",
    lightTheme: "light",
    darkTheme: "dark",
    darkMode: "system",
    levelOrder: ["1"],
    course: [],
    columns: [],
    tableStyle: { maxWidth: 1536, stripe: false, hover: false },
    ...overrides,
  };
}

describe("TableView - ellipsis", () => {
  it("ellipsis: true のカラムで min-w-0 がセルに、overflow-hidden / text-ellipsis / whitespace-nowrap が内側に付与される", () => {
    const columns: ColumnDef[] = [
      { header: "タイトル", type: "text", property: "title", ellipsis: true },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        config={makeConfig({ columns })}
      />
    );

    const cell = container.querySelectorAll('[role="cell"]')[0];
    expect(cell.className).toContain("min-w-0");
    const ellipsisInner = cell.querySelector(".overflow-hidden.text-ellipsis.whitespace-nowrap");
    expect(ellipsisInner).not.toBeNull();
  });

  it("ellipsis: true のカラムでテキスト内容が正しく表示される", () => {
    const columns: ColumnDef[] = [
      { header: "タイトル", type: "text", property: "title", ellipsis: true },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        config={makeConfig({ columns })}
      />
    );

    const cell = container.querySelectorAll('[role="cell"]')[0];
    expect(cell.textContent).toBe("テスト曲");
  });

  it("ellipsis 未指定のカラムには min-w-0 が付与されない", () => {
    const columns: ColumnDef[] = [
      { header: "タイトル", type: "text", property: "title" },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        config={makeConfig({ columns })}
      />
    );

    const cell = container.querySelectorAll('[role="cell"]')[0];
    expect(cell.className).not.toContain("min-w-0");
  });
});

describe("TableView - nowrap", () => {
  it("nowrap: true のカラムセルに whitespace-nowrap クラスが付与される", () => {
    const columns: ColumnDef[] = [
      { header: "難易度", type: "level" },
      { header: "タイトル", type: "text", property: "title", nowrap: true },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        config={makeConfig({ columns })}
      />
    );

    const cells = container.querySelectorAll('[role="cell"]');
    expect(cells[0].className).not.toContain("whitespace-nowrap");
    expect(cells[1].className).toContain("whitespace-nowrap");
  });

  it("nowrap 未指定のカラムセルには whitespace-nowrap クラスが付与されない", () => {
    const columns: ColumnDef[] = [
      { header: "難易度", type: "level" },
      { header: "タイトル", type: "text", property: "title" },
    ];
    const { container } = render(
      <TableView
        entries={entries}
        config={makeConfig({ columns })}
      />
    );

    const cells = container.querySelectorAll('[role="cell"]');
    expect(cells[0].className).not.toContain("whitespace-nowrap");
    expect(cells[1].className).not.toContain("whitespace-nowrap");
  });
});

describe("TableView - zebra stripe & hover", () => {
  const columns: ColumnDef[] = [
    { header: "難易度", type: "level" },
    { header: "タイトル", type: "text", property: "title" },
  ];

  const multiEntries: TableEntry[] = [
    { md5: "aaa", level: "1", title: "曲A" },
    { md5: "bbb", level: "1", title: "曲B" },
    { md5: "ccc", level: "1", title: "曲C" },
  ];

  it("曲行が subgrid 構造を持つ（grid grid-cols-subgrid col-span-full）", () => {
    const { container } = render(
      <TableView entries={multiEntries} config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: true, hover: true } })} />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    // songRows[0] = ヘッダー行, songRows[1] = レベル区分行, songRows[2..4] = 曲行
    const firstSongRow = songRows[2];
    expect(firstSongRow.className).toContain("grid");
    expect(firstSongRow.className).toContain("grid-cols-subgrid");
    expect(firstSongRow.className).toContain("col-span-full");
    expect(firstSongRow.className).not.toContain("contents");
  });

  it("奇数行（インデックス0,2）に bg-base-content/5 が付与される", () => {
    const { container } = render(
      <TableView entries={multiEntries} config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: true, hover: true } })} />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    // 曲行は songRows[2], songRows[3], songRows[4]
    expect(songRows[2].className).toContain("bg-base-content/5");
    expect(songRows[3].className).not.toContain("bg-base-content/5");
    expect(songRows[4].className).toContain("bg-base-content/5");
  });

  it("全曲行に hover:bg-base-content/10 が付与される", () => {
    const { container } = render(
      <TableView entries={multiEntries} config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: true, hover: true } })} />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    for (let i = 2; i <= 4; i++) {
      expect(songRows[i].className).toContain("hover:bg-base-content/10");
    }
  });

  it("全曲行に transition-colors が付与される", () => {
    const { container } = render(
      <TableView entries={multiEntries} config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: true, hover: true } })} />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    for (let i = 2; i <= 4; i++) {
      expect(songRows[i].className).toContain("transition-colors");
    }
  });
});

describe("TableView - tableStyle 条件分岐", () => {
  const columns: ColumnDef[] = [
    { header: "難易度", type: "level" },
    { header: "タイトル", type: "text", property: "title" },
  ];

  const multiEntries: TableEntry[] = [
    { md5: "aaa", level: "1", title: "曲A" },
    { md5: "bbb", level: "1", title: "曲B" },
    { md5: "ccc", level: "1", title: "曲C" },
  ];

  it("stripe: false の場合、bg-base-content/5 が付与されない", () => {
    const { container } = render(
      <TableView
        entries={multiEntries}
        config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: false, hover: false } })}
      />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    for (let i = 2; i <= 4; i++) {
      expect(songRows[i].className).not.toContain("bg-base-content/5");
    }
  });

  it("hover: false の場合、hover:bg-base-content/10 が付与されない", () => {
    const { container } = render(
      <TableView
        entries={multiEntries}
        config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: false, hover: false } })}
      />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    for (let i = 2; i <= 4; i++) {
      expect(songRows[i].className).not.toContain("hover:bg-base-content/10");
      expect(songRows[i].className).not.toContain("transition-colors");
    }
  });

  it("stripe: true の場合、偶数インデックス行に bg-base-content/5 が付与される", () => {
    const { container } = render(
      <TableView
        entries={multiEntries}
        config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: true, hover: false } })}
      />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    expect(songRows[2].className).toContain("bg-base-content/5");
    expect(songRows[3].className).not.toContain("bg-base-content/5");
    expect(songRows[4].className).toContain("bg-base-content/5");
  });

  it("hover: true の場合、全曲行に hover:bg-base-content/10 が付与される", () => {
    const { container } = render(
      <TableView
        entries={multiEntries}
        config={makeConfig({ columns, tableStyle: { maxWidth: 1536, stripe: false, hover: true } })}
      />
    );
    const songRows = container.querySelectorAll('[role="row"]');
    for (let i = 2; i <= 4; i++) {
      expect(songRows[i].className).toContain("hover:bg-base-content/10");
      expect(songRows[i].className).toContain("transition-colors");
    }
  });
});

describe("TableView - ローカルパス実在ゲート", () => {
  const localColumns: ColumnDef[] = [
    { header: "Mirror", type: "badge", label: "DL", url: "/downloads/{{no}}.zip", align: "center" },
  ];
  const localEntries: TableEntry[] = [{ md5: "x", level: "1", no: "26" }];

  it("fileExists が true のとき badge リンクが表示される", () => {
    const { container } = render(
      <TableView entries={localEntries} config={makeConfig({ columns: localColumns })} fileExists={() => true} />
    );
    const link = container.querySelector('a[href="/downloads/26.zip"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("DL");
  });

  it("fileExists が false のとき badge は非表示", () => {
    const { container } = render(
      <TableView entries={localEntries} config={makeConfig({ columns: localColumns })} fileExists={() => false} />
    );
    expect(container.querySelector('a[href="/downloads/26.zip"]')).toBeNull();
  });

  it("外部URLの badge は fileExists に関わらず表示される", () => {
    const extColumns: ColumnDef[] = [
      { header: "Chart", type: "badge", label: "DL", url: "{{url_diff}}", align: "center" },
    ];
    const extEntries: TableEntry[] = [{ md5: "x", level: "1", url_diff: "https://stellabms.xyz/upload/4203" }];
    const { container } = render(
      <TableView entries={extEntries} config={makeConfig({ columns: extColumns })} fileExists={() => false} />
    );
    expect(container.querySelector('a[href="https://stellabms.xyz/upload/4203"]')).not.toBeNull();
  });

  it("fileExists 未指定（既定）ではローカルパス badge が表示される", () => {
    const { container } = render(
      <TableView entries={localEntries} config={makeConfig({ columns: localColumns })} />
    );
    expect(container.querySelector('a[href="/downloads/26.zip"]')).not.toBeNull();
  });
});

describe("TableView - フィルタ", () => {
  beforeAll(() => {
    installPopoverStub();
  });

  // vitest の globals が無効なため、Testing Library の自動クリーンアップが働かない
  afterEach(() => {
    cleanup();
  });

  const filterEntries: TableEntry[] = [
    { md5: "a", level: "1", title: "A", rating: "★★★☆☆", year: "2024" },
    { md5: "b", level: "1", title: "B", rating: "★★★★★", year: "2025" },
    { md5: "c", level: "2", title: "C", rating: "★★★☆☆", year: "2025" },
    { md5: "d", level: "2", title: "D", rating: "★☆☆☆☆", year: "2026" },
    { md5: "e", level: "3", title: "E", rating: "★★★★★", year: "2024" },
  ];
  const filterColumns: ColumnDef[] = [
    { header: "Lv", type: "level" },
    { header: "Title", type: "text", property: "title" },
    { header: "Rating", type: "text", property: "rating", filter: true },
    { header: "Published", type: "text", property: "year", filter: { order: "desc" } },
  ];

  function renderTable(overrides: Partial<TableConfig> = {}, data: TableEntry[] = filterEntries) {
    return render(
      <TableView entries={data} config={makeConfig({ columns: filterColumns, levelOrder: [], ...overrides })} />
    );
  }
  const songRows = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('[role="row"].grid-cols-subgrid'));
  const visibleTitles = (container: HTMLElement) =>
    songRows(container).map((row) => row.querySelectorAll('[role="cell"]')[1].textContent);
  const levelHeaders = (container: HTMLElement) =>
    Array.from(container.querySelectorAll(".table-grid-header-row")).map((el) => el.textContent);
  // 閉じたパネルは display: none でアクセシビリティツリーから外れるため、ボタンの aria-controls からたどる
  const dialogOf = (header: string, index = 0) =>
    document.getElementById(
      screen.getAllByRole("button", { name: new RegExp(`^${header} でフィルタ`) })[index].getAttribute("aria-controls")!
    )!;
  const check = (header: string, label: string, index = 0) =>
    fireEvent.click(within(dialogOf(header, index)).getByText(label));
  const filterButton = (header: string) => screen.getByRole("button", { name: new RegExp(`^${header} でフィルタ`) });

  it("filter を設定したカラムの見出しにだけ、フィルタボタンが出る", () => {
    renderTable();
    expect(screen.getAllByRole("button", { name: /でフィルタ/ }).map((b) => b.getAttribute("aria-label"))).toEqual([
      "Rating でフィルタ",
      "Published でフィルタ",
    ]);
  });

  it("チェックすると一致する行だけが表示され、見出しの件数が変わる", () => {
    const { container } = renderTable();
    check("Rating", "★★★★★");
    expect(visibleTitles(container)).toEqual(["B", "E"]);
    expect(levelHeaders(container)).toEqual(["★1 (1譜面)", "★2 (0譜面)", "★3 (1譜面)"]);
  });

  it("0件の難易度は見出しだけを表示する", () => {
    const { container } = renderTable();
    check("Rating", "★★★★★");
    expect(levelHeaders(container)).toContain("★2 (0譜面)");
    expect(songRows(container).filter((row) => row.querySelector('[role="cell"]')!.textContent === "★2")).toHaveLength(0);
  });

  it("同じカラムで複数選択すると OR 条件で表示する", () => {
    const { container } = renderTable();
    check("Rating", "★★★★★");
    check("Rating", "★☆☆☆☆");
    expect(visibleTitles(container)).toEqual(["B", "D", "E"]);
  });

  it("別のカラムで選ぶと、前のカラムの選択が外れる", () => {
    const { container } = renderTable();
    check("Rating", "★★★★★");
    check("Published", "2024");
    expect(visibleTitles(container)).toEqual(["A", "E"]);
    const ratingBoxes = within(dialogOf("Rating")).getAllByRole("checkbox", { hidden: true }) as HTMLInputElement[];
    expect(ratingBoxes.some((box) => box.checked)).toBe(false);
    expect(filterButton("Rating").className).not.toContain("text-primary");
    expect(filterButton("Published").className).toContain("text-primary");
  });

  it("最後のチェックを外すと、全件の表示に戻り、ボタンの強調表示も消える", () => {
    const { container } = renderTable();
    check("Rating", "★★★★★");
    check("Rating", "★★★★★");
    expect(visibleTitles(container)).toEqual(["A", "B", "C", "D", "E"]);
    expect(filterButton("Rating").className).not.toContain("text-primary");
  });

  it("解除ボタンで全件の表示に戻る", () => {
    const { container } = renderTable();
    check("Rating", "★★★★★");
    fireEvent.click(within(dialogOf("Rating")).getByText("解除"));
    expect(visibleTitles(container)).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("ストライプは絞り込み後の行で付け直す", () => {
    const { container } = renderTable({ tableStyle: { maxWidth: 1536, stripe: true, hover: false } });
    check("Published", "2025");
    const rows = songRows(container);
    expect(visibleTitles(container)).toEqual(["B", "C"]);
    // B は絞り込み前は難易度1の2行目（ストライプなし）だが、絞り込み後は先頭になる
    expect(rows.map((row) => row.className.includes("bg-base-content/5"))).toEqual([true, true]);
  });

  it("見出しが重複していても、カラムの位置で区別する", () => {
    renderTable({
      columns: [
        { header: "X", type: "text", property: "rating", filter: true },
        { header: "X", type: "text", property: "year", filter: true },
      ],
    });
    check("X", "2025", 1);
    const buttons = screen.getAllByRole("button", { name: /^X でフィルタ/ });
    expect(buttons[0].className).not.toContain("text-primary");
    expect(buttons[1].className).toContain("text-primary");
  });

  it("Lv フィルタの選択肢は、symbol+level で表の難易度の順に並ぶ", () => {
    renderTable({
      columns: [{ header: "Lv", type: "level", filter: true }, { header: "Title", type: "text", property: "title" }],
      levelOrder: ["3", "1", "2"],
    });
    const labels = within(dialogOf("Lv"))
      .getAllByRole("checkbox", { hidden: true })
      .map((box) => box.closest("label")!.textContent);
    expect(labels).toEqual(["★3 (1)", "★1 (2)", "★2 (2)"]);
  });

  it("level や値が数値でも絞り込める", () => {
    const numeric = [
      { md5: "n1", level: 1, title: "N1", rating: "★", year: 2024 },
      { md5: "n2", level: 2, title: "N2", rating: "★", year: 2025 },
    ] as unknown as TableEntry[];
    const { container } = renderTable({}, numeric);
    check("Published", "2024");
    expect(visibleTitles(container)).toEqual(["N1"]);
    expect(levelHeaders(container)).toEqual(["★1 (1譜面)", "★2 (0譜面)"]);
  });
});
