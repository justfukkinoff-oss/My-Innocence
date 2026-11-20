import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground border border-primary hover:bg-primary/90 shadow-subtle",
  secondary:
    "bg-card text-foreground border border-border hover:bg-secondary hover:border-input",
  ghost:
    "bg-transparent text-muted-foreground border border-transparent hover:bg-secondary hover:text-foreground",
  destructive:
    "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

/** Shared button surface, also used by `ButtonLink` for router anchors. */
export function buttonClasses({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium transition-smooth",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

/** 6px-radius action button; oxblood fill for primary, hairline for secondary. */
export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    >
      {children}
    </button>
  );
}
