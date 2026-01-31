"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LayoutBuilder from "@/components/layout-builder/LayoutBuilder";
import LayoutCanvas from "@/components/editor/LayoutCanvas";
import ImageAdjustPanel from "@/components/editor/ImageAdjustPanel";
import { Card } from "@/components/ui/Card";
import type { Layout, Room } from "@/types/core";
import { loadLayout, loadLayoutIndex } from "@/lib/storage/layoutStore";
import { templateLayouts } from "@/data/templates";
import { themes } from "@/data/themes";
import { exportPresets } from "@/lib/render/exportOptions";
import { loadRoom, loadRoomIndex, saveRoom } from "@/lib/storage/localStore";

function normalizeFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return null;
  }
  return file;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, "");
}

export default function EditorWorkspace() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<Layout | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [pageImages, setPageImages] = useState<Record<string, string>>({});
  const [pageTransforms, setPageTransforms] = useState<
    Record<string, { scale: number; offsetX: number; offsetY: number; rotate: number }>
  >({});
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<keyof typeof themes>("forest");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [exportScale, setExportScale] = useState(2);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>("");
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [includePageTag, setIncludePageTag] = useState(true);
  const [includeThemeTag, setIncludeThemeTag] = useState(true);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [draggingPageIndex, setDraggingPageIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [pageTagPosition, setPageTagPosition] = useState<"bl" | "br" | "tl" | "tr">("bl");
  const [pageTagTone, setPageTagTone] = useState<"light" | "dark">("light");
  const [pageTagSize, setPageTagSize] = useState(10);
  const [pageTagOpacity, setPageTagOpacity] = useState(0.8);
  const [pageTagPadding, setPageTagPadding] = useState(12);
  const [pageTagFont, setPageTagFont] = useState<"sans" | "serif" | "mono">("sans");
  const [watermarkText, setWatermarkText] = useState("Photo Wall Studio");
  const [badgeThemeColor, setBadgeThemeColor] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingRegionRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [exportLayout, setExportLayout] = useState<Layout | null>(null);
  const [exportImages, setExportImages] = useState<Record<string, string>>({});
  const [exportTransforms, setExportTransforms] = useState<
    Record<string, { scale: number; offsetX: number; offsetY: number; rotate: number }>
  >({});
  const [exportPageTag, setExportPageTag] = useState<string | undefined>(undefined);
  const thumbTimerRef = useRef<number | null>(null);
  const thumbBusyRef = useRef(false);

  const loadedLayouts = useMemo(() => {
    if (typeof window === "undefined") return [];
    const ids = loadLayoutIndex();
    return ids
      .map((id) => loadLayout(id))
      .filter((layout): layout is Layout => Boolean(layout));
  }, []);

  useEffect(() => {
    setLayouts(loadedLayouts);
  }, [loadedLayouts]);

  const loadedRooms = useMemo(() => {
    if (typeof window === "undefined") return [];
    const ids = loadRoomIndex();
    return ids
      .map((id) => loadRoom(id))
      .filter((room): room is Room => Boolean(room));
  }, []);

  useEffect(() => {
    setRooms(loadedRooms);
  }, [loadedRooms]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("photo-wall-theme");
    if (saved && saved in themes) {
      setActiveThemeId(saved as keyof typeof themes);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = activeThemeId;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("photo-wall-theme", activeThemeId);
    }
    return () => {
      if (document.documentElement.dataset.theme === activeThemeId) {
        delete document.documentElement.dataset.theme;
      }
    };
  }, [activeThemeId]);

  useEffect(() => {
    if (!selectedLayout && templateLayouts[0]) {
      setSelectedLayout(templateLayouts[0]);
      setSelectedKey(`tpl:${templateLayouts[0].id}`);
    }
  }, [selectedLayout]);

  const activeLayout = useMemo(() => selectedLayout, [selectedLayout]);
  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );
  const activePage = useMemo(() => {
    if (!activeRoom) return null;
    return activeRoom.pages[currentPageIndex] ?? null;
  }, [activeRoom, currentPageIndex]);

  const availableLayouts = useMemo(() => {
    const map = new Map<string, Layout>();
    [...templateLayouts, ...layouts].forEach((layout) => map.set(layout.id, layout));
    return Array.from(map.values());
  }, [layouts]);

  useEffect(() => {
    if (!activeRoom || !activePage) return;
    const layout =
      templateLayouts.find((item) => item.id === activePage.layoutId) ??
      layouts.find((item) => item.id === activePage.layoutId) ??
      null;
    if (layout) {
      setSelectedLayout(layout);
      setSelectedKey(`room:${activeRoom.id}`);
    }
    setPageImages(activePage.regionImages ?? {});
    setPageTransforms(activePage.regionTransforms ?? {});
    setActiveThemeId(activeRoom.themeId as keyof typeof themes);
    if (activeRoom.tagStyle) {
      setIncludeWatermark(activeRoom.tagStyle.includeWatermark);
      setIncludePageTag(activeRoom.tagStyle.includePageTag);
      setIncludeThemeTag(activeRoom.tagStyle.includeThemeTag);
      setWatermarkText(activeRoom.tagStyle.watermarkText);
      setPageTagPosition(activeRoom.tagStyle.pageTagPosition);
      setPageTagTone(activeRoom.tagStyle.pageTagTone);
      setPageTagFont(activeRoom.tagStyle.pageTagFont);
      setPageTagSize(activeRoom.tagStyle.pageTagSize);
      setPageTagOpacity(activeRoom.tagStyle.pageTagOpacity);
      setPageTagPadding(activeRoom.tagStyle.pageTagPadding);
    }
  }, [activeRoom, activePage, layouts]);

  const captureExport = useCallback(async (
    layout: Layout,
    images: Record<string, string>,
    transforms: Record<string, { scale: number; offsetX: number; offsetY: number; rotate: number }>,
    scale = exportScale,
    pageTag?: string
  ) => {
    setExportLayout(layout);
    setExportImages(images);
    setExportTransforms(transforms);
    setExportPageTag(pageTag);
    await waitForPaint();
    if (!exportRef.current) return null;
    const { toPng } = await import("html-to-image");
    return toPng(exportRef.current, {
      pixelRatio: scale,
      cacheBust: true,
    });
  }, [exportScale]);

  useEffect(() => {
    if (!activeRoom || !activePage || !activeLayout) return;
    if (thumbTimerRef.current) window.clearTimeout(thumbTimerRef.current);
    thumbTimerRef.current = window.setTimeout(async () => {
      if (thumbBusyRef.current) return;
      thumbBusyRef.current = true;
      const dataUrl = await captureExport(
        activeLayout,
        pageImages,
        pageTransforms,
        0.4,
        includePageTag ? activePage.name ?? `第${currentPageIndex + 1}页` : undefined
      );
      thumbBusyRef.current = false;
      if (!dataUrl) return;
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== activeRoom.id) return room;
          const pages = room.pages.map((page, index) => {
            if (index !== currentPageIndex) return page;
            return { ...page, thumbnail: dataUrl };
          });
          const updated = { ...room, pages, updatedAt: Date.now() };
          saveRoom(updated);
          return updated;
        })
      );
    }, 800);
    return () => {
      if (thumbTimerRef.current) window.clearTimeout(thumbTimerRef.current);
    };
  }, [activeRoom, activePage, activeLayout, pageImages, pageTransforms, currentPageIndex, captureExport, includePageTag]);

  useEffect(() => {
    if (!activeRoom) return;
    const updated: Room = {
      ...activeRoom,
      tagStyle: {
        includeWatermark,
        includePageTag,
        includeThemeTag,
        watermarkText,
        pageTagPosition,
        pageTagTone,
        pageTagFont,
        pageTagSize,
        pageTagOpacity,
        pageTagPadding,
      },
      updatedAt: Date.now(),
    };
    setRooms((prev) => prev.map((room) => (room.id === activeRoom.id ? updated : room)));
    saveRoom(updated);
  }, [
    activeRoom,
    includeWatermark,
    includePageTag,
    includeThemeTag,
    watermarkText,
    pageTagPosition,
    pageTagTone,
    pageTagFont,
    pageTagSize,
    pageTagOpacity,
    pageTagPadding,
  ]);

  function handleTemplateSelect(layout: Layout) {
    setSelectedLayout(layout);
    setSelectedKey(`tpl:${layout.id}`);
    setSelectedRoomId(null);
    setCurrentPageIndex(0);
    setPageImages({});
    setPageTransforms({});
    setSelectedRegionId(null);
  }

  function handleLayoutSaved(layout: Layout) {
    setLayouts((prev) => [layout, ...prev]);
    setSelectedLayout(layout);
    setSelectedKey(`saved:${layout.id}`);
    setSelectedRoomId(null);
    setCurrentPageIndex(0);
    setPageImages({});
    setPageTransforms({});
    setSelectedRegionId(null);
  }

  async function assignImage(regionId: string, file: File) {
    const normalized = normalizeFile(file);
    if (!normalized) return;
    const dataUrl = await fileToDataUrl(normalized);
    setPageImages((prev) => {
      const next = { ...prev };
      next[regionId] = dataUrl;
      return next;
    });
    if (activeRoom && activePage) {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== activeRoom.id) return room;
          const pages = room.pages.map((page, index) => {
            if (index !== currentPageIndex) return page;
            return {
              ...page,
              regionImages: { ...(page.regionImages ?? {}), [regionId]: dataUrl },
            };
          });
          const updated = { ...room, pages, updatedAt: Date.now() };
          saveRoom(updated);
          return updated;
        })
      );
    }
  }

  function updateTransform(regionId: string, next: { scale: number; offsetX: number; offsetY: number; rotate: number }) {
    setPageTransforms((prev) => ({ ...prev, [regionId]: next }));
    if (activeRoom && activePage) {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== activeRoom.id) return room;
          const pages = room.pages.map((page, index) => {
            if (index !== currentPageIndex) return page;
            return {
              ...page,
              regionTransforms: { ...(page.regionTransforms ?? {}), [regionId]: next },
            };
          });
          const updated = { ...room, pages, updatedAt: Date.now() };
          saveRoom(updated);
          return updated;
        })
      );
    }
  }

  function resetTransform(regionId: string) {
    updateTransform(regionId, { scale: 1, offsetX: 0, offsetY: 0, rotate: 0 });
  }


  function openPicker(regionId: string) {
    pendingRegionRef.current = regionId;
    fileInputRef.current?.click();
  }

  function createRoomFromLayout(layout: Layout) {
    const now = Date.now();
    const firstPageId = `page-${now}`;
    const room: Room = {
      id: `room-${now}`,
      name: `${layout.name} · ${themes[activeThemeId].name}`,
      themeId: activeThemeId,
      pages: [
        {
          id: firstPageId,
          name: "封面",
          sizePreset: "9:16",
          layoutId: layout.id,
          cellStates: {},
          decorations: [],
          background: { type: "color", value: "#ffffff" },
          filter: "none",
          regionImages: {},
          regionTransforms: {},
        },
      ],
      coverPageId: firstPageId,
      tagStyle: {
        includeWatermark,
        includePageTag,
        includeThemeTag,
        watermarkText,
        pageTagPosition,
        pageTagTone,
        pageTagFont,
        pageTagSize,
        pageTagOpacity,
        pageTagPadding,
      },
      createdAt: now,
      updatedAt: now,
    };
    saveRoom(room);
    setRooms((prev) => [room, ...prev]);
    setSelectedRoomId(room.id);
    setCurrentPageIndex(0);
    setPageImages({});
    setPageTransforms({});
  }

  function openRoom(room: Room) {
    setSelectedRoomId(room.id);
    setCurrentPageIndex(0);
    const layout =
      templateLayouts.find((item) => item.id === room.pages[0].layoutId) ??
      loadedLayouts.find((item) => item.id === room.pages[0].layoutId) ??
      null;
    if (layout) {
      setSelectedLayout(layout);
      setSelectedKey(`room:${room.id}`);
    }
    setPageImages(room.pages[0].regionImages ?? {});
    setPageTransforms(room.pages[0].regionTransforms ?? {});
  }

  function setRoomCover(pageId: string) {
    if (!activeRoom) return;
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== activeRoom.id) return room;
        const updated = { ...room, coverPageId: pageId, updatedAt: Date.now() };
        saveRoom(updated);
        return updated;
      })
    );
  }

  function movePage(from: number, to: number) {
    if (!activeRoom) return;
    const pages = [...activeRoom.pages];
    if (to < 0 || to >= pages.length) return;
    const [moved] = pages.splice(from, 1);
    pages.splice(to, 0, moved);
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== activeRoom.id) return room;
        const updated = { ...room, pages, updatedAt: Date.now() };
        saveRoom(updated);
        return updated;
      })
    );
    if (currentPageIndex === from) setCurrentPageIndex(to);
  }

  const pageTagClass =
    pageTagTone === "light"
      ? "bg-white/80 text-ink/60"
      : "bg-ink/70 text-white/80";

  const pageTagPositionClass =
    pageTagPosition === "bl"
      ? "bottom-6 left-6"
      : pageTagPosition === "br"
        ? "bottom-6 right-6"
        : pageTagPosition === "tl"
          ? "top-6 left-6"
          : "top-6 right-6";

  const pageTagFontClass =
    pageTagFont === "serif"
      ? "font-[var(--font-heading)]"
      : pageTagFont === "mono"
        ? "font-mono"
        : "font-[var(--font-body)]";

  const themeBadgeClass = badgeThemeColor
    ? activeThemeId === "springFestival"
      ? "bg-[#C81E1E] text-white"
      : activeThemeId === "forest"
        ? "bg-[#7BBF93] text-white"
        : "bg-[#6B6EF5] text-white"
    : "bg-white/80 text-ink/60";

  function updateActivePage(patch: Partial<Room["pages"][number]>) {
    if (!activeRoom || !activePage) return;
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== activeRoom.id) return room;
        const pages = room.pages.map((page, index) => {
          if (index !== currentPageIndex) return page;
          return { ...page, ...patch };
        });
        const updated = { ...room, pages, updatedAt: Date.now() };
        saveRoom(updated);
        return updated;
      })
    );
  }

  function addPageToRoom() {
    if (!activeRoom || !activeLayout) return;
    const now = Date.now();
    const nextIndex = activeRoom.pages.length + 1;
    const nextPage = {
      id: `page-${now}`,
      name: `第${nextIndex}页`,
      sizePreset: "9:16" as const,
      layoutId: activeLayout.id,
      cellStates: {},
      decorations: [],
      background: { type: "color", value: "#ffffff" },
      filter: "none" as const,
      regionImages: {},
      regionTransforms: {},
    };
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== activeRoom.id) return room;
        const pages = [...room.pages, nextPage];
        const updated = { ...room, pages, updatedAt: Date.now() };
        saveRoom(updated);
        return updated;
      })
    );
    setCurrentPageIndex(activeRoom.pages.length);
    setPageImages({});
    setPageTransforms({});
  }

  async function handleExport() {
    if (!activeLayout) return;
    setExporting(true);
    try {
      const dataUrl = await captureExport(
        activeLayout,
        pageImages,
        pageTransforms,
        exportScale,
        includePageTag ? activePage?.name ?? "页" : undefined
      );
      if (!dataUrl) return;
      const link = document.createElement("a");
      const pageName = sanitizeFileName(activePage?.name ?? "page");
      link.download = `photo-wall-${pageName}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }

  async function handleExportZip() {
    if (!activeLayout) return;
    setExporting(true);
    setExportMessage("");
    try {
      const { default: JSZip } = await import("jszip");
      const dataUrl = await captureExport(
        activeLayout,
        pageImages,
        pageTransforms,
        exportScale,
        includePageTag ? activePage?.name ?? "页" : undefined
      );
      if (!dataUrl) return;
      const zip = new JSZip();
      const pageName = sanitizeFileName(activePage?.name ?? "page");
      zip.file(`page-1-${pageName}.png`, dataUrl.split(",")[1], { base64: true });
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = "photo-wall-pages.zip";
      link.href = URL.createObjectURL(blob);
      link.click();
      setExportMessage("已导出当前页 zip。");
    } catch {
      setExportMessage("导出失败，请降低分辨率重试。");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportRoomZip() {
    const room = rooms.find((item) => item.id === selectedRoomId) ?? null;
    if (!room) {
      setExportMessage("请先选择一个 Room。");
      return;
    }
    setExporting(true);
    setExportMessage("");
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const roomName = sanitizeFileName(room.name);
      for (let index = 0; index < room.pages.length; index += 1) {
        const page = room.pages[index];
        const pageName = sanitizeFileName(page.name ?? `page-${index + 1}`);
        const layout =
          templateLayouts.find((item) => item.id === page.layoutId) ??
          layouts.find((item) => item.id === page.layoutId);
        if (!layout) continue;
        const dataUrl = await captureExport(
          layout,
          page.regionImages ?? {},
          page.regionTransforms ?? {},
          exportScale,
          includePageTag ? page.name ?? `第${index + 1}页` : undefined
        );
        if (!dataUrl) continue;
        zip.file(`${roomName}_p${index + 1}_${pageName}.png`, dataUrl.split(",")[1], {
          base64: true,
        });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = `${roomName}.zip`;
      link.href = URL.createObjectURL(blob);
      link.click();
      setExportMessage("已导出 Room zip。");
    } catch {
      setExportMessage("导出失败，请降低分辨率重试。");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-ink/80">模板布局</h2>
          <div className="flex flex-col gap-2">
            {templateLayouts.map((layout) => (
              <button
                key={layout.id}
                className={`rounded-xl px-3 py-2 text-left text-sm motion-apple-fast ${
                  selectedKey === `tpl:${layout.id}`
                    ? "bg-rose/20 text-rose"
                    : "bg-white/70 text-ink/70 hover:text-ink"
                }`}
                onClick={() => handleTemplateSelect(layout)}
              >
                {layout.name}
              </button>
              ))}
          </div>
          <button
            className="rounded-full bg-rose px-4 py-2 text-xs font-semibold text-white motion-apple-fast hover:-translate-y-0.5"
            onClick={() => {
              if (activeLayout) createRoomFromLayout(activeLayout);
            }}
          >
            生成 Room
          </button>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-ink/80">我的布局</h2>
          {layouts.length === 0 ? (
            <p className="text-xs text-ink/60">还没有保存的布局。</p>
          ) : (
            <div className="flex flex-col gap-2">
              {layouts.map((layout) => (
                <button
                  key={layout.id}
                  className={`rounded-xl px-3 py-2 text-left text-sm motion-apple-fast ${
                    selectedKey === `saved:${layout.id}`
                      ? "bg-sky/20 text-sky"
                      : "bg-white/70 text-ink/70 hover:text-ink"
                  }`}
                  onClick={() => {
                    setSelectedLayout(layout);
                    setSelectedKey(`saved:${layout.id}`);
                  }}
                >
                  {layout.name}
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink/80">我的 Room</h2>
          {rooms.length === 0 ? (
            <p className="text-xs text-ink/60">还没有保存的 Room。</p>
          ) : (
            <div className="grid gap-2 text-xs text-ink/60">
              {rooms.slice(0, 5).map((room) => {
                const coverPage =
                  room.pages.find((page) => page.id === room.coverPageId) ?? room.pages[0];
                return (
                <button
                  key={room.id}
                  onClick={() => openRoom(room)}
                  className={`rounded-xl px-3 py-2 text-left motion-apple-fast ${
                    selectedRoomId === room.id
                      ? "bg-sky/20 text-sky"
                      : "bg-white/70 text-ink/70 hover:text-ink"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/70">
                      {coverPage?.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverPage.thumbnail}
                          alt={`${room.name} cover`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-ink/40">
                          No Img
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{room.name}</p>
                      <p>{room.pages.length} 页 · {room.themeId}</p>
                    </div>
                  </div>
                </button>
              )})}
            </div>
          )}
          {activeRoom ? (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
            {activeRoom.pages.map((page, index) => (
              <div key={page.id} className="flex items-center gap-2">
                <div
                  className={`h-5 w-1 rounded-full ${
                    dragOverIndex === index ? "bg-sky/50" : "bg-transparent"
                  }`}
                />
                <button
                  draggable
                  onDragStart={(event) => {
                    setDraggingPageIndex(index);
                    event.dataTransfer.setData("text/plain", String(index));
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverIndex(index);
                    if (event.dataTransfer.types.includes("application/x-cover-badge")) {
                      event.dataTransfer.dropEffect = "copy";
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (event.dataTransfer.types.includes("application/x-cover-badge")) {
                      setRoomCover(page.id);
                    } else {
                      const from = Number(event.dataTransfer.getData("text/plain"));
                      movePage(from, index);
                    }
                    setDraggingPageIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggingPageIndex(null);
                    setDragOverIndex(null);
                  }}
                  onClick={() => {
                    setCurrentPageIndex(index);
                    setSelectedRegionId(null);
                  }}
                  className={`rounded-full px-3 py-1 text-xs motion-apple-fast ${
                    currentPageIndex === index
                      ? "bg-rose/20 text-rose"
                      : draggingPageIndex === index
                        ? "bg-sky/20 text-sky"
                        : dragOverIndex === index
                          ? "bg-sky/10 text-sky"
                          : "bg-white/70 text-ink/70 hover:text-ink"
                  } ${draggingPageIndex === index ? "scale-105 -translate-y-0.5 shadow" : "motion-apple-fast"} ${
                    dragOverIndex === index ? "ring-1 ring-sky/40" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {page.name ?? `第${index + 1}页`}
                    {activeRoom.coverPageId === page.id ? (
                      <span className="rounded-full bg-rose/20 px-2 py-0.5 text-[10px] text-rose">
                        封面
                      </span>
                    ) : null}
                  </span>
                </button>
              </div>
            ))}
              </div>
              <div className="flex items-center gap-2">
                <span
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/x-cover-badge", "cover");
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  className="rounded-full bg-rose/20 px-3 py-1 text-xs text-rose"
                >
                  拖拽封面标记
                </span>
                <span className="text-[10px] text-ink/50">拖到页签上设置封面</span>
              </div>
              <button
                onClick={addPageToRoom}
                className="rounded-full bg-rose px-4 py-2 text-xs font-semibold text-white motion-apple-fast hover:-translate-y-0.5"
              >
                新增页面
              </button>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="relative flex flex-col gap-6">
        <LayoutCanvas
          layout={activeLayout}
          regionImages={pageImages}
          regionTransforms={pageTransforms}
          selectedRegionId={selectedRegionId}
          containerRef={canvasRef}
          showLabels
          watermarkText={
            includeWatermark
              ? `${watermarkText}${includeThemeTag ? ` · ${themes[activeThemeId].name}` : ""}`
              : undefined
          }
          onAssignImage={assignImage}
          onPickImage={(regionId) => {
            setSelectedRegionId(regionId);
            openPicker(regionId);
          }}
          onSelectRegion={(regionId) => {
            setSelectedRegionId(regionId);
            if (!pageTransforms[regionId]) {
              resetTransform(regionId);
            }
          }}
          onTransformChange={(regionId, next) => {
            updateTransform(regionId, next);
          }}
        />
        {includePageTag && activePage ? (
          <div
            className={`pointer-events-none absolute ${pageTagPositionClass} rounded-full ${pageTagClass} ${pageTagFontClass}`}
            style={{
              fontSize: `${pageTagSize}px`,
              opacity: pageTagOpacity,
              padding: `${pageTagPadding / 2}px ${pageTagPadding}px`,
            }}
          >
            {activePage.name ?? `第${currentPageIndex + 1}页`}
          </div>
        ) : null}
        {includeThemeTag ? (
          <div className={`pointer-events-none absolute top-6 right-6 rounded-full px-3 py-1 text-[10px] ${themeBadgeClass}`}>
            {themes[activeThemeId].name}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <ImageAdjustPanel
            regionId={selectedRegionId}
            state={
              selectedRegionId && pageTransforms[selectedRegionId]
                ? pageTransforms[selectedRegionId]
                : { scale: 1, offsetX: 0, offsetY: 0, rotate: 0 }
            }
            onChange={(next) => {
              if (!selectedRegionId) return;
              updateTransform(selectedRegionId, next);
            }}
            onReset={() => {
              if (!selectedRegionId) return;
              resetTransform(selectedRegionId);
            }}
          />

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink/80">当前页设置</h3>
            </div>
            <div className="grid gap-3 text-xs text-ink/60">
              <label className="flex flex-col gap-1">
                页面名称
                <input
                  className="rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink"
                  value={activePage?.name ?? ""}
                  onChange={(event) => updateActivePage({ name: event.target.value })}
                  disabled={!activeRoom}
                />
              </label>
              <label className="flex flex-col gap-1">
                页面布局
                <select
                  className="rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink"
                  value={activePage?.layoutId ?? activeLayout?.id ?? ""}
                  onChange={(event) => {
                    if (!activeRoom) {
                      const layout = availableLayouts.find((item) => item.id === event.target.value);
                      if (layout) setSelectedLayout(layout);
                      return;
                    }
                    updateActivePage({ layoutId: event.target.value });
                    const layout = availableLayouts.find((item) => item.id === event.target.value);
                    if (layout) setSelectedLayout(layout);
                  }}
                >
                  {availableLayouts.map((layout) => (
                    <option key={layout.id} value={layout.id}>
                      {layout.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-between rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-xs">
                <span>封面选择</span>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full bg-rose/20 px-3 py-1 text-xs text-rose"
                    onClick={() => {
                      if (!activePage) return;
                      setRoomCover(activePage.id);
                    }}
                    disabled={!activeRoom || !activePage}
                  >
                    当前页设为封面
                  </button>
                  <button
                    className="rounded-full bg-white/80 px-3 py-1 text-xs text-ink/70"
                    onClick={() => setCoverPickerOpen((prev) => !prev)}
                    disabled={!activeRoom}
                  >
                    选择封面
                  </button>
                </div>
              </div>
              {coverPickerOpen && activeRoom ? (
                <div className="grid gap-2 rounded-lg border border-white/70 bg-white/70 p-3">
                  {activeRoom.pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setRoomCover(page.id);
                        setCoverPickerOpen(false);
                      }}
                      className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-xs text-ink/70"
                    >
                      <span>{page.name ?? page.id}</span>
                      <span className="text-ink/40">{page.id === activeRoom.coverPageId ? "已选" : "选择"}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <label className="flex flex-col gap-1">
                尺寸预设
                <select
                  className="rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink"
                  value={activePage?.sizePreset ?? "9:16"}
                  onChange={(event) =>
                    updateActivePage({ sizePreset: event.target.value as "A4" | "9:16" | "1:1" })
                  }
                  disabled={!activeRoom}
                >
                  <option value="A4">A4</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
              </label>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink/80">主题服务</h3>
              <select
                className="rounded-full bg-white/70 px-3 py-1 text-xs text-ink/70"
                value={activeThemeId}
                onChange={(event) => setActiveThemeId(event.target.value as keyof typeof themes)}
              >
                <option value="forest">森系岛屿</option>
                <option value="graduation">青春毕业季</option>
                <option value="springFestival">中国新年</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 text-xs text-ink/60">
              <div>
                <p className="font-semibold text-ink/70">一键服务</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {themes[activeThemeId].services.map((item) => (
                    <span key={item} className="rounded-full bg-white/70 px-3 py-1">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-ink/70">贴纸关键词</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {themes[activeThemeId].stickerKeywords.map((item) => (
                    <span key={item} className="rounded-full bg-white/70 px-3 py-1">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-ink/70">推荐页</p>
                <ul className="mt-2 grid gap-1">
                  {themes[activeThemeId].pageGuides.map((item) => (
                    <li key={item} className="rounded-lg bg-white/60 px-3 py-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <Card className="motion-apple-slow flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink/80">导出 PNG</h3>
            <select
              className="rounded-full bg-white/70 px-3 py-1 text-xs text-ink/70"
              value={exportScale}
              onChange={(event) => setExportScale(Number(event.target.value))}
            >
              {exportPresets.map((preset) => (
                <option key={preset.id} value={preset.scale}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            导出水印
            <input
              type="checkbox"
              checked={includeWatermark}
              onChange={(event) => setIncludeWatermark(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            导出页码标签
            <input
              type="checkbox"
              checked={includePageTag}
              onChange={(event) => setIncludePageTag(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            页码位置
            <select
              className="rounded-full bg-white/80 px-2 py-1 text-xs text-ink/70"
              value={pageTagPosition}
              onChange={(event) => setPageTagPosition(event.target.value as typeof pageTagPosition)}
            >
              <option value="bl">左下</option>
              <option value="br">右下</option>
              <option value="tl">左上</option>
              <option value="tr">右上</option>
            </select>
          </label>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            页码样式
            <select
              className="rounded-full bg-white/80 px-2 py-1 text-xs text-ink/70"
              value={pageTagTone}
              onChange={(event) => setPageTagTone(event.target.value as typeof pageTagTone)}
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </label>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            页码字体
            <select
              className="rounded-full bg-white/80 px-2 py-1 text-xs text-ink/70"
              value={pageTagFont}
              onChange={(event) => setPageTagFont(event.target.value as typeof pageTagFont)}
            >
              <option value="sans">Sans</option>
              <option value="serif">Serif</option>
              <option value="mono">Mono</option>
            </select>
          </label>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            页码大小
            <input
              type="range"
              min={8}
              max={16}
              step={1}
              value={pageTagSize}
              onChange={(event) => setPageTagSize(Number(event.target.value))}
            />
          </label>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            页码透明度
            <input
              type="range"
              min={0.4}
              max={1}
              step={0.05}
              value={pageTagOpacity}
              onChange={(event) => setPageTagOpacity(Number(event.target.value))}
            />
          </label>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            页码内边距
            <input
              type="range"
              min={6}
              max={20}
              step={1}
              value={pageTagPadding}
              onChange={(event) => setPageTagPadding(Number(event.target.value))}
            />
          </label>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            导出主题标签
            <input
              type="checkbox"
              checked={includeThemeTag}
              onChange={(event) => setIncludeThemeTag(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            主题色徽章
            <input
              type="checkbox"
              checked={badgeThemeColor}
              onChange={(event) => setBadgeThemeColor(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2 text-xs text-ink/70">
            水印文本
            <input
              className="ml-2 flex-1 rounded-full bg-white/80 px-2 py-1 text-xs text-ink/70"
              value={watermarkText}
              onChange={(event) => setWatermarkText(event.target.value)}
            />
          </label>
          <div className="grid gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-full bg-rose px-4 py-2 text-xs font-semibold text-white motion-apple-fast hover:-translate-y-0.5 disabled:opacity-60"
            >
              {exporting ? "导出中..." : "导出 PNG"}
            </button>
            <button
              onClick={handleExportZip}
              disabled={exporting}
              className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-ink/70 motion-apple-fast hover:-translate-y-0.5 disabled:opacity-60"
            >
              导出当前页 zip
            </button>
            <button
              onClick={handleExportRoomZip}
              disabled={exporting}
              className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-ink/70 motion-apple-fast hover:-translate-y-0.5 disabled:opacity-60"
            >
              导出 Room zip
            </button>
            {exporting ? (
              <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
                <div className="loading-bar h-full w-1/3 rounded-full bg-rose/70" />
              </div>
            ) : null}
            {exportMessage ? (
              <p className="text-xs text-ink/60">{exportMessage}</p>
            ) : null}
          </div>
        </Card>

        <LayoutBuilder onSave={handleLayoutSaved} />
      </div>

      <div className="pointer-events-none absolute -left-[9999px] top-0 opacity-0">
        <LayoutCanvas
          layout={exportLayout}
          regionImages={exportImages}
          regionTransforms={exportTransforms}
          selectedRegionId={null}
          containerRef={exportRef}
          showLabels={false}
          watermarkText={
            includeWatermark
              ? `${watermarkText}${includeThemeTag ? ` · ${themes[activeThemeId].name}` : ""}`
              : undefined
          }
          onAssignImage={() => {}}
          onPickImage={() => {}}
        />
        {exportPageTag ? (
          <div
            className={`absolute ${pageTagPositionClass.replace("6", "3")} rounded-full ${pageTagClass} ${pageTagFontClass}`}
            style={{
              fontSize: `${pageTagSize}px`,
              opacity: pageTagOpacity,
              padding: `${pageTagPadding / 2}px ${pageTagPadding}px`,
            }}
          >
            {exportPageTag}
          </div>
        ) : null}
        {includeThemeTag ? (
          <div className={`absolute top-3 right-3 rounded-full px-3 py-1 text-[10px] ${themeBadgeClass}`}>
            {themes[activeThemeId].name}
          </div>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const regionId = pendingRegionRef.current;
          if (file && regionId) assignImage(regionId, file);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
