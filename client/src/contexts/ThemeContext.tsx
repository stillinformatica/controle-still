import React, { createContext, useContext, useEffect, useState } from "react";

export const THEMES = {
  light: { label: "Claro", emoji: "☀️" },
  dark: { label: "Escuro", emoji: "🌙" },
  mothers_day: { label: "Dia das Mães", emoji: "💐" },
  harry_potter: { label: "Harry Potter", emoji: "⚡" },
  marvel: { label: "Marvel", emoji: "🦸" },
  christmas: { label: "Natal", emoji: "🎄" },
} as const;

export type ThemeName = keyof typeof THEMES;

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
}) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem("app-theme") as ThemeName | null;
    return stored && stored in THEMES ? stored : defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    Object.keys(THEMES).forEach((t) => root.classList.remove(`theme-${t}`));
    root.classList.remove("dark");

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme !== "light") {
      root.classList.add(`theme-${theme}`);
    }

    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const setTheme = (t: ThemeName) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
