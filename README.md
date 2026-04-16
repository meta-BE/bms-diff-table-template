# BMS難易度表テンプレート

BMS難易度表を簡単にホスティングできるテンプレートです。
フォークして設定ファイルを編集するだけで、高速な難易度表サイトが立ち上がります。

## 特徴

- GAS（Google Apps Script）や任意のJSONソースからデータを取得
- ISR（Incremental Static Regeneration）によるキャッシュで常に高速レスポンス
- beatoraja 等のBMSクライアントから直接読み込み可能（BMSTable形式互換）
- テーブルのカラム構成を自由にカスタマイズ可能（テキスト・リンク・バッジ）
- `description.html` によるリッチな説明文の埋め込み
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
| `columns` | テーブルのカラム定義 | 下記参照 |

その他のオプション項目:

| 項目 | デフォルト | 説明 |
|---|---|---|
| `siteDescription` | `""` | サイトの説明文 |
| `lightTheme` | `"light"` | ライトモード時のdaisyUIテーマ名 |
| `darkTheme` | `"dark"` | ダークモード時のdaisyUIテーマ名 |
| `darkMode` | `"system"` | `"light"` / `"dark"` / `"system"` |
| `levelOrder` | `[]` | レベルの表示順序（空の場合はデータ出現順） |
| `course` | `[]` | 段位認定データ |

利用可能なテーマの一覧は [daisyUI Themes](https://daisyui.com/docs/themes/) を参照してください。

#### カラム定義（`columns`）

`columns` にはテーブルに表示するカラムを配列で定義します。レベルカラムは常に先頭に自動表示されるため、定義不要です。

カラムには3つのタイプがあります:

| タイプ | 説明 | 用途の例 |
|---|---|---|
| `text` | プロパティの値をそのまま表示 | コメント、ノーツ数、アーティスト名 |
| `link` | プロパティの値をテキストにしてリンク化 | 曲名→LR2IR、アーティスト名→BMS配布ページ |
| `badge` | 固定テキストのリンクボタン | DLボタン、再生ボタン |

<details>
<summary>カラム定義の詳細</summary>

##### 共通フィールド

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `header` | 文字列 | Yes | カラムヘッダーの表示名 |
| `type` | `"text"` / `"link"` / `"badge"` | Yes | カラムタイプ |
| `width` | 文字列 | No | 幅指定（`"50%"` や `"100px"`）。未指定なら均等分割 |

##### `text` タイプ

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `property` | 文字列 | Yes | JSONデータのプロパティ名 |

##### `link` タイプ

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `property` | 文字列 | Yes | 表示テキストに使うプロパティ名 |
| `url` | 文字列 | Yes | URLテンプレート |

##### `badge` タイプ

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `label` | 文字列 | Yes | 固定表示テキスト（例: `"DL"`, `"▶"`） |
| `url` | 文字列 | Yes | URLテンプレート |

##### URLテンプレート

`url` フィールドでは `{{プロパティ名}}` の記法でJSONデータの値を埋め込めます:

```
# 固定URLにプロパティ値を埋め込む
"url": "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5={{md5}}"

# JSONデータのURL値をそのまま使う
"url": "{{url_diff}}"
```

##### 設定例

```json
{
  "name": "My BMS Table",
  "symbol": "★",
  "dataUrl": "https://script.google.com/macros/s/.../exec",
  "columns": [
    { "header": "Title", "type": "link", "property": "title", "url": "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5={{md5}}", "width": "40%" },
    { "header": "Artist", "type": "link", "property": "artist", "url": "{{url}}", "width": "25%" },
    { "header": "Chart", "type": "badge", "label": "DL", "url": "{{url_diff}}" },
    { "header": "Preview", "type": "badge", "label": "▶", "url": "{{url_youtube}}" },
    { "header": "Comment", "type": "text", "property": "comment", "width": "20%" }
  ]
}
```

</details>

<details>
<summary>description.html による説明文のカスタマイズ</summary>

リポジトリのルートに `description.html` を配置すると、テーブルの上部にリッチな説明文を表示できます。

- HTMLフラグメント（`<html>` や `<body>` タグ不要）を直接記述します
- リンク（`<a>` タグ）には `target="_blank"` と `rel="noopener noreferrer"` が自動的に付加されます
- ファイルが存在しない場合は説明文エリア自体が非表示になります

例:

```html
<h3>難易度表概要</h3>
イージー基準、基本的にハード難<br />
連絡先: <a href="https://twitter.com/your_account">@your_account</a>
```

</details>

### 3. Vercelにデプロイ

1. [Vercel](https://vercel.com/) にGitHubアカウントでサインアップ
2. ダッシュボードで「Add New Project」→ フォークしたリポジトリを選択
3. そのまま「Deploy」をクリック

以上で完了です。

### 4. 運用

- GASのスプレッドシートを更新すると、約5分後にサイトに自動反映されます
- `table.config.json` を変更してpushすると、Vercelが自動的に再デプロイします

## BMSクライアントからの読み込み

デプロイされたサイトのURLをBMSクライアントの難易度表URLとして登録してください。

- beatoraja: 難易度表追加で `https://your-site.vercel.app/` を入力

`/header.json` と `/data.json` が自動的に配信されます。

## 開発

```bash
npm install
npm run dev
```

## ライセンス

MIT
