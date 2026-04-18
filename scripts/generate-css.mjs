import { readFileSync, writeFileSync } from "fs";

const config = JSON.parse(readFileSync("table.config.json", "utf-8"));
const lightTheme = config.lightTheme || "light";
const darkTheme = config.darkTheme || "dark";
const columns = config.columns || [];

function buildGridColumns(columns) {
  if (columns.length === 0) return "1fr";

  const cols = columns.map((col) => {
    if (!col.width) return "1fr";
    if (col.width.endsWith("px")) return col.width;
    if (col.width.endsWith("%")) {
      const num = parseFloat(col.width);
      return `${num}fr`;
    }
    return "1fr";
  });

  return cols.join(" ");
}

const gridCols = buildGridColumns(columns);
const totalCols = columns.length;

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
