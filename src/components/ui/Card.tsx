import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"div"> & {
  tone?: "glass" | "solid";
};

export function Card({ tone = "glass", className = "", ...props }: CardProps) {
  const toneClass =
    tone === "glass"
      ? "glass"
      : "bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.1)]";
  return (
    <div
      className={`motion-apple ${toneClass} rounded-2xl p-6 text-ink/90 ${className}`}
      {...props}
    />
  );
}
