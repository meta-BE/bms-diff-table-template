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

/**
 * カラムの url テンプレートを解決する。ローカル（相対）パスかつ実ファイルが無い場合は null。
 * 外部URL、または実在するローカルパスはそのまま返す。空値解決時は resolveTemplate に従い null。
 */
export function resolveCellUrl(
  template: string,
  data: Record<string, unknown>,
  fileExists: (pathname: string) => boolean
): string | null {
  const url = resolveTemplate(template, data);
  if (url === null) return null;
  const localPath = localPublicPath(url);
  if (localPath !== null && !fileExists(localPath)) return null;
  return url;
}
