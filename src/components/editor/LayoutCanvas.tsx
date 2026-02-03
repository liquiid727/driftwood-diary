"use client";

import { useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Layout, Region } from "@/types/core";

type LayoutCanvasProps = {
  layout: Layout | null;
  regionImages: Record<string, string>;
  regionTransforms: Record<string, { scale: number; offsetX: number; offsetY: number; rotate: number }>;
  selectedRegionId?: string | null;
  showLabels?: boolean;
  watermarkText?: string;
  onAssignImage: (regionId: string, file: File) => void;
  onPickImage: (regionId: string) => void;
  onSelectRegion?: (regionId: string) => void;
  onTransformChange?: (
    regionId: string,
    next: { scale: number; offsetX: number; offsetY: number; rotate: number }
  ) => void;
  containerRef?: RefObject<HTMLDivElement>;
};

type Cell = [number, number];

function cellKey([x, y]: Cell) {
  return `${x}:${y}`;
}

function findRegionByCell(regions: Region[], key: string) {
  for (const region of regions) {
    for (const [x, y] of region.cells) {
      if (cellKey([x, y]) === key) return region;
    }
  }
  return null;
}

function topLeftKey(region: Region) {
  const sorted = [...region.cells].sort((a, b) => (a[1] - b[1] ? a[1] - b[1] : a[0] - b[0]));
  return cellKey(sorted[0]);
}

function bounds(region: Region) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  region.cells.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  return { minX, minY, maxX, maxY };
}

function buildMask(region: Region) {
  const box = bounds(region);
  const width = box.maxX - box.minX + 1;
  const height = box.maxY - box.minY + 1;
  const rects = region.cells
    .map(([x, y]) => `<rect x="${x - box.minX}" y="${y - box.minY}" width="1" height="1" />`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const REGION_TINTS = [
  "rgba(255, 99, 132, 0.18)",
  "rgba(54, 162, 235, 0.18)",
  "rgba(255, 206, 86, 0.2)",
  "rgba(75, 192, 192, 0.18)",
  "rgba(153, 102, 255, 0.18)",
  "rgba(255, 159, 64, 0.2)",
  "rgba(46, 204, 113, 0.18)",
  "rgba(231, 76, 60, 0.18)",
];

function regionTint(order: number) {
  if (!Number.isFinite(order)) return "rgba(255, 255, 255, 0.12)";
  return REGION_TINTS[(order - 1) % REGION_TINTS.length];
}

export default function LayoutCanvas({
  layout,
  regionImages,
  regionTransforms,
  selectedRegionId,
  showLabels = true,
  watermarkText,
  onAssignImage,
  onPickImage,
  onSelectRegion,
  onTransformChange,
  containerRef,
}: LayoutCanvasProps) {
  const dragRef = useRef<{
    regionId: string;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const grid = useMemo(() => {
    if (!layout) return [];
    const items: Cell[] = [];
    for (let y = 0; y < layout.rows; y += 1) {
      for (let x = 0; x < layout.cols; x += 1) {
        items.push([x, y]);
      }
    }
    return items;
  }, [layout]);

  const regionTopLeft = useMemo(() => {
    if (!layout) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const region of layout.regions) {
      map.set(region.id, topLeftKey(region));
    }
    return map;
  }, [layout]);

  const regionBounds = useMemo(() => {
    if (!layout) return new Map<string, ReturnType<typeof bounds>>();
    const map = new Map<string, ReturnType<typeof bounds>>();
    for (const region of layout.regions) {
      map.set(region.id, bounds(region));
    }
    return map;
  }, [layout]);

  const regionMasks = useMemo(() => {
    if (!layout) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const region of layout.regions) {
      map.set(region.id, buildMask(region));
    }
    return map;
  }, [layout]);

  if (!layout) {
    return (
      <div className="glass-strong flex min-h-[320px] items-center justify-center rounded-[32px] p-6">
        <div className="text-center text-sm text-ink/60">请选择或创建一个布局。</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="glass-strong canvas-surface rounded-[32px] p-6">
      <div
        className="relative grid gap-1 rounded-3xl border border-white/60 bg-white/40 p-4"
        style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))` }}
      >
        {grid.map((cell) => {
          const key = cellKey(cell);
          const region = findRegionByCell(layout.regions, key);
          const isSelected = region?.id && selectedRegionId === region.id;
          const isDragging = Boolean(region?.id && draggingId === region.id);
          const showOrder = region && regionTopLeft.get(region.id) === key;
          const hasImage = Boolean(region && regionImages[region.id]);
          const tint = region ? regionTint(region.order) : undefined;
          return (
            <button
              key={key}
              className={`motion-apple-fast relative aspect-square rounded-lg border text-[10px] ${
                region
                  ? isSelected
                    ? "border-sky bg-sky/30 text-sky"
                    : "border-rose/40 bg-white/70 text-rose"
                  : "border-white/60 bg-white/50 text-ink/20"
              }`}
              style={tint ? { backgroundColor: tint } : undefined}
              onClick={() => {
                if (region) onSelectRegion?.(region.id);
              }}
              onDoubleClick={() => {
                if (region) onPickImage(region.id);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file && region) onAssignImage(region.id, file);
              }}
              aria-label={`cell-${key}`}
            >
              {showLabels && showOrder ? (
                <span className="absolute left-1 top-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-rose">
                  {region.order}
                </span>
              ) : null}
              {showLabels && showOrder && !hasImage ? (
                <span className="absolute bottom-1 right-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-ink/50">
                  双击上传
                </span>
              ) : null}
              {showLabels && isDragging ? (
                <span className="absolute bottom-1 left-1 rounded-full bg-sky/80 px-2 py-0.5 text-[10px] text-white">
                  移动中
                </span>
              ) : null}
            </button>
          );
        })}

        {layout.regions.map((region) => {
          const box = regionBounds.get(region.id);
          const topLeft = regionTopLeft.get(region.id);
          if (!box || !topLeft) return null;
          const image = regionImages[region.id];
          const transform = regionTransforms[region.id] ?? {
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            rotate: 0,
          };
          const mask = regionMasks.get(region.id);
          const isSelected = selectedRegionId === region.id;
          const isDragging = draggingId === region.id;
          const colStart = box.minX + 1;
          const colEnd = box.maxX + 2;
          const rowStart = box.minY + 1;
          const rowEnd = box.maxY + 2;
          const hasImage = Boolean(image);
          const tint = regionTint(region.order);
          return (
            <button
              key={`overlay-${region.id}`}
              className={`motion-apple-fast z-10 rounded-2xl border ${
                isSelected
                  ? "border-sky shadow-[0_0_0_2px_rgba(6,182,212,0.35)]"
                  : "border-white/40"
              } ${hasImage ? "pointer-events-auto" : "pointer-events-none"} ${
                isDragging ? "cursor-grabbing opacity-90" : "cursor-grab"
              }`}
              style={{
                gridColumn: `${colStart} / ${colEnd}`,
                gridRow: `${rowStart} / ${rowEnd}`,
                backgroundImage: image ? `url(${image})` : undefined,
                backgroundColor: image ? undefined : tint,
                backgroundSize: `${transform.scale * 100}%`,
                backgroundPosition: `calc(50% + ${transform.offsetX}px) calc(50% + ${transform.offsetY}px)`,
                transform: `rotate(${transform.rotate}deg)`,
                WebkitMaskImage: mask,
                maskImage: mask,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
              }}
              onClick={() => onSelectRegion?.(region.id)}
              onDoubleClick={() => onPickImage(region.id)}
              onPointerDown={(event) => {
                if (!image) return;
                const start = regionTransforms[region.id] ?? {
                  scale: 1,
                  offsetX: 0,
                  offsetY: 0,
                  rotate: 0,
                };
                dragRef.current = {
                  regionId: region.id,
                  startX: event.clientX,
                  startY: event.clientY,
                  startOffsetX: start.offsetX,
                  startOffsetY: start.offsetY,
                };
                onSelectRegion?.(region.id);
                setDraggingId(region.id);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!dragRef.current || dragRef.current.regionId !== region.id) return;
                const dx = event.clientX - dragRef.current.startX;
                const dy = event.clientY - dragRef.current.startY;
                const current = regionTransforms[region.id] ?? {
                  scale: 1,
                  offsetX: 0,
                  offsetY: 0,
                  rotate: 0,
                };
                onTransformChange?.(region.id, {
                  ...current,
                  offsetX: dragRef.current.startOffsetX + dx,
                  offsetY: dragRef.current.startOffsetY + dy,
                });
              }}
              onPointerUp={() => {
                dragRef.current = null;
                setDraggingId(null);
              }}
              onPointerCancel={() => {
                dragRef.current = null;
                setDraggingId(null);
              }}
              onPointerLeave={() => {
                dragRef.current = null;
                setDraggingId(null);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) onAssignImage(region.id, file);
              }}
              aria-label={`region-${region.id}`}
            >
              {!image && showLabels ? <span className="sr-only">双击上传</span> : null}
            </button>
          );
        })}

        {watermarkText ? (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/70 px-3 py-1 text-[10px] text-ink/50">
            {watermarkText}
          </div>
        ) : null}
      </div>
    </div>
  );
}
