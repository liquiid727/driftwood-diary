"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadLayout, loadLayoutIndex, saveLayout } from "@/lib/storage/layoutStore";
import { isOrthogonallyConnected } from "@/lib/geometry/regions";
import type { Layout, Region } from "@/types/core";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Cell = [number, number];

function cellKey([x, y]: Cell) {
  return `${x}:${y}`;
}

function parseKey(key: string): Cell {
  const [x, y] = key.split(":").map(Number);
  return [x, y];
}

type LayoutBuilderProps = {
  onSave?: (layout: Layout) => void;
  showHelp?: boolean;
  helpTitle?: string;
  helpItems?: string[];
  helpNote?: string;
};

export default function LayoutBuilder({
  onSave,
  showHelp = false,
  helpTitle = "使用说明",
  helpItems = [],
  helpNote = "",
}: LayoutBuilderProps) {
  const [cols, setCols] = useState(9);
  const [rows, setRows] = useState(9);
  const [name, setName] = useState("未命名布局");
  const [currentCells, setCurrentCells] = useState<Set<string>>(new Set());
  const [regions, setRegions] = useState<Region[]>([]);
  const [message, setMessage] = useState<string>("");
  const [helpOpen, setHelpOpen] = useState(false);
  const pressTimerRef = useRef<number | null>(null);
  const isPaintingRef = useRef(false);
  const paintModeRef = useRef<"add" | "remove">("add");
  const suppressClickRef = useRef(false);
  const activePointerRef = useRef<number | null>(null);

  const occupied = useMemo(() => {
    const taken = new Set<string>();
    for (const region of regions) {
      for (const cell of region.cells) {
        taken.add(cellKey(cell));
      }
    }
    return taken;
  }, [regions]);

  const grid = useMemo(() => {
    const items: Cell[] = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        items.push([x, y]);
      }
    }
    return items;
  }, [cols, rows]);

  const regionByCell = useMemo(() => {
    const map = new Map<string, Region>();
    for (const region of regions) {
      for (const cell of region.cells) {
        map.set(cellKey(cell), region);
      }
    }
    return map;
  }, [regions]);

  const regionTopLeft = useMemo(() => {
    const map = new Map<string, string>();
    for (const region of regions) {
      const sorted = [...region.cells].sort((a, b) => (a[1] - b[1] ? a[1] - b[1] : a[0] - b[0]));
      map.set(region.id, cellKey(sorted[0]));
    }
    return map;
  }, [regions]);

  const regionCellMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const region of regions) {
      map.set(region.id, new Set(region.cells.map(cellKey)));
    }
    return map;
  }, [regions]);

  function toggleCell(cell: Cell) {
    const key = cellKey(cell);
    if (occupied.has(key)) return;
    setCurrentCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function setCellSelected(cell: Cell, shouldSelect: boolean) {
    const key = cellKey(cell);
    if (occupied.has(key)) return;
    setCurrentCells((prev) => {
      const next = new Set(prev);
      if (shouldSelect) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function clearPressTimer() {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }

  useEffect(() => {
    function handlePointerEnd(event: PointerEvent) {
      if (activePointerRef.current !== null && event.pointerId !== activePointerRef.current) {
        return;
      }
      clearPressTimer();
      if (isPaintingRef.current) {
        isPaintingRef.current = false;
        suppressClickRef.current = true;
      }
      activePointerRef.current = null;
    }

    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    return () => {
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, []);

  useEffect(() => {
    if (!helpOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHelpOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [helpOpen]);

  function resetSelection() {
    setCurrentCells(new Set());
  }

  function addRegion() {
    if (currentCells.size === 0) {
      setMessage("请先圈选至少一个格子。");
      return;
    }
    const cells = Array.from(currentCells).map(parseKey);
    if (!isOrthogonallyConnected(cells)) {
      setMessage("当前区域不连通，请调整为四邻接连通。");
      return;
    }
    const order = regions.length + 1;
    const region: Region = {
      id: `region-${order}`,
      order,
      cells,
    };
    setRegions((prev) => [...prev, region]);
    setCurrentCells(new Set());
    setMessage(`已创建区域 ${order}。`);
  }

  function clearRegions() {
    setRegions([]);
    setCurrentCells(new Set());
    setMessage("已清空布局。");
  }

  function deleteRegion(id: string) {
    const next = regions.filter((region) => region.id !== id);
    const reindexed = next.map((region, index) => ({
      ...region,
      order: index + 1,
      id: `region-${index + 1}`,
    }));
    setRegions(reindexed);
    setMessage("已删除区域并重新编号。");
  }

  function handleSave() {
    const baseName = name.trim() || "未命名布局";
    let nextName = baseName;
    if (typeof window !== "undefined") {
      const ids = loadLayoutIndex();
      const existingNames = ids
        .map((id) => loadLayout(id))
        .filter((layout): layout is Layout => Boolean(layout))
        .map((layout) => layout.name);
      if (existingNames.includes(baseName)) {
        const suffixMatch = baseName.match(/^(.*?)(?:-(\d+))?$/);
        const rootName = suffixMatch?.[1]?.trim() || baseName;
        let counter = 1;
        while (existingNames.includes(`${rootName}-${counter}`)) {
          counter += 1;
        }
        nextName = `${rootName}-${counter}`;
      }
    }
    const layout: Layout = {
      id: `layout-${Date.now()}`,
      name: nextName,
      cols,
      rows,
      regions,
    };
    saveLayout(layout);
    onSave?.(layout);
    setName(nextName);
    setMessage("布局已保存到本地。");
  }

  return (
    <div className="grid gap-4">
      <div className="sticky top-4 z-10">
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink/60">
              名称
              <input
                className="rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink/60">
              列
              <input
                type="number"
                min={3}
                max={20}
                className="w-24 rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink"
                value={cols}
                onChange={(event) => setCols(Number(event.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink/60">
              行
              <input
                type="number"
                min={3}
                max={20}
                className="w-24 rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink"
                value={rows}
                onChange={(event) => setRows(Number(event.target.value))}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={resetSelection}>
              清空圈选
            </Button>
            <Button variant="secondary" onClick={addRegion}>
              生成区域
            </Button>
            <Button variant="secondary" onClick={clearRegions}>
              清空布局
            </Button>
            <Button onClick={handleSave}>保存布局</Button>
            {showHelp ? (
              <Button variant="secondary" onClick={() => setHelpOpen(true)}>
                使用说明
              </Button>
            ) : null}
          </div>
          {message ? <p className="text-xs text-ink/60">{message}</p> : null}
        </Card>
      </div>

      <div
        className="grid gap-1 rounded-3xl border border-white/60 bg-white p-4"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((cell) => {
          const key = cellKey(cell);
          const isActive = currentCells.has(key);
          const region = regionByCell.get(key) ?? null;
          const isTaken = Boolean(region);
          const showOrder = region && regionTopLeft.get(region.id) === key;
          const regionSet = region ? regionCellMap.get(region.id) : null;
          const hideTop = regionSet?.has(cellKey([cell[0], cell[1] - 1])) ?? false;
          const hideRight = regionSet?.has(cellKey([cell[0] + 1, cell[1]])) ?? false;
          const hideBottom = regionSet?.has(cellKey([cell[0], cell[1] + 1])) ?? false;
          const hideLeft = regionSet?.has(cellKey([cell[0] - 1, cell[1]])) ?? false;
          return (
            <button
              key={key}
              onClick={() => {
                if (suppressClickRef.current) {
                  suppressClickRef.current = false;
                  return;
                }
                toggleCell(cell);
              }}
              onPointerDown={(event) => {
                if (event.pointerType === "mouse" && event.button !== 0) return;
                activePointerRef.current = event.pointerId;
                clearPressTimer();
                pressTimerRef.current = window.setTimeout(() => {
                  isPaintingRef.current = true;
                  suppressClickRef.current = true;
                  paintModeRef.current = isActive ? "remove" : "add";
                  setCellSelected(cell, paintModeRef.current === "add");
                }, 180);
              }}
              onPointerEnter={() => {
                if (!isPaintingRef.current) return;
                setCellSelected(cell, paintModeRef.current === "add");
              }}
              className={`motion-apple-fast aspect-square rounded-lg border text-xs ${
                isTaken
                  ? "border-rose/50 bg-rose/10 text-rose"
                : isActive
                    ? "border-sky/60 bg-sky/25 text-sky shadow-[0_0_0_2px_rgba(14,165,233,0.35),0_0_18px_rgba(14,165,233,0.4)]"
                    : "border-black/10 bg-ink/5 text-ink/40 hover:bg-ink/10"
              }`}
              style={
                isTaken
                  ? {
                      borderTopColor: hideTop ? "transparent" : undefined,
                      borderRightColor: hideRight ? "transparent" : undefined,
                      borderBottomColor: hideBottom ? "transparent" : undefined,
                      borderLeftColor: hideLeft ? "transparent" : undefined,
                    }
                  : undefined
              }
              aria-label={`cell-${key}`}
            >
              {showOrder ? (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/80 px-1 text-[10px] font-semibold text-rose shadow-[0_0_0_2px_rgba(236,72,153,0.25)]">
                  {region.order}
                </span>
              ) : isActive ? (
                "●"
              ) : null}
            </button>
          );
        })}
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink/80">已创建区域</h3>
          <span className="text-xs text-ink/50">{regions.length} 个</span>
        </div>
        {regions.length === 0 ? (
          <p className="text-xs text-ink/60">暂无区域，圈选后点击“生成区域”。</p>
        ) : (
          <div className="grid gap-2">
            {regions.map((region) => (
              <div
                key={region.id}
                className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-xs text-ink/70"
              >
                <span>
                  区域 {region.order} · {region.cells.length} 格
                </span>
                <button
                  className="motion-apple-fast text-rose hover:text-[#db3d8f]"
                  onClick={() => deleteRegion(region.id)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showHelp && helpOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-6"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="glass-strong motion-apple-slow w-full max-w-lg rounded-[24px] p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-ink">{helpTitle}</h3>
              <button
                onClick={() => setHelpOpen(false)}
                className="motion-apple-fast rounded-full bg-white/70 px-3 py-1 text-xs text-ink/70 hover:text-ink"
              >
                关闭
              </button>
            </div>
            {helpItems.length > 0 ? (
              <div className="mt-4 grid gap-3 text-sm text-ink/70">
                {helpItems.map((item) => (
                  <div key={item} className="rounded-2xl bg-white/70 px-4 py-3">
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
            {helpNote ? (
              <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-xs text-ink/60">
                {helpNote}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
