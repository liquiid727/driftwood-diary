import SiteHeader from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { exportPresets } from "@/lib/render/exportOptions";

export default function ExportPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-6">
        <section className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-ink">导出预览</h1>
          <p className="text-sm text-ink/60">
            选择清晰度后导出单页 PNG 或整册 zip。导出失败会自动降级至 1x。
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="motion-apple-slow glass-strong flex min-h-[460px] items-center justify-center rounded-[32px] p-6">
            <div className="grid-overlay flex h-full w-full items-center justify-center rounded-3xl border border-white/60 bg-white/40">
              <div className="text-center">
                <p className="text-sm font-semibold text-ink">预览画面</p>
                <p className="text-xs text-ink/60">这里展示导出的最终画面。</p>
              </div>
            </div>
          </div>

          <Card className="motion-apple-slow flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-ink/80">导出设置</h2>
            <div className="flex flex-col gap-2">
              {exportPresets.map((preset) => (
                <button
                  key={preset.id}
                  className="motion-apple-fast flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 text-sm text-ink/70 hover:text-ink"
                >
                  <span>{preset.label}</span>
                  <span className="text-xs text-ink/40">{preset.scale}x</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-3">
              <Button>导出 PNG</Button>
              <Button variant="secondary">导出整册 zip</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
