import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";

const navItems = [
  { href: "/templates", label: "模板工坊" },
  { href: "/editor", label: "开始创造" },
  { href: "/builder", label: "随心创造" },
];

export default function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Link className="flex items-center gap-2 text-lg font-semibold text-ink" href="/">
        <span className="h-9 w-9 rounded-full bg-rose/20 text-center text-lg leading-9">
          ◆
        </span>
        Photo Wall Studio
      </Link>
      <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="motion-apple hover:text-ink">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        <LinkButton variant="secondary" href="/templates" className="hidden md:inline-flex">
          选模板
        </LinkButton>
        <LinkButton href="/editor">立即创作</LinkButton>
      </div>
    </header>
  );
}
