"use client";

import { useMemo, useState } from "react";
import { saveLayout } from "@/lib/storage/layoutStore";
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
};

export default function LayoutBuilder({ onSave }: LayoutBuilderProps) {
  const [cols, setCols] = useState(9);
  const [rows, setRows] = useState(9);
  const [name, setName] = useState("未命名布局");
  const [currentCells, setCurrentCells] = useState<Set<string>>(new Set());
  const [regions, setRegions] = useState<Region[]>([]);
  const [message, setMessage] = useState<string>("");

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
    const layout: Layout = {
      id: `layout-${Date.now()}`,
      name,
      cols,
      rows,
      regions,
    };
    saveLayout(layout);
    onSave?.(layout);
    setMessage("布局已保存到本地。");
  }

  return (
    <div className="grid gap-4">
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
        </div>
        {message ? <p className="text-xs text-ink/60">{message}</p> : null}
      </Card>

      <div
        className="grid gap-1 rounded-3xl border border-white/60 bg-white/50 p-4"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((cell) => {
          const key = cellKey(cell);
          const isActive = currentCells.has(key);
          const isTaken = occupied.has(key);
          return (
            <button
              key={key}
              onClick={() => toggleCell(cell)}
              className={`motion-apple-fast aspect-square rounded-lg border text-xs ${
                isTaken
                  ? "border-rose/50 bg-rose/30 text-rose"
                  : isActive
                    ? "border-sky/60 bg-sky/25 text-sky shadow-[0_0_0_2px_rgba(14,165,233,0.35),0_0_18px_rgba(14,165,233,0.4)]"
                    : "border-white/70 bg-white/60 text-ink/30 hover:bg-white"
              }`}
              aria-label={`cell-${key}`}
            >
              {isTaken ? "■" : isActive ? "●" : ""}
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
    </div>
  );
}
