"use client";

import { useState } from "react";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import { themes } from "@/data/themes";
import { ExportIcon, GalleryIcon, LeafIcon, SparkleIcon } from "@/components/ui/icons";

const steps = [
  {
    step: "01",
    title: "选择模板",
    desc: "挑选喜欢的主题包，直接开始。",
  },
  {
    step: "02",
    title: "添加图片",
    desc: "按序号填充或拖拽，轻松排版。",
  },
  {
    step: "03",
    title: "导出相册",
    desc: "单页 PNG 或整册 zip，一键高清导出。",
  },
  {
    step: "04",
    title: "分享收藏",
    desc: "保存本地或分享亲友，留下纪念。",
  },
];

const highlights = [
  "主题叙事线 + 轻制作",
  "不规则拼贴布局",
  "本地离线保存",
  "10 分钟完成一套成品",
];

const examples = [
  {
    id: "graduation-story",
    title: "毕业季 · 成长时间轴",
    desc: "用时间线串联四年记忆。",
  },
  {
    id: "spring-family",
    title: "春节 · 团圆合影墙",
    desc: "合影中心 + 周边细节拼贴。",
  },
  {
    id: "memory-wall",
    title: "通用 · 电影海报页",
    desc: "主图 + 副标题 + 片段。",
  },
];

export default function HomePage() {
  const [activeExample, setActiveExample] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-20 pt-6">
        <section className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Tag tone="rose">默认森系</Tag>
              <Tag tone="sky">玻璃拼贴</Tag>
              <Tag>本地离线</Tag>
              <ThemeSwitcher className="md:ml-auto" />
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">
              把照片变成故事。
              <span className="block font-[var(--font-heading)] text-5xl text-rose md:text-6xl">
                主题照片墙，一键成册。
              </span>
            </h1>
            <p className="max-w-xl text-base text-ink/70 md:text-lg">
              Photo Wall Studio 面向毕业季与中国新年等情绪场景，提供主题模板、可视化布局与装饰工具，
              让用户在 10 分钟内完成一套有意义的照片墙。
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <LinkButton href="/editor">进入编辑器</LinkButton>
              <LinkButton variant="secondary" href="/templates">
                浏览模板库
              </LinkButton>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-ink/70">
              {highlights.map((item) => (
                <span key={item} className="rounded-full bg-white/60 px-4 py-2">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="glass-strong grid gap-5 rounded-[32px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/50">
                  Highlight
                </p>
                <h3 className="text-2xl font-semibold text-ink">森系岛屿主题</h3>
              </div>
              <span className="rounded-full bg-rose/15 px-3 py-1 text-xs font-semibold text-rose">
                Default
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-4">
                <p className="text-sm font-semibold">岛民日记</p>
                <p className="text-xs text-ink/60">温柔 + 轻叙事</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-sm font-semibold">柔光拼贴</p>
                <p className="text-xs text-ink/60">森系色块</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-sm font-semibold">贴纸素材</p>
                <p className="text-xs text-ink/60">叶子 / 木牌</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-sm font-semibold">氛围导出</p>
                <p className="text-xs text-ink/60">轻柔质感</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/60 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/leaf.svg" alt="forest leaf" className="h-10 w-10 rounded-2xl" />
              <div>
                <p className="text-xs font-semibold text-ink/70">默认森系主题</p>
                <p className="text-[11px] text-ink/50">温柔、治愈、像岛民日记</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
          <Card className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">四步完成一份作品</h2>
              <span className="text-xs text-ink/50">????</span>
            </div>
            <div className="flex items-center gap-3">
              {steps.map((step, index) => (
                <div key={step.step} className="flex flex-1 items-center gap-2">
                  <div className="h-2 w-full rounded-full bg-rose/10">
                    <div
                      className="motion-apple-fast h-2 rounded-full bg-rose/40"
                      style={{ width: `${(index + 1) * 25}%` }}
                    />
                  </div>
                  {index < steps.length - 1 ? (
                    <span className="text-[10px] text-ink/30">•</span>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {steps.map((step) => (
                <div
                  key={step.title}
                  className="motion-apple group relative overflow-hidden rounded-3xl bg-white/70 p-5 hover:-translate-y-1 hover:bg-white/90"
                >
                  <div className="motion-apple-fast absolute -right-6 -top-6 h-16 w-16 rounded-full bg-rose/15 blur-2xl group-hover:bg-sky/20" />
                  <span className="text-xs uppercase tracking-[0.3em] text-ink/40">
                    {step.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm text-ink/60">{step.desc}</p>
                  <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-ink/70">
                    {step.step === "01" ? <LeafIcon className="h-5 w-5" /> : null}
                    {step.step === "02" ? <GalleryIcon className="h-5 w-5" /> : null}
                    {step.step === "03" ? <ExportIcon className="h-5 w-5" /> : null}
                    {step.step === "04" ? <SparkleIcon className="h-5 w-5" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">首发主题</h2>
            <p className="text-sm text-ink/70">
              三套主题包覆盖森系、毕业季与中国新年，玻璃叠层、拼贴贴纸与氛围配色一体化。
            </p>
            <div className="grid gap-4">
              {Object.entries(themes).map(([key, theme]) => (
                <div key={key} className="rounded-2xl bg-white/60 p-4">
                  <p className="text-sm font-semibold">{theme.name}</p>
                  <p className="text-xs text-ink/60">{theme.description}</p>
                  <div className="mt-3 flex gap-2">
                    {theme.palette.map((color) => (
                      <span
                        key={color}
                        className="h-4 w-4 rounded-full"
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">产品示例</h2>
            <span className="text-xs text-ink/50">点击查看大图</span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {examples.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveExample(item.id)}
                className="group text-left"
              >
                <div className="motion-apple glass-strong relative flex h-44 items-center justify-center rounded-3xl group-hover:-translate-y-1">
                  <div className="absolute inset-6 rounded-2xl border border-white/70 bg-white/60" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/forest-island.svg"
                    alt="sample preview"
                    className="relative h-24 w-40 object-contain opacity-80"
                  />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink">{item.title}</h3>
                <p className="text-xs text-ink/60">{item.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {["不规则拼贴", "主题素材库", "导出清晰度提示"].map((title) => (
            <Card key={title} className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-ink/60">
                以更自由的布局表达故事，把情绪氛围和画面结构同步起来。
              </p>
            </Card>
          ))}
        </section>

        <section className="motion-apple-slow glass-strong flex flex-col gap-6 rounded-[32px] p-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-ink/50">Ready to build</p>
          <h2 className="text-3xl font-semibold text-ink md:text-4xl">
            让你的照片真正成为纪念。
          </h2>
          <p className="text-base text-ink/60">
            进入编辑器，选择主题或创建自定义布局，马上开始你的第一本照片墙。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <LinkButton href="/editor">开始制作</LinkButton>
            <LinkButton variant="secondary" href="/templates">
              查看模板
            </LinkButton>
          </div>
        </section>
      </main>

      <SiteFooter />

      {activeExample ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-6">
          <div className="glass-strong w-full max-w-2xl animate-soft-pop rounded-[28px] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/50">
                  Sample
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">
                  {examples.find((item) => item.id === activeExample)?.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveExample(null)}
                className="rounded-full bg-white/70 px-3 py-1 text-xs text-ink/70"
              >
                关闭
              </button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="glass relative h-56 rounded-3xl">
                <div className="absolute inset-6 rounded-2xl border border-white/70 bg-white/70" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/forest-island.svg"
                  alt="sample preview"
                  className="relative mx-auto h-36 w-48 object-contain opacity-90"
                />
              </div>
              <div className="flex flex-col gap-3 text-sm text-ink/70">
                <p>
                  该示例展示了主题配色、布局与装饰的组合方式，适合快速复用。
                </p>
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Tips</p>
                  <p className="mt-2 text-xs text-ink/60">
                    可直接替换照片，保留主题氛围与装饰层。
                  </p>
                </div>
                <LinkButton href="/editor">立即试用</LinkButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
