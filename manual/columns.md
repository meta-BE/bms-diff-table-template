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

> `align` はデータセルのみに適用されます。ヘッダー行は常に中央揃えです。
>
> `ellipsis` は暗黙的に折り返し禁止も適用するため、`nowrap` の併用は不要です。

## フィルタ（`filter`）

`level` / `text` / `link` タイプのカラムに `filter` を指定すると、カラムヘッダーに ▾ ボタンが表示されます。閲覧者はボタンから値を選んで（複数選択可）、表を絞り込めます。

- 選んだ値のどれかに一致する行が表示されます
- 同時に絞り込めるのは1カラムだけです。別のカラムで値を選ぶと、それまでの選択は解除されます
- 難易度ごとの見出し「`★1 (n譜面)`」の件数は、絞り込み後の件数になります。0件になった難易度は、見出しだけが表示されます
- 絞り込みはブラウザ内で行われ、サーバーへの通信は発生しません。ページを再読み込みすると解除されます

| `filter` の値 | 意味 |
|---|---|
| 省略 | フィルタなし |
| `true` | カラム自身の値で絞り込む |
| `{ "property": "キー名" }` | 同じ行の別のキーの値で絞り込む（例: 公開日のカラムを公開年で絞り込む） |
| `{ "order": "desc" }` | 選択肢を降順に並べる（既定は `"asc"`） |

`property` と `order` は同時に指定できます。

### 絞り込みに使う値

| カラムタイプ | `property` を省略したとき |
|---|---|
| `level` | レベル値。選択肢は表の難易度の並び（`levelOrder`）と同じ順に並び、ラベルは `symbol + level`（例: `★8`）になる |
| `text` / `link` | そのカラムの `property` の値 |
| `badge` | 使用できません（指定しても無視され、ブラウザのコンソールに警告が出ます） |

- 選択肢は昇順に並びます。数字は数値として比べます（`2` は `10` より前）
- 値が空の行は「（空）」という選択肢にまとめられ、並び順に関係なく最後に表示されます

### 設定例

```json
{ "header": "Rating", "type": "text", "property": "rating", "align": "center", "filter": true },
{ "header": "Published", "type": "text", "property": "published_at", "nowrap": true,
  "filter": { "property": "published_year", "order": "desc" } }
```

> フィルタのボタンは、Popover API に対応したブラウザでのみ表示されます。対応していないブラウザでは、ボタンが表示されないだけで、表は通常どおり使えます。

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

> ローカルに同梱した zip 等を配信・リンクする方法は [ファイル配信](file-distribution.md) を参照してください。

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
    { "header": "Rating", "type": "text", "property": "rating", "align": "center", "filter": true },
    { "header": "Published", "type": "text", "property": "published_at", "align": "center", "nowrap": true, "filter": { "property": "published_year", "order": "desc" } }
  ]
}
```
