import fs from "fs";
import path from "path";
import { resolveTemplate } from "@/lib/resolve-template";

// テーブルはサイトルート "/" 配信のため、パス相対URLもルート基準で解決される。
// 同一オリジン判定にのみ用いる固定ベース。
const SITE_BASE = "http://local/";
const SITE_ORIGIN = new URL(SITE_BASE).origin;
const PUBLIC_DIR = path.join(process.cwd(), "public");

// プロセス生存期間キャッシュ。public/ はデプロイ内で不変のため負のキャッシュも安全
// （再デプロイ = 新プロセスで自動リセット）。
const existsCache = new Map<string, boolean>();

/**
 * href をブラウザの <a href> と同じ規則で解決し、同一オリジン（＝サイト内ローカル）なら
 * site-absolute パス（先頭 "/"）を返す。外部URL・プロトコル相対・mailto: 等は null。
 */
export function localPublicPath(href: string): string | null {
  try {
    const url = new URL(href, SITE_BASE);
    if (url.origin !== SITE_ORIGIN) return null;
    return decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
}

/**
 * site-absolute パス（localPublicPath の返値）が public/ 配下に実在するか。
 * public/ 外を指すパスは fs を呼ばず false（含有チェック）。
 */
export function publicFileExists(pathname: string): boolean {
  const cached = existsCache.get(pathname);
  if (cached !== undefined) return cached;
  const abs = path.join(PUBLIC_DIR, pathname);
  const contained = abs === PUBLIC_DIR || abs.startsWith(PUBLIC_DIR + path.sep);
  const exists = contained && fs.existsSync(abs);
  existsCache.set(pathname, exists);
  return exists;
}

// 実在チェックの対象は /downloads/ 配下の「ファイルアクセスURL」に限定する（固定ホワイトリスト）。
// 末尾が拡張子付きファイル名のもののみ対象。サブディレクトリのネストは許可。
// 例: /downloads/26.zip・/downloads/2024/26.zip はゲート対象。
//     /downloads/（ディレクトリ）や /downloads/guide（拡張子なし=ページ）・/guide は対象外＝常に表示。
// 判定対象は localPublicPath の返す正規化済みパスなので、downloads/26.zip・./downloads/... も
// /downloads/26.zip に正規化された上でマッチする。
const MANAGED_FILE_RE = /^\/downloads\/.+\.[^/.]+$/;

/**
 * カラムの url テンプレートを解決する。/downloads/ 配下のファイルを指し、かつ実ファイルが
 * 無い場合のみ null（非表示）にする。外部URL・/downloads/ 以外の内部パス・実在ファイルは
 * そのまま返す。空値解決時は resolveTemplate に従い null。
 */
export function resolveCellUrl(
  template: string,
  data: Record<string, unknown>,
  fileExists: (pathname: string) => boolean
): string | null {
  const url = resolveTemplate(template, data);
  if (url === null) return null;
  const localPath = localPublicPath(url);
  if (localPath !== null && MANAGED_FILE_RE.test(localPath) && !fileExists(localPath)) {
    return null;
  }
  return url;
}
