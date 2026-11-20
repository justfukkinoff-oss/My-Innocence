import type { CitedPassage } from "@/backend";
import { CitationChip } from "@/components/CitationChip";
import { formatLocator } from "@/lib/format";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

interface SourceCitationProps {
  cited: CitedPassage;
  /** 1-based position, used for the deterministic marker. */
  index: number;
  /** Open the source text on first render. */
  defaultOpen?: boolean;
}

/**
 * A cited passage: the mono locator chip doubles as the disclosure control,
 * expanding inline to the exact source text so the reader can verify it.
 */
export function SourceCitation({
  cited,
  index,
  defaultOpen = false,
}: SourceCitationProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const { passage, filename } = cited;

  return (
    <div
      data-ocid={`research.citation.${index}`}
      className="rounded-md border border-border bg-card"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        data-ocid={`research.citation_toggle.${index}`}
        className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-smooth hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      >
        <CitationChip passage={passage} filename={filename} />
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {open ? "Hide source" : "View source"}
          <ChevronDown
            aria-hidden="true"
            className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          data-ocid={`research.citation_source.${index}`}
          className="animate-fade-in border-t border-border bg-muted/30 px-4 py-3"
        >
          <p className="citation-locator mb-2 text-muted-foreground">
            {formatLocator(passage, filename)}
          </p>
          <blockquote className="prose-legal border-l-2 border-accent/60 pl-3 text-sm text-foreground/90">
            {passage.text}
          </blockquote>
        </div>
      )}
    </div>
  );
}
