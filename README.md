# BMS難易度表テンプレート

BMS難易度表を簡単にホスティングできるテンプレートです。
フォークして設定ファイルを編集するだけで、高速な難易度表サイトが立ち上がります。

## 特徴

- GAS（Google Apps Script）や任意のJSONソースからデータを取得
- ISR（Incremental Static Regeneration）によるキャッシュで常に高速レスポンス
- beatoraja 等のBMSクライアントから直接読み込み可能（BMSTable形式互換）
- テーブルのカラム構成を自由にカスタマイズ可能（テキスト・リンク・バッジ・レベル）
- `description.html` によるリッチな説明文の埋め込み
- daisyUI テーマによる外観カスタマイズ
- ダークモード対応（ライト / ダーク / システム設定準拠）

## マニュアル

- [セットアップ手順](manual/setup.md) — フォークからデプロイまで
- [カラム定義](manual/columns.md) — テーブルカラムの設定方法
- [GASによるデータ配信](manual/gas-setup.md) — スプレッドシートからJSONを配信する方法
- [説明文のカスタマイズ](manual/description-html.md) — description.html の使い方

## 開発

```bash
npm install
npm run dev
```

## TODO
- 説明文埋め込み機能（description.html）のマークダウン対応
- favicon.ico, metaタグ

## ライセンス

MIT
