# GAS（Google Apps Script）によるデータ配信

Googleスプレッドシートで譜面データを管理し、GASでJSON APIとして公開する方法です。

## 参考サイト

- [スプレッドシートを使って難易度表を管理する (Hex bms)](https://bms.hexlataia.xyz/tips/googleapps.html)
- [自分オリジナルのBMS難易度表を作って公開しよう【無料・Webブラウザ上で完結】 (ladymade-star)](https://ladymade-star.hateblo.jp/entry/2021/08/18/122653)

## 1. スプレッドシートを作成

Googleスプレッドシートを新規作成し、1行目にカラム名、2行目以降にデータを入力します。

1行目のカラム名がそのままJSONのキーになります。

| level | title | artist | md5 | comment | url_diff |
|---|---|---|---|---|---|
| 1 | 星の器～STAR OF ANDROMEDA (ANOTHER) | ZUN (Arr.sun3) | f8dcdfe... | コメント | https://... |
| 2 | Air -GOD- | SHIKI / black train | 751738d... | コメント | https://... |

- `level`, `title`, `artist`, `md5` は基本的なカラムです
- それ以外のカラムは自由に追加できます（`url_diff`, `url_youtube`, `comment` など）
- 追加したカラムは自動的にJSONに含まれ、`table.config.json` の [カラム定義](columns.md) で表示に利用できます

## 2. GASスクリプトを作成

スプレッドシートのメニューから「拡張機能」→「Apps Script」を開き、以下のスクリプトを貼り付けます。

```javascript
function getSheetAsObj(id, sheet_name) {
  var sheet = SpreadsheetApp.openById(id).getSheetByName(sheet_name);
  var rows = sheet.getDataRange().getValues();
  var keys = rows.splice(0, 1)[0];
  return rows.map(function(row) {
    var obj = {}
    row.map(function(item, index) {
      obj[keys[index]] = String(item);
    });
    return obj;
  });
}

function doGet() {
  var obj = getSheetAsObj('スプレッドシートのID', 'シート名');
  return ContentService
    .createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}
```

`doGet()` 内の2つの値を自分の環境に合わせて書き換えてください:

- **スプレッドシートのID**: スプレッドシートのURLの `https://docs.google.com/spreadsheets/d/ここの部分/edit` にあたる文字列
- **シート名**: スプレッドシート下部のタブに表示されている名前（例: `シート1`）

## 3. ウェブアプリとしてデプロイ

1. Apps Script画面右上の「デプロイ」→「新しいデプロイ」
2. 種類: 「ウェブアプリ」を選択
3. 実行ユーザー: **自分**
4. アクセスできるユーザー: **全員**
5. 「デプロイ」をクリック

表示されるURLが `table.config.json` の `dataUrl` に設定する値です。

## 注意事項

- スプレッドシートのデータを更新すると、即座にJSON APIに反映されます（本テンプレートのISRキャッシュにより、サイトへの反映は最大約5分後）
- GASのスクリプト自体を変更した場合は、再デプロイが必要です
