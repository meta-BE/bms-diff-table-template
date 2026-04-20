import { readFileSync, writeFileSync } from "fs";

const config = JSON.parse(readFileSync("table.config.json", "utf-8"));
const lightTheme = config.lightTheme || "light";
const darkTheme = config.darkTheme || "dark";
const columns = config.columns || [];

/** @returns {{ unit: "none" | "px" | "percent", value: number }} */
export function parseWidth(width) {
  if (!width) return { unit: "none", value: 0 };
  if (width.endsWith("px")) return { unit: "px", value: parseFloat(width) };
  if (width.endsWith("%")) return { unit: "percent", value: parseFloat(width) };
  return { unit: "none", value: 0 };
}

function buildGridColumns(columns) {
  if (columns.length === 0) return "1fr";

  const cols = columns.map((col) => {
    const { unit, value } = parseWidth(col.width);
    if (unit === "px") return `${value}px`;
    if (unit === "percent") return `${value}fr`;
    return "1fr";
  });

  return cols.join(" ");
}

export function buildMinWidth(columns) {
  const MIN_FLOOR = 600;
  const DEFAULT_COL_WIDTH = 80;
  const PX_PER_PERCENT = 8;

  if (columns.length === 0) return MIN_FLOOR;

  const total = columns.reduce((sum, col) => {
    const { unit, value } = parseWidth(col.width);
    if (unit === "px") return sum + value;
    if (unit === "percent") return sum + value * PX_PER_PERCENT;
    return sum + DEFAULT_COL_WIDTH;
  }, 0);

  return Math.max(total, MIN_FLOOR);
}

const gridCols = buildGridColumns(columns);
const minWidth = buildMinWidth(columns);
const totalCols = columns.length;

const css = `@import "tailwindcss";
@plugin "@tailwindcss/typography";
@plugin "daisyui" {
  themes: ${lightTheme} --default, ${darkTheme} --prefersdark;
}

.table-grid {
  display: grid;
  grid-template-columns: ${gridCols};
  min-width: ${minWidth}px;
}

.table-grid-header-row {
  grid-column: 1 / ${totalCols + 1};
}
`;

writeFileSync("app/globals.css", css);
console.log(
  `app/globals.css を生成しました (themes: ${lightTheme}, ${darkTheme}, grid: ${gridCols}, min-width: ${minWidth}px)`
);
