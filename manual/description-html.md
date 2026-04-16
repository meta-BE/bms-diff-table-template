# 説明文のカスタマイズ（description.html）

リポジトリのルートの `description.html` を編集すると、テーブルの上部にリッチな説明文を表示できます。

## 基本的な使い方

1. リポジトリのルート（`table.config.json` と同じ階層）に `description.html` を作成
2. HTMLフラグメントを記述（`<html>` や `<body>` タグは不要）
3. pushすると自動的にサイトに反映されます

ファイルが存在しない場合は、`table.config.json` の `siteDescription` が設定されていればその平文が表示されます。どちらも未設定の場合は説明文エリア自体が非表示になります。

## 記述ルール

`<h1>`, `<ul>`, `<a>`, `<br />` など基本的なHTMLタグが使えます。

## 例

```html
<h3>難易度表概要</h3>
イージー基準、基本的にハード難<br />
連絡先: <a href="https://twitter.com/your_account">@your_account</a>

<h3>参考リンク</h3>
<ul>
    <li><a href="https://example.com">関連サイト</a></li>
</ul>
```
