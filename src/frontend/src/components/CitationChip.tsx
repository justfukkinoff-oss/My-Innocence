import type { Passage } from "@/backend";
import { formatLocator } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface CitationChipProps {
  passage: Passage;
  filename?: string;
  className?: string;
}

/** The signature detail: a mono `file · p.14 · ¶3` locator tag. */
export function CitationChip({
  passage,
  filename,
  className,
}: CitationChipProps) {
  return (
    <span
      className={cn(
        "citation-locator inline-flex max-w-full items-center gap-1.5 rounded border border-border bg-muted px-1.5 py-0.5 text-muted-foreground",
        className,
      )}
    >
      <FileText aria-hidden="true" className="size-3 shrink-0" />
      <span className="truncate">{formatLocator(passage, filename)}</span>
    </span>
  );
}
