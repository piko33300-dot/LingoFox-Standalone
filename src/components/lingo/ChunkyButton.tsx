import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const chunky = cva("btn-3d w-full px-6 py-3.5 text-base", {
  variants: {
    variant: {
      primary: "bg-ember text-primary-foreground shadow-[0_4px_0_var(--primary-shade),var(--shadow-glow)]",
      secondary: "bg-pine text-secondary-foreground shadow-[0_4px_0_var(--secondary-shade)]",
      success: "bg-success text-primary-foreground shadow-[0_4px_0_var(--success-shade)]",
      danger: "bg-destructive text-destructive-foreground shadow-[0_4px_0_oklch(0.48_0.19_22)]",
      outline: "bg-card text-secondary border-2 border-border shadow-[0_4px_0_var(--border)]",
      ghostLight: "glass-dark text-secondary-foreground border border-secondary-foreground/25 shadow-[0_4px_0_oklch(0_0_0/0.18)]",
      premium: "bg-gold text-gold-foreground shadow-[0_4px_0_var(--gold-shade)]",
    },
  },
  defaultVariants: { variant: "primary" },
});

export function ChunkyButton({
  className, variant, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof chunky>) {
  return <button className={cn(chunky({ variant }), className)} {...props} />;
}
