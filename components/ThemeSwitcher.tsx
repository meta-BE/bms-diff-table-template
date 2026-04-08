"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeSwitcher() {
  const { resolved, setMode, configDarkMode } = useTheme();

  if (configDarkMode !== "system") {
    return null;
  }

  const isDark = resolved === "dark";

  return (
    <input
      type="checkbox"
      className="toggle"
      checked={isDark}
      onChange={() => setMode(isDark ? "light" : "dark")}
      aria-label="ダークモード切り替え"
    />
  );
}
