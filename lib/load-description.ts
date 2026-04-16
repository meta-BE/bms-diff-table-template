import fs from "fs";
import path from "path";

/** target/rel のいずれも持たない <a> タグにのみ target="_blank" rel="noopener noreferrer" を付加 */
function addLinkAttributes(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (match, attrs: string) => {
    if (/\btarget\b/i.test(attrs) || /\brel\b/i.test(attrs)) return match;
    return `<a${attrs} target="_blank" rel="noopener noreferrer">`;
  });
}

export function loadDescription(): string | null {
  const filePath = path.join(process.cwd(), "description.html");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return addLinkAttributes(raw);
  } catch {
    return null;
  }
}
