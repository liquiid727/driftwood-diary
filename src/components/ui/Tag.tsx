import type { ComponentPropsWithoutRef } from "react";

type TagProps = ComponentPropsWithoutRef<"span"> & {
  tone?: "rose" | "sky" | "neutral";
};

const tones = {
  rose: "bg-rose/15 text-rose",
  sky: "bg-sky/15 text-sky",
  neutral: "bg-black/5 text-ink/70",
};

export function Tag({ tone = "neutral", className = "", ...props }: TagProps) {
  return (
    <span
      className={`motion-apple-fast inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
