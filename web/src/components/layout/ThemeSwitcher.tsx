"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

const THEMES = ["light", "dark", "amoled"] as const;
type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "sc-theme";

/**
 * Rewrites `data-theme` on <html>, which is what the CSS variables in globals.css key
 * off. Persisted to localStorage — this stands in for the DataStore-backed H3 Settings
 * preference until real settings exist.
 */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && THEMES.includes(stored)) {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
    }
  }, []);

  function pick(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <div className="inline-flex gap-[3px] rounded-[11px] border border-border bg-surface2 p-[3px]">
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => pick(t)}
          className={clsx(
            "rounded-lg px-3 py-[6px] text-label font-semibold capitalize transition-colors duration-150",
            theme === t ? "bg-primary text-primary-on" : "text-dim hover:text-text",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
