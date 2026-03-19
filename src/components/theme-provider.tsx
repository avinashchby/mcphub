"use client";

import * as React from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  /** The currently active theme. */
  theme: Theme;
  /** Explicitly set the theme. */
  setTheme: (theme: Theme) => void;
  /** Toggle between dark and light. */
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
);

/** Returns the ThemeContext value; throws if used outside ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Storage key used to persist the theme preference. */
  storageKey?: string;
}

/**
 * Manages dark/light mode by toggling the "dark" class on <html>.
 * Persists the preference to localStorage. Defaults to dark mode.
 */
export function ThemeProvider({
  children,
  storageKey = "mcphub-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>("dark");

  // Initialise from localStorage on first mount (client only).
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
        applyTheme(stored);
      } else {
        // Default: dark mode.
        applyTheme("dark");
      }
    } catch {
      applyTheme("dark");
    }
  }, [storageKey]);

  function applyTheme(next: Theme) {
    const root = document.documentElement;
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  function setTheme(next: Theme) {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // localStorage unavailable in some environments; silently ignore.
    }
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
