import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { templatePacks } from "@/data/templates";

export default function TemplatesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-6">
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Tag tone="sky">模板工坊</Tag>
          </div>
          <h1 className="text-3xl font-semibold text-ink md:text-4xl">主题模板库</h1>
          <p className="text-base text-ink/60">
            选择一个主题包，按序号填充照片即可完成。也可以基于模板再创作。
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {templatePacks.map((pack) => (
            <Card key={pack.id} className="flex flex-col gap-4 hover:-translate-y-1 hover:bg-white/90">
              <div>
                <h2 className="text-xl font-semibold">{pack.title}</h2>
                <p className="text-sm text-ink/60">{pack.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {pack.layouts.map((item) => (
                  <span
                    key={item}
                    className="motion-apple-fast rounded-full bg-white/70 px-3 py-1 text-xs text-ink/70"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <LinkButton variant="secondary" href="/editor">
                选用此模板
              </LinkButton>
            </Card>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
