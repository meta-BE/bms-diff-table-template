import { readFileSync, writeFileSync } from "fs";

const config = JSON.parse(readFileSync("table.config.json", "utf-8"));
const lightTheme = config.lightTheme || "light";
const darkTheme = config.darkTheme || "dark";
const columns = config.columns || [];

// レベルカラム（先頭固定）+ ユーザー定義カラム
function buildGridColumns(columns) {
  // レベルカラムは auto
  const levelCol = "auto";
  if (columns.length === 0) return levelCol;

  const cols = columns.map((col) => {
    if (!col.width) return "1fr";
    if (col.width.endsWith("px")) return col.width;
    if (col.width.endsWith("%")) {
      const num = parseFloat(col.width);
      return `${num}fr`;
    }
    return "1fr";
  });

  return `${levelCol} ${cols.join(" ")}`;
}

const gridCols = buildGridColumns(columns);
// カラム総数 = レベル(1) + ユーザー定義カラム数
const totalCols = 1 + columns.length;

const css = `@import "tailwindcss";
@plugin "@tailwindcss/typography";
@plugin "daisyui" {
  themes: ${lightTheme} --default, ${darkTheme} --prefersdark;
}

.table-grid {
  display: grid;
  grid-template-columns: ${gridCols};
}

.table-grid-header-row {
  grid-column: 1 / ${totalCols + 1};
}
`;

writeFileSync("app/globals.css", css);
console.log(
  `app/globals.css を生成しました (themes: ${lightTheme}, ${darkTheme}, grid: ${gridCols})`
);
