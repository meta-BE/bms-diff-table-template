# BMS難易度表テンプレートプロジェクト設計書

## 概要

BMS難易度表を簡単にホスティングできるテンプレートリポジトリ。
フォークして `table.config.json` を編集し、Vercelに接続するだけで、ISRによる高速な難易度表サイトが立ち上がる。

### 解決する課題

現在主流のGAS（Google Apps Script）直接エンドポイント方式は、レスポンスに5秒以上かかることがある。
既存テンプレート（ladymade-star/BMS-Table-Template）もGASから動的にHTMLを生成するため同様に遅い。
本テンプレートはVercelのISRでGASレスポンスをキャッシュし、常に高速なレスポンスを返す。

### 対象ユーザー

プログラミング知識のないBMS難易度表管理者。設定ファイル（JSON）の編集とVercelダッシュボードの操作のみで運用可能。

## リポジトリ

`~/src/github.com/meta-BE/bms-diff-table-template`

GitHub: `meta-BE/bms-diff-table-template`（テンプレートリポジトリとして公開）

## 技術スタック

| 項目 | 選定 | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 15.3.x |
| UIライブラリ | Tailwind CSS + daisyUI | Tailwind 4.2.x / daisyUI 5.5.x |
| 言語 | TypeScript | 5.x |
| ランタイム | React | 19.x |
| デプロイ先 | Vercel | - |
| パッケージマネージャ | npm | - |

## 設定ファイル

### `table.config.json`

ユーザーが編集する唯一のファイル。

```json
{
  "name": "My BMS Table",
  "symbol": "★",
  "dataUrl": "https://script.google.com/macros/s/.../exec",
  "revalidate": 3600,
  "siteDescription": "難易度表の説明文",
  "lightTheme": "light",
  "darkTheme": "dark",
  "darkMode": "system",
  "levelOrder": ["1", "2", "3"],
  "course": [
    {
      "name": "段位名",
      "constraint": ["grade_random", "gauge_lr2", "", ""],
      "md5": ["hash1", "hash2", "hash3", "hash4"]
    }
  ]
}
```

| フィールド | 必須 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `name` | 必須 | string | - | 難易度表名 |
| `symbol` | 必須 | string | - | レベル表記の接頭辞（`"★"`, `"st"` 等） |
| `dataUrl` | 必須 | string | - | 譜面データJSONのURL（GAS exec URL、静的JSON URL等） |
| `revalidate` | 任意 | number | `3600` | ISR再検証間隔（秒） |
| `siteDescription` | 任意 | string | `""` | サイトの説明文（OGP、ページ内表示） |
| `lightTheme` | 任意 | string | `"light"` | ライトモード時のdaisyUIテーマ名 |
| `darkTheme` | 任意 | string | `"dark"` | ダークモード時のdaisyUIテーマ名 |
| `darkMode` | 任意 | `"light"` \| `"dark"` \| `"system"` | `"system"` | ダークモード設定 |
| `levelOrder` | 任意 | string[] | データ出現順 | レベルの表示順序 |
| `course` | 任意 | CourseEntry[] | `[]` | 段位認定データ |

### CourseEntry

```typescript
interface CourseEntry {
  name: string;           // 段位名
  constraint: string[];   // 制約条件
  md5: string[];          // 譜面MD5配列
}
```

### 型定義（内部用）

`lib/config.ts` で `table.config.json` をimportし、型チェックとデフォルト値の適用を行う。

```typescript
import configJson from "../table.config.json";

interface TableConfig {
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

export const config: TableConfig = {
  revalidate: 3600,
  siteDescription: "",
  lightTheme: "light",
  darkTheme: "dark",
  darkMode: "system",
  levelOrder: [],
  course: [],
  ...configJson,
};
```

## ディレクトリ構成

```
bms-diff-table-template/
├── table.config.json        # ユーザーが編集する唯一の設定ファイル
├── app/
│   ├── layout.tsx           # テーマ適用、bmstableメタタグ、OGP
│   ├── page.tsx             # 譜面一覧ページ（ISR）
│   ├── header.json/
│   │   └── route.ts         # header.json エンドポイント（静的生成）
│   └── data.json/
│       └── route.ts         # data.json エンドポイント（ISR）
├── components/
│   ├── TableView.tsx        # 譜面テーブル表示
│   └── ThemeSwitcher.tsx    # ダークモード切り替えUI
├── lib/
│   ├── config.ts            # table.config.json の読み込みと型付け
│   └── fetch-table-data.ts  # データfetch共通ロジック
├── scripts/
│   └── generate-css.mjs     # table.config.jsonからapp/globals.cssを自動生成
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md                # セットアップ手順
```

## データフロー

```
table.config.json
  ↓ (設定値を参照)

GET /data.json  ← ISR (revalidate: N秒)
  → config.dataUrl にfetch (redirect: "follow") → JSON返却（キャッシュ済み）

GET /header.json ← 静的生成 (force-static)
  → { name, symbol, data_url: "/data.json", level_order?, course? }

GET / (Webページ) ← ISR
  → Server Component が config.dataUrl からfetch → 譜面一覧を描画

beatoraja / ELSA
  → /header.json → data_url="/data.json" → 常に高速レスポンス

ブラウザ
  → / → 譜面一覧ページ（常に高速）
```

## エンドポイント詳細

### `GET /header.json`

BMSTable形式のヘッダー。beatoraja/ELSAが最初に取得する。

```json
{
  "name": "My BMS Table",
  "symbol": "★",
  "data_url": "/data.json"
}
```

- `table.config.json` の `name`, `symbol` から生成
- `data_url` は常に自サイトの `/data.json` を指す（元のGAS URLではない）
- `levelOrder` が設定されていれば `level_order` として含める
- `course` が設定されていれば `course` として含める
- `force-static` で静的生成。設定変更時はデプロイで反映

### `GET /data.json`

譜面データ配列。ISRでキャッシュ。

- `config.dataUrl` にfetch（`redirect: "follow"` でGASの302リダイレクトにも対応）
- `export const revalidate` で ISR間隔を設定
- レスポンスはGAS/ソースからのJSONをそのままパススルー
- Content-Type: `application/json`

### `GET /` (トップページ)

譜面一覧のWebページ。Server Component + ISR。

- `config.dataUrl` から同じデータをfetch（Vercel内でISRキャッシュが共有される）
- レベル別セクションに分けて表示
- `levelOrder` 指定時はその順序、未指定時はデータ出現順
- 各譜面行の表示カラム: Level, Title, Artist
- 各譜面にLR2IR検索リンク（md5ベース）
- `siteDescription` をページ上部に表示

## テーマとダークモード

### CSS設定 (`app/globals.css`)

`app/globals.css` はビルド前に `scripts/generate-css.mjs` によって `table.config.json` から自動生成される。

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

`themes` には `table.config.json` の `lightTheme` と `darkTheme` のみが含まれ、不要なテーマのCSSは出力されない。

### CSS自動生成 (`scripts/generate-css.mjs`)

`prebuild` / `predev` スクリプトで実行され、`table.config.json` から `app/globals.css` を生成する。ユーザーがCSSを直接編集する必要はない。

### `layout.tsx` でのテーマ適用

- `darkMode: "system"` → OS設定に追従（`--default` + `--prefersdark` 相当をJSで実装）
- `darkMode: "light"` → 常に `data-theme={config.lightTheme}`
- `darkMode: "dark"` → 常に `data-theme={config.darkTheme}`

### `ThemeSwitcher` コンポーネント

- `darkMode: "system"` の場合のみUIに表示
- ライト / ダーク / システム追従の3択トグル
- 選択状態は `localStorage` に保存
- Client Componentとして実装

### daisyUIのテーマ一覧

CSSにはdaisyUIの全テーマを含める（ユーザーが `table.config.json` で任意のテーマ名を指定できるようにするため）。

## Webページ（トップページ）の仕様

### レイアウト

- ヘッダー: 難易度表名（`config.name`）
- 説明文エリア: `config.siteDescription`（設定時のみ表示）
- 譜面一覧テーブル: レベル別セクション

### 譜面テーブル

既存テンプレート（ladymade-star/BMS-Table-Template）に準拠した構成:

- レベル区切りヘッダー: `{symbol}{level} (N譜面)` 形式
- カラム: Level, Title, Artist
- Title に LR2IR検索リンク (`http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5={md5}`)
- daisyUIの `table` コンポーネントを使用（`table-zebra` でストライプ表示）

### 将来の拡張ポイント（スコープ外）

- 検索・フィルタ機能
- JSONのキーからのカラム自動生成
- ダウンロードリンク表示
- 段位認定表示ページ

## ユーザーのセットアップ手順（READMEに記載）

1. このリポジトリをフォーク（またはGitHubの「Use this template」）
2. `table.config.json` を編集（`name`, `symbol`, `dataUrl` を自分の難易度表に合わせる）
3. Vercelにサインアップ（GitHubアカウントで可能）
4. VercelダッシュボードでフォークしたリポジトリをImport
5. デプロイ完了。以降、`table.config.json` を変更してpushすると自動デプロイ

GASのスプレッドシートを更新した場合は、ISRにより `revalidate` 秒後に自動反映される。
