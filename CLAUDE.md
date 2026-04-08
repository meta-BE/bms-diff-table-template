# BMS Difficulty Table Template

## プロジェクト概要
- BMS難易度表の高速ホスティングテンプレート（Next.js + Vercel ISR）
- 設計書: `docs/specs/2026-04-08-bms-diff-table-template-design.md`

## ビルド
- `npm run build` — ビルド（`prebuild` で CSS 自動生成が走る）
- `npm run dev` — 開発サーバー（`predev` で CSS 自動生成が走る）
- `npm start` — プロダクションサーバー起動
- `npm run lint` — ESLint 実行
- `npm test` — Vitest でテスト実行
- `npm run test:watch` — Vitest ウォッチモード

## アーキテクチャ
- `app/page.tsx` — トップページ（譜面一覧表示）
- `app/data.json/`, `app/header.json/` — ISR対応のRoute Handler（外部JSONを中継）
- `components/` — TableView（譜面テーブル）, ThemeProvider, ThemeSwitcher
- `lib/config.ts` — `table.config.json` の型付け・デフォルト値適用
- `lib/fetch-table-data.ts` — 外部データ取得ロジック
- `scripts/generate-css.mjs` — `table.config.json` からCSS自動生成
- `__tests__/` — Vitest テスト（config, fetch, Route Handler）

## 重要な注意点

### Next.js Route Segment Config は静的リテラルのみ
`export const revalidate = config.revalidate` のような動的式は不可。Next.js がビルド時に静的解析するため `Unsupported node type "MemberExpression"` エラーになる。ISR 間隔は `fetch()` の `next.revalidate` オプションで制御すること。

### `app/globals.css` は自動生成ファイル
`scripts/generate-css.mjs` が `table.config.json` から生成する。直接編集しない。`.gitignore` に含まれている。

### daisyUI テーマは明示的に指定が必要
未指定だと全テーマの CSS が出力されバンドルが肥大化する。`generate-css.mjs` が `lightTheme` と `darkTheme` のみを `@plugin "daisyui"` に含める。

## 設定
- `table.config.json` がユーザー向けの唯一の設定ファイル
- `lib/config.ts` で型付けとデフォルト値を適用
