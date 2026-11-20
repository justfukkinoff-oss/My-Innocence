import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-safe:animate-pulse rounded-md bg-muted", className)}
    />
  );
}

/** Layout-matched skeleton rows for lists and tables. */
export function SkeletonRows({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  const ids = Array.from({ length: rows }, (_, i) => `skeleton-row-${i}`);
  return (
    <div className={cn("space-y-2", className)} aria-busy="true">
      {ids.map((id) => (
        <Skeleton key={id} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <output
      aria-live="polite"
      className={cn(
        "flex items-center gap-2.5 py-6 text-sm text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-3.5 motion-safe:animate-spin rounded-full border-2 border-border border-t-primary"
      />
      {label}
    </output>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="font-display text-lg font-semibold text-foreground">
        {title}
      </p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  action,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/25 bg-destructive/5 px-5 py-4"
    >
      <p className="text-sm font-semibold text-destructive">{title}</p>
      {message && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
