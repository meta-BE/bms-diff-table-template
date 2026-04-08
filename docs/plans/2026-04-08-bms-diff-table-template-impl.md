# BMS難易度表テンプレート 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** フォークして `table.config.json` を編集するだけで、ISRによる高速なBMS難易度表サイトが立ち上がるテンプレートリポジトリを作成する。

**Architecture:** Next.js App RouterのRoute HandlerでISRキャッシュ付きの `/data.json` エンドポイントを提供し、GAS等の外部データソースからのレスポンスを高速化する。`/header.json` は静的生成。トップページはServer Componentで同じデータを描画する。テーマはdaisyUIのプリセットテーマをconfig指定で切り替える。

**Tech Stack:** Next.js 15.3.x, Tailwind CSS 4.2.x, daisyUI 5.5.x, TypeScript, React 19.x, Vitest

**設計書:** `docs/superpowers/specs/2026-04-08-bms-diff-table-template-design.md`

---

## ファイル構成

| ファイル | 責務 |
|---|---|
| `table.config.json` | ユーザー編集用の設定ファイル |
| `lib/config.ts` | config読み込み、型定義、デフォルト値適用 |
| `lib/fetch-table-data.ts` | 外部URLからの譜面データfetch |
| `app/data.json/route.ts` | `/data.json` ISRエンドポイント |
| `app/header.json/route.ts` | `/header.json` 静的エンドポイント |
| `app/layout.tsx` | テーマ適用、bmstableメタタグ、OGP |
| `scripts/generate-css.mjs` | table.config.jsonからapp/globals.cssを自動生成 |
| `app/page.tsx` | トップページ（譜面一覧、ISR） |
| `components/TableView.tsx` | 譜面テーブル表示（Server Component） |
| `components/ThemeSwitcher.tsx` | ダークモード切り替えUI（Client Component） |
| `__tests__/lib/config.test.ts` | config読み込みのテスト |
| `__tests__/lib/fetch-table-data.test.ts` | データfetchのテスト |
| `__tests__/app/data-json.test.ts` | /data.json ルートのテスト |
| `__tests__/app/header-json.test.ts` | /header.json ルートのテスト |

---

### Task 1: プロジェクトスキャフォールド

**Files:**
- Create: `~/src/github.com/meta-BE/bms-diff-table-template/` (プロジェクトルート)

- [ ] **Step 1: Next.jsプロジェクト作成**

```bash
cd ~/src/github.com/meta-BE
npx create-next-app@15.3 bms-diff-table-template \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --use-npm \
  --yes
```

- [ ] **Step 2: daisyUIとVitestをインストール**

```bash
cd ~/src/github.com/meta-BE/bms-diff-table-template
npm install daisyui@5
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 3: create-next-appが生成した不要ファイルを削除**

不要な `app/page.tsx` の中身（デフォルトのウェルカムページ）、 `app/globals.css` のデフォルトスタイル、`public/` 内のSVGアセットを削除する。

```bash
cd ~/src/github.com/meta-BE/bms-diff-table-template
rm -f public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
```

- [ ] **Step 4: CSS自動生成スクリプトを作成**

`scripts/generate-css.mjs`:

```javascript
import { readFileSync, writeFileSync } from "fs";

const config = JSON.parse(readFileSync("table.config.json", "utf-8"));
const lightTheme = config.lightTheme || "light";
const darkTheme = config.darkTheme || "dark";

const css = `@import "tailwindcss";
@plugin "daisyui" {
  themes: ${lightTheme} --default, ${darkTheme} --prefersdark;
}
`;

writeFileSync("app/globals.css", css);
console.log(
  `app/globals.css を生成しました (themes: ${lightTheme}, ${darkTheme})`
);
```

- [ ] **Step 5: package.jsonにprebuild/predevスクリプトを追加**

`package.json` の `scripts` に追加:

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-css.mjs",
    "predev": "node scripts/generate-css.mjs"
  }
}
```

- [ ] **Step 6: CSS生成を実行して確認**

```bash
node scripts/generate-css.mjs
cat app/globals.css
```

Expected: 以下のような内容が出力される
```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

- [ ] **Step 7: app/globals.cssを.gitignoreに追加**

`app/globals.css` はビルド時に自動生成されるため、gitで追跡しない。`.gitignore` に追加:

```
app/globals.css
```

- [ ] **Step 8: Vitest設定ファイルを作成**

`vitest.config.ts` を作成:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

`package.json` の `scripts` に `test` と `test:watch` も追加（prebuild/predevは Step 5 で追加済み）:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 9: ビルド確認**

```bash
npm run build
```

Expected: ビルド成功

- [ ] **Step 10: git init & 初回コミット**

```bash
cd ~/src/github.com/meta-BE/bms-diff-table-template
git init
git add -A
git commit -m "初回スキャフォールド: Next.js 15 + Tailwind CSS 4 + daisyUI 5"
```

---

### Task 2: 設定ファイルと型定義

**Files:**
- Create: `table.config.json`
- Create: `lib/config.ts`
- Create: `__tests__/lib/config.test.ts`

- [ ] **Step 1: テスト作成**

`__tests__/lib/config.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("config", () => {
  it("必須フィールドが読み込まれる", async () => {
    const { config } = await import("@/lib/config");
    expect(config.name).toBe("Sample BMS Table");
    expect(config.symbol).toBe("★");
    expect(config.dataUrl).toContain("https://");
  });

  it("デフォルト値が適用される", async () => {
    const { config } = await import("@/lib/config");
    expect(config.revalidate).toBeTypeOf("number");
    expect(config.revalidate).toBeGreaterThan(0);
    expect(config.siteDescription).toBeTypeOf("string");
    expect(config.lightTheme).toBeTypeOf("string");
    expect(config.darkTheme).toBeTypeOf("string");
    expect(config.darkMode).toMatch(/^(light|dark|system)$/);
    expect(config.levelOrder).toBeInstanceOf(Array);
    expect(config.course).toBeInstanceOf(Array);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

```bash
npx vitest run __tests__/lib/config.test.ts
```

Expected: FAIL（`lib/config` が存在しない）

- [ ] **Step 3: table.config.jsonを作成**

`table.config.json`:

```json
{
  "name": "Sample BMS Table",
  "symbol": "★",
  "dataUrl": "https://script.google.com/macros/s/AKfycbzxaygsG5F82bHlTlhtiV1I1aEA9-aMLw2MOxZyYdLGptjIo3ua_qC07snELdwkSoxJ/exec",
  "revalidate": 3600,
  "siteDescription": "サンプルの難易度表です。table.config.json を編集してカスタマイズしてください。",
  "lightTheme": "light",
  "darkTheme": "dark",
  "darkMode": "system",
  "levelOrder": [],
  "course": []
}
```

- [ ] **Step 4: lib/config.tsを作成**

`lib/config.ts`:

```typescript
import configJson from "../table.config.json";

export interface CourseEntry {
  name: string;
  constraint: string[];
  md5: string[];
}

export interface TableConfig {
  name: string;
  symbol: string;
  dataUrl: string;
  revalidate: number;
  siteDescription: string;
  lightTheme: string;
  darkTheme: string;
  darkMode: "light" | "dark" | "system";
  levelOrder: string[];
  course: CourseEntry[];
}

const defaults: Omit<TableConfig, "name" | "symbol" | "dataUrl"> = {
  revalidate: 3600,
  siteDescription: "",
  lightTheme: "light",
  darkTheme: "dark",
  darkMode: "system",
  levelOrder: [],
  course: [],
};

export const config: TableConfig = {
  ...defaults,
  ...(configJson as Partial<TableConfig>),
} as TableConfig;
```

- [ ] **Step 5: tsconfig.jsonにresolveJsonModuleを確認**

`create-next-app` が生成する `tsconfig.json` には `resolveJsonModule: true` が含まれているはず。含まれていなければ追加する。

- [ ] **Step 6: テスト通過を確認**

```bash
npx vitest run __tests__/lib/config.test.ts
```

Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add table.config.json lib/config.ts __tests__/lib/config.test.ts tsconfig.json
git commit -m "feat: 設定ファイルと型定義を追加"
```

---

### Task 3: データfetchロジック

**Files:**
- Create: `lib/fetch-table-data.ts`
- Create: `__tests__/lib/fetch-table-data.test.ts`

- [ ] **Step 1: テスト作成**

`__tests__/lib/fetch-table-data.test.ts`:

```typescript
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
      next: expect.objectContaining({ revalidate: expect.any(Number) }),
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
```

- [ ] **Step 2: テスト失敗を確認**

```bash
npx vitest run __tests__/lib/fetch-table-data.test.ts
```

Expected: FAIL

- [ ] **Step 3: 実装**

`lib/fetch-table-data.ts`:

```typescript
import { config } from "./config";

export interface TableEntry {
  md5: string;
  level: string;
  title?: string;
  artist?: string;
  [key: string]: unknown;
}

export async function fetchTableData(
  url: string = config.dataUrl
): Promise<TableEntry[]> {
  const res = await fetch(url, {
    redirect: "follow",
    next: { revalidate: config.revalidate },
  });

  if (!res.ok) {
    throw new Error(
      `データの取得に失敗しました: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}
```

- [ ] **Step 4: テスト通過を確認**

```bash
npx vitest run __tests__/lib/fetch-table-data.test.ts
```

Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add lib/fetch-table-data.ts __tests__/lib/fetch-table-data.test.ts
git commit -m "feat: データfetchロジックを追加"
```

---

### Task 4: /data.json Route Handler (ISR)

**Files:**
- Create: `app/data.json/route.ts`
- Create: `__tests__/app/data-json.test.ts`

- [ ] **Step 1: テスト作成**

`__tests__/app/data-json.test.ts`:

```typescript
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
```

- [ ] **Step 2: テスト失敗を確認**

```bash
npx vitest run __tests__/app/data-json.test.ts
```

Expected: FAIL

- [ ] **Step 3: 実装**

`app/data.json/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { fetchTableData } from "@/lib/fetch-table-data";
import { config } from "@/lib/config";

export const revalidate = config.revalidate;

export async function GET() {
  try {
    const data = await fetchTableData();
    return NextResponse.json(data, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
```

- [ ] **Step 4: テスト通過を確認**

```bash
npx vitest run __tests__/app/data-json.test.ts
```

Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add app/data.json/route.ts __tests__/app/data-json.test.ts
git commit -m "feat: /data.json ISRエンドポイントを追加"
```

---

### Task 5: /header.json Route Handler (静的生成)

**Files:**
- Create: `app/header.json/route.ts`
- Create: `__tests__/app/header-json.test.ts`

- [ ] **Step 1: テスト作成**

`__tests__/app/header-json.test.ts`:

```typescript
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
```

- [ ] **Step 2: テスト失敗を確認**

```bash
npx vitest run __tests__/app/header-json.test.ts
```

Expected: FAIL

- [ ] **Step 3: 実装**

`app/header.json/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export const dynamic = "force-static";

export async function GET() {
  const header: Record<string, unknown> = {
    name: config.name,
    symbol: config.symbol,
    data_url: "/data.json",
  };

  if (config.levelOrder.length > 0) {
    header.level_order = config.levelOrder;
  }

  if (config.course.length > 0) {
    header.course = config.course;
  }

  return NextResponse.json(header, {
    headers: { "Content-Type": "application/json" },
  });
}
```

- [ ] **Step 4: テスト通過を確認**

```bash
npx vitest run __tests__/app/header-json.test.ts
```

Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add app/header.json/route.ts __tests__/app/header-json.test.ts
git commit -m "feat: /header.json 静的エンドポイントを追加"
```

---

### Task 6: レイアウト（テーマ、メタタグ、OGP）

**Files:**
- Modify: `app/layout.tsx`
- [ ] **Step 1: layout.tsxを実装**

`app/layout.tsx` を以下の内容に置き換える:

```tsx
import type { Metadata } from "next";
import { config } from "@/lib/config";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: config.name,
  description: config.siteDescription || config.name,
  other: {
    bmstable: "/header.json",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="bmstable" content="/header.json" />
      </head>
      <body>
        <ThemeProvider
          lightTheme={config.lightTheme}
          darkTheme={config.darkTheme}
          darkMode={config.darkMode}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

`ThemeProvider` はまだ存在しないが、Task 7で作成する。ここでは型だけ合わせておく。

- [ ] **Step 2: コミット**

```bash
git add app/layout.tsx
git commit -m "feat: レイアウトにテーマ・メタタグ・OGPを設定"
```

---

### Task 7: ThemeProvider と ThemeSwitcher

**Files:**
- Create: `components/ThemeProvider.tsx`
- Create: `components/ThemeSwitcher.tsx`

- [ ] **Step 1: ThemeProviderを作成**

`components/ThemeProvider.tsx`:

```tsx
"use client";

import { useEffect, useState, createContext, useContext } from "react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  configDarkMode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

interface ThemeProviderProps {
  lightTheme: string;
  darkTheme: string;
  darkMode: ThemeMode;
  children: React.ReactNode;
}

export function ThemeProvider({
  lightTheme,
  darkTheme,
  darkMode,
  children,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(darkMode);
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  function setMode(newMode: ThemeMode) {
    setModeState(newMode);
    if (darkMode === "system") {
      localStorage.setItem("theme-mode", newMode);
    }
  }

  useEffect(() => {
    if (darkMode === "system") {
      const saved = localStorage.getItem("theme-mode") as ThemeMode | null;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        setModeState(saved);
      }
    }
  }, [darkMode]);

  useEffect(() => {
    if (mode === "light") {
      setResolved("light");
      return;
    }
    if (mode === "dark") {
      setResolved("dark");
      return;
    }
    // mode === "system"
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setResolved(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) =>
      setResolved(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const theme = resolved === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, setMode, configDarkMode: darkMode }}>
      <div data-theme={theme} className="min-h-screen">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 2: ThemeSwitcherを作成**

`components/ThemeSwitcher.tsx`:

```tsx
"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeSwitcher() {
  const { mode, setMode, configDarkMode } = useTheme();

  // config.darkMode が "light" または "dark" 固定の場合は表示しない
  if (configDarkMode !== "system") {
    return null;
  }

  return (
    <div className="flex gap-1">
      <button
        className={`btn btn-sm ${mode === "light" ? "btn-active" : "btn-ghost"}`}
        onClick={() => setMode("light")}
        aria-label="ライトモード"
      >
        ☀️
      </button>
      <button
        className={`btn btn-sm ${mode === "system" ? "btn-active" : "btn-ghost"}`}
        onClick={() => setMode("system")}
        aria-label="システム設定に従う"
      >
        💻
      </button>
      <button
        className={`btn btn-sm ${mode === "dark" ? "btn-active" : "btn-ghost"}`}
        onClick={() => setMode("dark")}
        aria-label="ダークモード"
      >
        🌙
      </button>
    </div>
  );
}
```

- [ ] **Step 3: ビルド確認**

```bash
npm run build
```

Expected: ビルド成功（ページはまだダミーでよい）

- [ ] **Step 4: コミット**

```bash
git add components/ThemeProvider.tsx components/ThemeSwitcher.tsx
git commit -m "feat: テーマ切り替え機能を追加（ThemeProvider + ThemeSwitcher）"
```

---

### Task 8: 譜面テーブルコンポーネント

**Files:**
- Create: `components/TableView.tsx`

- [ ] **Step 1: TableViewを作成**

`components/TableView.tsx`:

```tsx
import type { TableEntry } from "@/lib/fetch-table-data";

interface TableViewProps {
  entries: TableEntry[];
  symbol: string;
  levelOrder: string[];
}

function groupByLevel(
  entries: TableEntry[],
  levelOrder: string[]
): Map<string, TableEntry[]> {
  const groups = new Map<string, TableEntry[]>();

  for (const entry of entries) {
    const level = entry.level;
    if (!groups.has(level)) {
      groups.set(level, []);
    }
    groups.get(level)!.push(entry);
  }

  if (levelOrder.length === 0) {
    return groups;
  }

  // levelOrder順に並び替え
  const ordered = new Map<string, TableEntry[]>();
  for (const level of levelOrder) {
    if (groups.has(level)) {
      ordered.set(level, groups.get(level)!);
    }
  }
  // levelOrderに含まれないレベルを末尾に追加
  for (const [level, entries] of groups) {
    if (!ordered.has(level)) {
      ordered.set(level, entries);
    }
  }
  return ordered;
}

const LR2IR_BASE =
  "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5=";

export function TableView({ entries, symbol, levelOrder }: TableViewProps) {
  const grouped = groupByLevel(entries, levelOrder);

  return (
    <table className="table table-zebra w-full">
      <thead>
        <tr>
          <th className="w-[10%]">Level</th>
          <th className="w-[50%]">Title</th>
          <th className="w-[40%]">Artist</th>
        </tr>
      </thead>
      <tbody>
        {Array.from(grouped).map(([level, levelEntries]) => (
          <>
            <tr key={`header-${level}`} className="bg-base-300 text-center">
              <td colSpan={3} className="font-bold">
                {symbol}
                {level} ({levelEntries.length}譜面)
              </td>
            </tr>
            {levelEntries.map((entry) => (
              <tr key={entry.md5}>
                <td>
                  {symbol}
                  {level}
                </td>
                <td>
                  <a
                    href={`${LR2IR_BASE}${entry.md5}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-hover"
                  >
                    {entry.title || "(no title)"}
                  </a>
                </td>
                <td>{entry.artist || ""}</td>
              </tr>
            ))}
          </>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: コミット**

```bash
git add components/TableView.tsx
git commit -m "feat: 譜面テーブル表示コンポーネントを追加"
```

---

### Task 9: トップページ

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: page.tsxを実装**

`app/page.tsx` を以下の内容に置き換える:

```tsx
import { config } from "@/lib/config";
import { fetchTableData } from "@/lib/fetch-table-data";
import { TableView } from "@/components/TableView";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export const revalidate = config.revalidate;

export default async function Page() {
  const entries = await fetchTableData();

  return (
    <div className="min-h-screen">
      <header className="navbar bg-base-200">
        <div className="flex-1">
          <span className="text-xl font-bold px-4">{config.name}</span>
        </div>
        <div className="flex-none px-4">
          <ThemeSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {config.siteDescription && (
          <div className="alert mb-6">
            <p>{config.siteDescription}</p>
          </div>
        )}

        <TableView
          entries={entries}
          symbol={config.symbol}
          levelOrder={config.levelOrder}
        />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: ビルド確認**

```bash
npm run build
```

Expected: ビルド成功

- [ ] **Step 3: dev サーバーで動作確認**

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスし、以下を確認:
- 譜面一覧が表示される（サンプルのGAS URLからデータ取得）
- レベル別セクションに分かれている
- テーマ切り替えボタンが動作する
- `/header.json` にアクセスすると正しいJSONが返る
- `/data.json` にアクセスすると譜面データのJSONが返る

- [ ] **Step 4: コミット**

```bash
git add app/page.tsx
git commit -m "feat: トップページに譜面一覧を表示"
```

---

### Task 10: README作成と最終確認

**Files:**
- Modify: `README.md`

- [ ] **Step 1: READMEを作成**

`README.md` を以下の内容に置き換える:

```markdown
# BMS難易度表テンプレート

BMS難易度表を簡単にホスティングできるテンプレートです。
フォークして設定ファイルを編集するだけで、高速な難易度表サイトが立ち上がります。

## 特徴

- GAS（Google Apps Script）や任意のJSONソースからデータを取得
- ISR（Incremental Static Regeneration）によるキャッシュで常に高速レスポンス
- beatoraja / ELSA 等のBMSクライアントから直接読み込み可能（BMSTable形式互換）
- daisyUI テーマによる外観カスタマイズ
- ダークモード対応（ライト / ダーク / システム設定準拠）

## セットアップ手順

### 1. リポジトリをフォーク

このリポジトリの「Use this template」ボタンまたは「Fork」ボタンから、自分のアカウントにコピーしてください。

### 2. 設定ファイルを編集

`table.config.json` を開き、以下の必須項目を編集してください:

| 項目 | 説明 | 例 |
|---|---|---|
| `name` | 難易度表の名前 | `"My BMS Table"` |
| `symbol` | レベル表記の接頭辞 | `"★"`, `"st"`, `"✡"` |
| `dataUrl` | 譜面データJSONのURL | GASのexec URL、静的JSONのURL等 |

その他のオプション項目:

| 項目 | デフォルト | 説明 |
|---|---|---|
| `revalidate` | `3600` | データの再取得間隔（秒） |
| `siteDescription` | `""` | サイトの説明文 |
| `lightTheme` | `"light"` | ライトモード時のdaisyUIテーマ名 |
| `darkTheme` | `"dark"` | ダークモード時のdaisyUIテーマ名 |
| `darkMode` | `"system"` | `"light"` / `"dark"` / `"system"` |
| `levelOrder` | `[]` | レベルの表示順序（空の場合はデータ出現順） |
| `course` | `[]` | 段位認定データ |

利用可能なテーマの一覧は [daisyUI Themes](https://daisyui.com/docs/themes/) を参照してください。

### 3. Vercelにデプロイ

1. [Vercel](https://vercel.com/) にGitHubアカウントでサインアップ
2. ダッシュボードで「Add New Project」→ フォークしたリポジトリを選択
3. そのまま「Deploy」をクリック

以上で完了です。

### 4. 運用

- GASのスプレッドシートを更新すると、`revalidate` 秒後にサイトに自動反映されます
- `table.config.json` を変更してpushすると、Vercelが自動的に再デプロイします

## BMSクライアントからの読み込み

デプロイされたサイトのURLをBMSクライアントの難易度表URLとして登録してください。

- beatoraja: 難易度表追加で `https://your-site.vercel.app/` を入力
- ELSA: 難易度表設定で同様のURLを入力

`/header.json` と `/data.json` が自動的に配信されます。

## 開発

```bash
npm install
npm run dev
```

## ライセンス

MIT
```

- [ ] **Step 2: 全テスト実行**

```bash
npm test
```

Expected: 全テスト PASS

- [ ] **Step 3: ビルド確認**

```bash
npm run build
```

Expected: ビルド成功

- [ ] **Step 4: コミット**

```bash
git add README.md
git commit -m "docs: READMEにセットアップ手順を記載"
```

---

### Task 11: LICENSEファイル追加と最終整理

**Files:**
- Modify: `package.json`（不要なscriptsやdependenciesの整理）

- [ ] **Step 1: package.jsonの確認と整理**

`package.json` の `name` を `bms-diff-table-template` に変更。不要な設定があれば削除。

- [ ] **Step 2: 全テスト + ビルドの最終確認**

```bash
npm test && npm run build
```

Expected: 全テスト PASS、ビルド成功

- [ ] **Step 3: コミット**

```bash
git add -A
git commit -m "chore: パッケージ情報の整理"
```
