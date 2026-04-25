# セットアップ手順

## 1. リポジトリをフォーク

このリポジトリの「Use this template」ボタンまたは「Fork」ボタンから、自分のアカウントにコピーしてください。

## 2. 設定ファイルを編集

`table.config.json` にサンプル設定が入っています。以下の必須項目を自分の難易度表に合わせて書き換えてください:

| 項目        | 説明            | 例                        |
|-----------|---------------|--------------------------|
| `name`    | 難易度表の名前       | `"My BMS Table"`         |
| `symbol`  | レベル表記の接頭辞     | `"★"`, `"st"`, `"✡"`     |
| `dataUrl` | 譜面データJSONのURL | GASのexec URL、静的JSONのURL等 |
| `columns` | テーブルのカラム定義    | [カラム定義](columns.md)を参照   |

Googleスプレッドシートからデータを配信する方法は [GASによる難易度表データ配信](gas-setup.md) を参照してください。
既に利用されている方は、GASのURLをdataUrlにセットするだけでOKです。

その他のオプション項目:

| 項目                | デフォルト      | 説明                                             |
|-------------------|------------|------------------------------------------------|
| `siteDescription` | `""`       | サイトの説明文（HTMLの`<meta name="description">`にも使用される） |
| `lightTheme`      | `"light"`  | ライトモード時のdaisyUIテーマ名                            |
| `darkTheme`       | `"dark"`   | ダークモード時のdaisyUIテーマ名                            |
| `darkMode`        | `"system"` | どのテーマを利用するか(`"light"` / `"dark"` / `"system"`) |
| `levelOrder`      | `[]`       | レベルの表示順序（空の場合はデータ出現順）                          |
| `course`          | `[]`       | 段位認定データ                                        |

利用可能なテーマの一覧は [daisyUI Themes](https://daisyui.com/docs/themes/) を参照してください。

説明文をカスタマイズしたい場合は [description.html の使い方](description-html.md) を参照してください。

サイトのアイコン（favicon）を変更したい場合は、`app/icon.svg` を差し替えてください。`icon.png`、`icon.ico`、`favicon.ico` も使用できます。

## 3. Vercelにデプロイ

1. [Vercel](https://vercel.com/) にGitHubアカウントでサインアップ
2. ダッシュボードで「Add New Project」→ フォークしたリポジトリを選択
3. そのまま「Deploy」をクリック

以上で完了です。

## 4. 運用

- GASのスプレッドシートを更新すると、約5分後にサイトに自動反映されます
- `table.config.json` を変更してpushすると、Vercelが自動的に再デプロイします

## BMSクライアントからの読み込み

デプロイされたサイトのURLをBMSクライアントの難易度表URLとして登録してください。

- beatoraja: 難易度表追加で `https://your-site.vercel.app/` を入力

`/header.json` と `/data.json` が自動的に配信されます。
