# カラム定義の自由化 設計書

## 概要

`table.config.json` にカラム定義（`columns`）を追加し、テーブルの表示カラムをユーザーが自由に設定できるようにする。ヘッダー名、表示するJSONプロパティ、リンクの有無・URL組み立てパターン、カラム幅を設定可能にする。

## 背景

現状の `TableView.tsx` は Level / Title / Artist の3カラム固定で、Title には LR2IR へのリンクがハードコードされている。BMS難易度表は表ごとにカラム構成が大きく異なる（差分DLリンク、YouTube再生、譜面画像ビューア、ノーツ数、コメントなど）ため、設定ファイルで柔軟に定義できる必要がある。

### 参考サイトのカラム構成

- **meta自作差分一覧**: Level, Title(LR2IRリンク), Artist(BMSリンク), Chart(DLリンク), Preview(YouTubeリンク), Comment, Rating, Published
- **Solomon**: Level, Title(LR2IRリンク), SongArtist, Charter, ChartView(譜面画像リンク)
- **Dystopia**: LV, 譜面(譜面画像リンク), Title(LR2IRリンク), Artist(BMSリンク), 差分(DLリンク), Notes, Total, Comment

## カラム定義スキーマ

### 配置

`table.config.json` の `columns` フィールドに配列で定義する。

### レベルカラム

`level` カラムは常にテーブルの先頭に自動表示される。`symbol` + `level` の結合表示、グルーピングのキーとして特別扱いを維持する。`columns` にレベルを定義する必要はない。

### `columns` 未定義時

レベルカラムのみ表示される。

### 共通フィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `header` | string | Yes | カラムヘッダーの表示名 |
| `type` | `"text"` \| `"link"` \| `"badge"` | Yes | カラムタイプ |
| `width` | string | No | 幅指定（`"50%"` or `"100px"`）。未指定なら残りスペースを均等分割 |

### type 別フィールド

#### `text` — プロパティ値をそのまま表示

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `property` | string | Yes | JSONデータのプロパティ名 |

#### `link` — プロパティ値を表示テキストにしてリンク化

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `property` | string | Yes | 表示テキストに使うプロパティ名 |
| `url` | string | Yes | URLテンプレート |

#### `badge` — 固定テキストでリンク表示

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `label` | string | Yes | 固定表示テキスト（例: `"DL"`, `"▶"`, `"■"`） |
| `url` | string | Yes | URLテンプレート |

### URLテンプレート

`{{property}}` 記法でJSONデータのプロパティ値を埋め込む。

- テンプレートURL + プロパティ埋め込み: `"http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5={{md5}}"`
- JSONプロパティ値をそのままURLとして使用: `"{{url_diff}}"`
- 複数プレースホルダー対応: `"http://example.com?a={{propA}}&b={{propB}}"`

### フォールバック挙動

- `text` / `link`: `property` の値が空・未定義 → 空文字列を表示
- `link`: URL内の `{{property}}` が空・未定義 → リンクなしのテキスト表示にフォールバック
- `badge`: URL内の `{{property}}` が空・未定義 → バッジ自体を非表示

## 設定例

meta自作差分一覧相当の設定:

```json
{
  "name": "meta自作差分一覧",
  "symbol": "Σ",
  "dataUrl": "https://bms.congenial-spirits.com/data.json",
  "revalidate": 3600,
  "columns": [
    { "header": "Title", "type": "link", "property": "title", "url": "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5={{md5}}", "width": "40%" },
    { "header": "Artist", "type": "link", "property": "artist", "url": "{{url}}", "width": "25%" },
    { "header": "Chart", "type": "badge", "label": "DL", "url": "{{url_diff}}" },
    { "header": "Preview", "type": "badge", "label": "▶", "url": "{{url_youtube}}" },
    { "header": "Comment", "type": "text", "property": "comment", "width": "20%" },
    { "header": "Rating", "type": "text", "property": "rating" },
    { "header": "Published", "type": "text", "property": "published" }
  ]
}
```

Solomon相当の設定:

```json
{
  "columns": [
    { "header": "Title", "type": "link", "property": "title", "url": "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5={{md5}}", "width": "40%" },
    { "header": "SongArtist", "type": "text", "property": "song_artist", "width": "25%" },
    { "header": "Charter", "type": "text", "property": "charter", "width": "25%" },
    { "header": "ChartView", "type": "badge", "label": "譜面画像", "url": "https://bms-score-viewer.pages.dev/view?md5={{md5}}" }
  ]
}
```

## 影響範囲と変更方針

### 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `lib/config.ts` | `ColumnDef` 型の追加、`TableConfig` に `columns` フィールド追加 |
| `components/TableView.tsx` | カラム定義に基づく動的レンダリング、`LR2IR_BASE` 定数の削除、CSS Gridレイアウト化 |
| `scripts/generate-css.mjs` | カラム幅から CSS Grid の `grid-template-columns` を生成 |
| `table.config.json` | `columns` フィールドの追加 |
| `lib/fetch-table-data.ts` | `TableEntry` の `title` / `artist` の特別扱いを削除（`md5` / `level` + `[key: string]: unknown` のみに） |

### テンプレートURL展開ロジック

`lib/` にテンプレート展開ユーティリティ関数を追加する。

```
resolveTemplate("http://example.com?md5={{md5}}", { md5: "abc123" })
→ "http://example.com?md5=abc123"
```

### CSS Grid化

`<table>` から `<div>` ベースの CSS Grid レイアウトに変更する。`generate-css.mjs` がカラム定義から `grid-template-columns` を生成する。

- `"40%"` → `40fr`
- `"100px"` → `100px`
- 幅未指定 → `1fr`

### テスト

- 既存テストはカラム定義に合わせて更新
- テンプレートURL展開のユーティリティに対してユニットテスト追加
