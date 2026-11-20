import { buttonClasses } from "@/components/ui/button";
import { Link, type LinkComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface ButtonLinkProps extends LinkComponentProps<"a"> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
}

/** A router `Link` styled as a `Button` — the `asChild` equivalent. */
export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...rest}>
      {children}
    </Link>
  );
}
