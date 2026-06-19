/**
 * useTheme — persists the user's dark/light preference in localStorage
 * and applies the `dark` class to <html> on mount and on every change.
 */
import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "hawkvision_theme";

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage may be blocked (e.g. private browsing + restrictive settings)
  }
  // Fall back to OS preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Apply on first render
  useEffect(() => {
    applyTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
