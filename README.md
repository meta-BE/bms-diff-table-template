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
