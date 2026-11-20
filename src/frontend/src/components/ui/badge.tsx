import type { Tone } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  primary: "bg-primary/10 text-primary border-primary/25",
};

interface BadgeProps {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}

/** Pill status badge — muted tint fills, hairline border. */
export function Badge({
  tone = "neutral",
  pulse = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {pulse && (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current animate-index-pulse"
        />
      )}
      {children}
    </span>
  );
}
