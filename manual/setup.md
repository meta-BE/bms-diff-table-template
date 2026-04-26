# セットアップ手順

## 0. アカウントの用意

GitHub, Vercelのアカウントを用意してください。いずれも無料プラン（Free, Hobby）で問題ありません。  
[GitHub](https://github.com/)  
[Vercel](https://vercel.com/)  

## 1. リポジトリをフォーク

このリポジトリの「Use this template」ボタンまたは「Fork」ボタンから、自分のアカウントにコピーしてください。

## 2. 設定ファイルを編集

`table.config.json` にサンプル設定が入っています。以下の必須項目を自分の難易度表に合わせて書き換えてください。

| 項目        | 説明            | 例                        |
|-----------|---------------|--------------------------|
| `name`    | 難易度表の名前       | `"My BMS Table"`         |
| `symbol`  | レベル表記の接頭辞     | `"★"`, `"st"`, `"✡"`     |
| `dataUrl` | 譜面データJSONのURL | GASのexec URL、静的JSONのURL等 |
| `columns` | テーブルのカラム定義    | [カラム定義](columns.md)を参照   |

Googleスプレッドシートからデータを配信する方法は [GASによる難易度表データ配信](gas-setup.md) を参照してください。
既に利用されている方は、GASのURLをdataUrlにセットするだけでOKです。

その他のオプション項目は以下のようになります。

| 項目                    | デフォルト      | 説明                                               |
|-----------------------|------------|--------------------------------------------------|
| `siteDescription`     | `""`       | サイトの説明文（HTMLの`<meta name="description">`にも使用される） |
| `lightTheme`          | `"light"`  | ライトモード時のdaisyUIテーマ名                              |
| `darkTheme`           | `"dark"`   | ダークモード時のdaisyUIテーマ名                              |
| `darkMode`            | `"system"` | どのテーマを利用するか(`"light"` / `"dark"` / `"system"`)   |
| `levelOrder`          | `[]`       | レベルの表示順序（空の場合はデータ出現順）                            |
| `course`              | `[]`       | 段位認定データ                                          |
| `tableStyle`          |            | テーブル全体のスタイル設定（省略時は全てデフォルト値が適用される）                |
| `tableStyle.maxWidth` | `1536`     | テーブルの最大幅（px）                                     |
| `tableStyle.stripe`   | `false`    | ゼブラストライプの有効/無効                                   |
| `tableStyle.hover`    | `false`    | ホバー時の色変更の有効/無効                                   |

利用可能なテーマの一覧は [daisyUI Themes](https://daisyui.com/docs/themes/) を参照してください。

説明文をカスタマイズしたい場合は [description.html の使い方](description-html.md) を参照してください。

サイトのアイコン（favicon）を変更したい場合は、`app/icon.svg` を差し替えてください。`icon.png`、`icon.ico`、`favicon.ico` も使用できます。

## 3. Vercelにデプロイ

1. [Vercel](https://vercel.com/) にGitHubアカウントでサインアップ
2. ダッシュボードで「Add New Project」→ フォークしたリポジトリを選択
3. 「Project Name」にプロジェクト名を入力 → この名前がサイトのURLになります（例: `my-bms-table` → `my-bms-table.vercel.app`）
4. そのまま「Deploy」をクリック

以上で完了です。

## 4. 運用

- GASのスプレッドシートを更新すると、最大5分後にサイトに自動反映されます
  - 一度デプロイが完了すれば、表の内容の更新についてはスプレッドシートの更新のみで行うことができます
- `table.config.json` を変更してpushすると、Vercelが自動的に再デプロイします
  - 難易度表情報そのものの更新、サイト説明文の更新などを行う際は再度GitHub上でコミット・プッシュを行なってください

## BMSプレイヤーからの読み込み

デプロイされたサイトのURLをBMSプレイヤーの難易度表URLとして登録してください。

### beatoraja

以下のいずれかのURLを難易度表追加で入力してください（beatoraja v0.8.8 で動作確認済み）。

- https://your-site.vercel.app/
- https://your-site.vercel.app/header.json

`/header.json` と `/data.json` が自動的に配信されます。

## 技術的な解説

### データの更新の仕組み（ISR）

このテンプレートでは、Next.js の **ISR（Incremental Static Regeneration）** という仕組みを使ってデータを配信しています。

通常の静的サイトでは、サイトをビルド（構築）した時点のデータがそのまま表示され続けます。データを更新するには再ビルドが必要です。一方、アクセスのたびにデータを取得する方式では、表示が遅くなったりサーバーに負荷がかかります。

ISR はこの中間をとる仕組みです。

1. 最初のアクセス時にページを生成し、**キャッシュ（一時保存）** しておく
2. 一定時間（このテンプレートでは5分）が経過すると、キャッシュは「古い」とみなされる
3. 古いキャッシュがある状態でアクセスがあると、**まず古いデータを即座に返しつつ**、裏側で新しいデータを取得してキャッシュを更新する
4. 次のアクセスからは更新されたデータが表示される

つまり、アクセスがあるたびに最新のデータに近づいていく仕組みです。

> 詳しくは Next.js 公式ドキュメントの [Incremental Static Regeneration (ISR)](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration) を参照してください。

### アクセスが少ない場合の対策（CacheWarmer）

ISR はアクセスをきっかけにキャッシュを更新するため、**アクセスが少ないサイトでは更新が起きにくい** という弱点があります。その場合、久しぶりにアクセスした人やBMSクライアントが古いデータを読んでしまいます。

このテンプレートでは、ブラウザでサイトを開いたときに裏側で `/data.json`（難易度表データ）へのリクエストを自動的に送る仕組み（CacheWarmer）を組み込んでいます。これにより、管理者や利用者がサイトをブラウザで閲覧するだけでキャッシュの更新が促されます。

