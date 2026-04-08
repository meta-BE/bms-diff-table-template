"use client";

import { useEffect, useState, createContext, useContext } from "react";

type ThemeMode = "light" | "dark" | "system";

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
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  function setMode(newMode: ThemeMode) {
    setModeState(newMode);
    if (darkMode === "system") {
      localStorage.setItem("theme-mode", newMode);
    }
  }

  useEffect(() => {
    if (darkMode === "system") {
      const saved = localStorage.getItem("theme-mode") as ThemeMode | null;
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

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, configDarkMode: darkMode }}>
      <div data-theme={theme} className="min-h-screen">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
