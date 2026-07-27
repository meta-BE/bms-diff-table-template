import { resolveTemplate } from "@/lib/resolve-template";
import { localPublicPath } from "@/lib/local-file";

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
