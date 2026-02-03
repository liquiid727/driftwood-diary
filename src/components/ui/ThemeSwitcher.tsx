"use client";

import { useEffect, useRef, useState } from "react";
import { themes, type ThemeKey } from "@/data/themes";

const STORAGE_KEY = "photo-wall-theme";

type ThemeSwitcherProps = {
  className?: string;
  value?: ThemeKey;
  onChange?: (next: ThemeKey) => void;
  showLabel?: boolean;
};

export default function ThemeSwitcher({
  className,
  value,
  onChange,
  showLabel = true,
}: ThemeSwitcherProps) {
  const [internalTheme, setInternalTheme] = useState<ThemeKey>(() => {
    if (typeof window === "undefined") return "forest";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && saved in themes) return saved as ThemeKey;
    const current = document.documentElement.dataset.theme;
    if (current && current in themes) return current as ThemeKey;
    return "forest";
  });
  const theme = value ?? internalTheme;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const themeList: Array<{ key: ThemeKey; name: string; palette: string[] }> = [
    { key: "forest", name: themes.forest.name, palette: themes.forest.palette },
    { key: "graduation", name: themes.graduation.name, palette: themes.graduation.palette },
    { key: "springFestival", name: themes.springFestival.name, palette: themes.springFestival.palette },
  ];

  const activeTheme = themeList.find((item) => item.key === theme) ?? themeList[0];

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="motion-apple flex items-center gap-3 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-xs font-semibold text-ink/70 shadow-[0_14px_32px_rgba(15,23,42,0.12)] hover:text-ink"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1">
          {activeTheme.palette.slice(0, 3).map((color) => (
            <span
              key={color}
              className="h-3 w-3 rounded-full border border-white/80 shadow-[0_2px_6px_rgba(15,23,42,0.15)]"
              style={{ background: color }}
            />
          ))}
        </span>
        {showLabel ? <span>{activeTheme.name}</span> : null}
        <span className="ml-1 h-0 w-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-ink/60" />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
        >
          {themeList.map((item) => (
            <button
              key={item.key}
              type="button"
              role="option"
              aria-selected={item.key === theme}
              onClick={() => {
                onChange?.(item.key);
                if (!value) setInternalTheme(item.key);
                setOpen(false);
              }}
              className={`motion-apple-fast flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                item.key === theme ? "bg-rose/15 text-rose" : "text-ink/70 hover:bg-ink/5"
              }`}
            >
              <span>{item.name}</span>
              <span className="flex items-center gap-1">
                {item.palette.slice(0, 3).map((color) => (
                  <span
                    key={color}
                    className="h-2.5 w-2.5 rounded-full border border-white/80"
                    style={{ background: color }}
                  />
                ))}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
