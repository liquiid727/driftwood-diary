"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type AdjustState = {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotate: number;
};

type ImageAdjustPanelProps = {
  regionId: string | null;
  state: AdjustState;
  onChange: (next: AdjustState) => void;
  onReset: () => void;
  extra?: ReactNode;
};

export default function ImageAdjustPanel({
  regionId,
  state,
  onChange,
  onReset,
  extra,
}: ImageAdjustPanelProps) {
  if (!regionId) {
    return (
      <Card className="text-sm text-ink/60">
        请选择一个区域以调整图片位置与大小。
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ink/40">Adjust</p>
        <h3 className="text-base font-semibold text-ink">区域 {regionId}</h3>
      </div>
      <div className="grid gap-3 text-xs text-ink/60">
        <label className="flex flex-col gap-1">
          缩放
          <input
            type="range"
            min={1}
            max={2.2}
            step={0.05}
            value={state.scale}
            onChange={(event) =>
              onChange({ ...state, scale: Number(event.target.value) })
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          横向平移
          <input
            type="range"
            min={-60}
            max={60}
            step={1}
            value={state.offsetX}
            onChange={(event) =>
              onChange({ ...state, offsetX: Number(event.target.value) })
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          纵向平移
          <input
            type="range"
            min={-60}
            max={60}
            step={1}
            value={state.offsetY}
            onChange={(event) =>
              onChange({ ...state, offsetY: Number(event.target.value) })
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          旋转
          <input
            type="range"
            min={-15}
            max={15}
            step={1}
            value={state.rotate}
            onChange={(event) =>
              onChange({ ...state, rotate: Number(event.target.value) })
            }
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onReset}
          className="motion-apple-fast rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-ink/70 hover:text-ink"
        >
          重置
        </button>
        {extra}
      </div>
    </Card>
  );
}
