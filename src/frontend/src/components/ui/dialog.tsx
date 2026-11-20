import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Modal with Escape, backdrop close, focus trap and focus restoration. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel && !panel.open) panel.showModal();
    const focusable = panel?.querySelector<HTMLElement>(
      "input, textarea, select, button:not([data-dialog-close])",
    );
    (focusable ?? panel)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (panel?.open) panel.close();
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[1px] animate-fade-in"
      />
      <dialog
        ref={panelRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
        className={cn(
          "relative z-10 m-0 w-full max-w-lg rounded-t-lg border border-border bg-popover p-6 text-foreground shadow-elevated animate-fade-in backdrop:bg-transparent sm:rounded-lg",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-xl font-semibold tracking-tight text-foreground"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            data-dialog-close
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </dialog>
    </div>
  );
}
