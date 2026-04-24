# カラム定義

`table.config.json` の `columns` にテーブルに表示するカラムを配列で定義します。

## カラムタイプ

カラムには4つのタイプがあります:

| タイプ | 説明 | 用途の例 |
|---|---|---|
| `level` | レベル値（symbol + level）を表示 | 難易度レベル表示 |
| `text` | プロパティの値をそのまま表示 | コメント、ノーツ数、アーティスト名 |
| `link` | プロパティの値をテキストにしてリンク化 | 曲名→LR2IR、アーティスト名→BMS配布ページ |
| `badge` | 固定テキストのリンクボタン | DLボタン、再生ボタン |

## 共通フィールド

すべてのタイプで使用できるフィールドです。必須でないものはスタイルに関わる設定のため、なくても動作には問題ありません。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `header` | 文字列 | Yes | カラムヘッダーの表示名 |
| `type` | `"level"` / `"text"` / `"link"` / `"badge"` | Yes | カラムタイプ |
| `width` | 文字列 | No | 幅指定（`"50%"` や `"100px"`）。未指定なら均等分割 |
| `align` | `"left"` / `"center"` / `"right"` | No | セル内のテキスト配置。未指定なら `"left"` |
| `nowrap` | `true` / `false` | No | `true` にするとセル内テキストの折り返しを禁止。日付など固定長の短い値に有効 |
| `ellipsis` | `true` / `false` | No | `true` にするとテキストがセル幅を超えた場合に `…` で省略表示。省略時のみホバー/タップでツールチップに全文表示 |

> `align` はデータセルのみに適用されます。ヘッダー行は常に左揃えです。
>
> `ellipsis` は暗黙的に折り返し禁止も適用するため、`nowrap` の併用は不要です。

## `level` タイプ

レベル値（symbol + level）を表示します。`columns` 配列内の任意の位置に配置できます。
`level` タイプが `columns` に含まれない場合、レベル列は表示されません。

```json
{ "header": "Lv", "type": "level" }
```

## `text` タイプ

プロパティの値をそのまま表示します。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `property` | 文字列 | Yes | JSONデータのプロパティ名 |

```json
{ "header": "Comment", "type": "text", "property": "comment", "width": "20%" }
```

## `link` タイプ

プロパティの値を表示テキストにし、URLテンプレートで生成したリンクを付けます。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `property` | 文字列 | Yes | 表示テキストに使うプロパティ名 |
| `url` | 文字列 | Yes | URLテンプレート |

```json
{ "header": "Title", "type": "link", "property": "title", "url": "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5={{md5}}", "width": "40%" }
```

## `badge` タイプ

固定テキストのリンクボタンを表示します。URLが解決できない場合はバッジ自体が非表示になります。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `label` | 文字列 | Yes | 固定表示テキスト（例: `"DL"`, `"▶"`） |
| `url` | 文字列 | Yes | URLテンプレート |

```json
{ "header": "Chart", "type": "badge", "label": "DL", "url": "{{url_diff}}" }
```

## URLテンプレート

`link` と `badge` の `url` フィールドでは、`{{プロパティ名}}` の記法でJSONデータの値を埋め込めます。

```
# 固定URLにプロパティ値を埋め込む
"url": "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5={{md5}}"

# JSONデータのURL値をそのまま使う
"url": "{{url_diff}}"
```

## 設定例

```json
{
  "name": "My BMS Table",
  "symbol": "★",
  "dataUrl": "https://script.google.com/macros/s/.../exec",
  "columns": [
    { "header": "Lv", "type": "level" },
    { "header": "Title", "type": "link", "property": "title", "url": "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5={{md5}}", "width": "40%" },
    { "header": "Artist", "type": "link", "property": "artist", "url": "{{url}}", "width": "25%" },
    { "header": "Chart", "type": "badge", "label": "DL", "url": "{{url_diff}}", "align": "center" },
    { "header": "Preview", "type": "badge", "label": "▶", "url": "{{url_youtube}}", "align": "center" },
    { "header": "Comment", "type": "text", "property": "comment", "width": "20%", "ellipsis": true },
    { "header": "Rating", "type": "text", "property": "rating", "align": "center" },
    { "header": "Published", "type": "text", "property": "published_at", "align": "center", "nowrap": true }
  ]
}
```
