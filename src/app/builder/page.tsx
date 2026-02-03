"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import LayoutBuilder from "@/components/layout-builder/LayoutBuilder";
import type { Layout } from "@/types/core";
import { deleteLayout, loadLayout, loadLayoutIndex } from "@/lib/storage/layoutStore";

export default function BuilderPage() {
  const router = useRouter();
  const [savedLayouts, setSavedLayouts] = useState<Layout[]>([]);

  const layoutCount = useMemo(() => savedLayouts.length, [savedLayouts.length]);

  function refreshLayouts() {
    if (typeof window === "undefined") return;
    const ids = loadLayoutIndex();
    const items = ids
      .map((id) => loadLayout(id))
      .filter((layout): layout is Layout => Boolean(layout));
    setSavedLayouts(items);
  }

  useEffect(() => {
    refreshLayouts();
  }, []);

  function handleUseLayout(layoutId: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("pws:layout-preselect", layoutId);
    router.push("/editor");
  }

  function handleDeleteLayout(layoutId: string) {
    deleteLayout(layoutId);
    refreshLayouts();
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex w-full max-w-6xl gap-6 px-6 pb-16 pt-6">
        <aside className="sticky top-6 flex h-fit w-52 flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-ink">随心创造</h1>
            <p className="mt-1 text-xs text-ink/60">自由圈选格子生成编号块</p>
          </div>
          <div className="flex flex-col gap-2">
            <LinkButton variant="secondary" href="/">
              回到首页
            </LinkButton>
            <LinkButton variant="secondary" href="/templates">
              模板工坊
            </LinkButton>
            <LinkButton href="/editor">开始创造</LinkButton>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-6">
              <Card className="flex flex-col gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-ink/80">随心创造</h2>
                  <p className="text-xs text-ink/60">自由拼图布局编辑</p>
                </div>
                <div className="flex flex-col gap-2">
                  <LinkButton variant="secondary" href="/">
                    回到首页
                  </LinkButton>
                  <LinkButton variant="secondary" href="/templates">
                    模板工坊
                  </LinkButton>
                  <LinkButton href="/editor">开始创造</LinkButton>
                </div>
              </Card>
              <LayoutBuilder
                onSave={() => {
                  refreshLayouts();
                }}
                showHelp
                helpTitle="使用说明"
                helpItems={[
                  "1. 设置网格行列数（建议 9x16 或 16x9）。",
                  "2. 点击格子圈选区域，生成编号块。",
                  "3. 保存布局后，在“开始创造”里直接使用。",
                ]}
                helpNote="提示：长按并拖动可快速圈选；已占用格子不可再选，空白格子会保留。"
              />

              <Card className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink/80">我的布局</h2>
                  <span className="text-xs text-ink/50">{layoutCount} 个</span>
                </div>
                {savedLayouts.length === 0 ? (
                  <div className="rounded-2xl bg-white/70 px-4 py-3 text-xs text-ink/60">
                    还没有保存的布局，先在左侧圈选并保存。
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {savedLayouts.map((layout) => (
                      <div
                        key={layout.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink/80">{layout.name}</p>
                          <p className="text-xs text-ink/50">
                            {layout.cols}x{layout.rows} · {layout.regions.length} 个区域
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => handleUseLayout(layout.id)}>
                            立即使用
                          </Button>
                          <Button variant="secondary" onClick={() => handleDeleteLayout(layout.id)}>
                            删除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <Card className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-ink/80">快捷入口</h2>
              <div className="grid gap-2">
                <LinkButton variant="secondary" href="/editor">
                  去编辑器套用
                </LinkButton>
                <LinkButton href="/templates">查看模板库</LinkButton>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
