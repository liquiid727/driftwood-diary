import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const base =
  "motion-apple inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/60";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-rose text-white shadow-[0_18px_35px_rgba(236,72,153,0.35)] hover:-translate-y-0.5 hover:bg-[#db3d8f]",
  secondary:
    "bg-white/70 text-ink shadow-[0_12px_30px_rgba(15,23,42,0.12)] hover:-translate-y-0.5",
  ghost: "text-ink/70 hover:text-ink",
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

type LinkButtonProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: LinkButtonProps) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
