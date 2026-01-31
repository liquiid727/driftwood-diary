import type { Layout } from "@/types/core";

const INDEX_KEY = "pws:layout-index";

export function loadLayoutIndex(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveLayoutIndex(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export function saveLayout(layout: Layout) {
  if (typeof window === "undefined") return;
  const ids = new Set(loadLayoutIndex());
  ids.add(layout.id);
  saveLayoutIndex(Array.from(ids));
  window.localStorage.setItem(`pws:layout:${layout.id}`, JSON.stringify(layout));
}

export function loadLayout(id: string): Layout | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`pws:layout:${id}`);
  return raw ? (JSON.parse(raw) as Layout) : null;
}
