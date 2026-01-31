import SiteHeader from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/Button";
import EditorWorkspace from "@/components/editor/EditorWorkspace";
import { exportPresets } from "@/lib/render/exportOptions";

export default function EditorPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-16 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">编辑器</h1>
            <p className="text-sm text-ink/60">布局、填图、装饰、导出一体化。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {exportPresets.map((preset) => (
              <Button key={preset.id} variant="secondary">
                {preset.label}
              </Button>
            ))}
            <Button>导出 PNG</Button>
          </div>
        </div>

        <EditorWorkspace />
      </main>
    </div>
  );
}
