"use client";

import { useEffect, useState, useCallback, useMemo, useSyncExternalStore, createContext, useContext } from "react";
import type { ThemeMode } from "@/lib/config";

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

function subscribeMediaDark(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getMediaDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
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
  const prefersDark = useSyncExternalStore(subscribeMediaDark, getMediaDark, () => false);

  const resolved: "light" | "dark" =
    mode === "system" ? (prefersDark ? "dark" : "light") : mode;

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
