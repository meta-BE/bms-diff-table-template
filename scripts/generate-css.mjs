import { readFileSync, writeFileSync } from "fs";

const config = JSON.parse(readFileSync("table.config.json", "utf-8"));
const lightTheme = config.lightTheme || "light";
const darkTheme = config.darkTheme || "dark";

const css = `@import "tailwindcss";
@plugin "@tailwindcss/typography";
@plugin "daisyui" {
  themes: ${lightTheme} --default, ${darkTheme} --prefersdark;
}
`;

writeFileSync("app/globals.css", css);
console.log(
  `app/globals.css を生成しました (themes: ${lightTheme}, ${darkTheme})`
);
