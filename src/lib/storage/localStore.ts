import type { Room } from "@/types/core";

const INDEX_KEY = "pws:room-index";

export function loadRoomIndex(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveRoomIndex(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export async function saveRoom(room: Room) {
  if (typeof window === "undefined") return;
  const ids = new Set(loadRoomIndex());
  ids.add(room.id);
  saveRoomIndex(Array.from(ids));
  window.localStorage.setItem(`pws:room:${room.id}`, JSON.stringify(room));
}

export async function loadRoom(id: string): Promise<Room | null> {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`pws:room:${id}`);
  return raw ? (JSON.parse(raw) as Room) : null;
}
