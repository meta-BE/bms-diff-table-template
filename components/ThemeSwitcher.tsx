"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeSwitcher() {
  const { mode, setMode, configDarkMode } = useTheme();

  // config.darkMode が "light" または "dark" 固定の場合は表示しない
  if (configDarkMode !== "system") {
    return null;
  }

  return (
    <div className="flex gap-1">
      <button
        className={`btn btn-sm ${mode === "light" ? "btn-active" : "btn-ghost"}`}
        onClick={() => setMode("light")}
        aria-label="ライトモード"
      >
        ☀️
      </button>
      <button
        className={`btn btn-sm ${mode === "system" ? "btn-active" : "btn-ghost"}`}
        onClick={() => setMode("system")}
        aria-label="システム設定に従う"
      >
        💻
      </button>
      <button
        className={`btn btn-sm ${mode === "dark" ? "btn-active" : "btn-ghost"}`}
        onClick={() => setMode("dark")}
        aria-label="ダークモード"
      >
        🌙
      </button>
    </div>
  );
}
