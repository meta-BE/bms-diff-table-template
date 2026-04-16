"use client";

import { useEffect, useState, useCallback, useMemo, createContext, useContext } from "react";

type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "theme-mode";

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  configDarkMode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

interface ThemeProviderProps {
  lightTheme: string;
  darkTheme: string;
  darkMode: ThemeMode;
  children: React.ReactNode;
}

export function ThemeProvider({
  lightTheme,
  darkTheme,
  darkMode,
  children,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(darkMode);
  const [resolved, setResolved] = useState<"light" | "dark">(
    darkMode === "dark" ? "dark" : "light"
  );

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    if (darkMode === "system") {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    }
  }, [darkMode]);

  useEffect(() => {
    if (darkMode === "system") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        setModeState(saved);
      }
    }
  }, [darkMode]);

  useEffect(() => {
    if (mode === "light") {
      setResolved("light");
      return;
    }
    if (mode === "dark") {
      setResolved("dark");
      return;
    }
    // mode === "system"
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setResolved(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) =>
      setResolved(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const theme = resolved === "dark" ? darkTheme : lightTheme;

  const contextValue = useMemo(
    () => ({ mode, resolved, setMode, configDarkMode: darkMode }),
    [mode, resolved, setMode, darkMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <div data-theme={theme} className="min-h-screen">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
