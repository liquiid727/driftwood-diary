"use client";

import { useEffect, useState } from "react";
import { themes, type ThemeKey } from "@/data/themes";

const STORAGE_KEY = "photo-wall-theme";

type ThemeSwitcherProps = {
  className?: string;
};

export default function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<ThemeKey>(() => {
    if (typeof window === "undefined") return "forest";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && saved in themes) return saved as ThemeKey;
    const current = document.documentElement.dataset.theme;
    if (current && current in themes) return current as ThemeKey;
    return "forest";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="text-xs text-ink/60">主题色</span>
      <select
        className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs text-ink/70"
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemeKey)}
      >
        <option value="forest">{themes.forest.name}</option>
        <option value="graduation">{themes.graduation.name}</option>
        <option value="springFestival">{themes.springFestival.name}</option>
      </select>
    </div>
  );
}
