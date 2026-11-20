import type { DraftSection } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, CloudOff, Loader2 } from "lucide-react";
import type { RefObject } from "react";

export type SaveState = "saved" | "dirty" | "saving" | "error";

const SAVE_COPY: Record<SaveState, { label: string; tone: string }> = {
  saved: { label: "All changes saved", tone: "text-success" },
  dirty: { label: "Unsaved changes", tone: "text-warning-foreground" },
  saving: { label: "Saving…", tone: "text-muted-foreground" },
  error: { label: "Could not save", tone: "text-destructive" },
};

/** The visible saved-state indicator, shared by the header and the editor. */
export function SaveIndicator({
  state,
  savedAt,
  className,
}: {
  state: SaveState;
  savedAt?: string;
  className?: string;
}) {
  const copy = SAVE_COPY[state];
  return (
    <output
      aria-live="polite"
      data-ocid="draft.save_state"
      data-state={state}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        copy.tone,
        className,
      )}
    >
      {state === "saving" ? (
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
      ) : state === "error" ? (
        <CloudOff aria-hidden="true" className="size-3.5" />
      ) : (
        <Check aria-hidden="true" className="size-3.5" />
      )}
      <span>{copy.label}</span>
      {state === "saved" && savedAt && (
        <span className="font-normal text-muted-foreground">· {savedAt}</span>
      )}
    </output>
  );
}

interface DraftEditorProps {
  section: DraftSection | null;
  index: number;
  total: number;
  title: string;
  onTitleChange: (title: string) => void;
  onHeadingChange: (heading: string) => void;
  onBodyChange: (body: string) => void;
  bodyRef: RefObject<HTMLTextAreaElement | null>;
  onPrev: () => void;
  onNext: () => void;
}

/** The writing surface: draft title, section heading, and long-form body. */
export function DraftEditor({
  section,
  index,
  total,
  title,
  onTitleChange,
  onHeadingChange,
  onBodyChange,
  bodyRef,
  onPrev,
  onNext,
}: DraftEditorProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4 sm:px-8">
        <Label htmlFor="draft-title">Draft title</Label>
        <Input
          id="draft-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Untitled draft"
          className="h-11 border-transparent bg-transparent px-0 font-display text-2xl font-semibold tracking-tight focus-visible:ring-0 focus-visible:ring-offset-0"
          data-ocid="draft.title_input"
        />
      </div>

      {section ? (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 sm:px-8">
          <div className="mx-auto max-w-[68ch]">
            <div className="flex items-center justify-between gap-3">
              <p className="citation-locator text-muted-foreground">
                Section {index + 1} of {total}
              </p>
            </div>
            <Label htmlFor="section-heading" className="mt-3">
              Section heading
            </Label>
            <Input
              id="section-heading"
              value={section.heading}
              onChange={(event) => onHeadingChange(event.target.value)}
              placeholder="Heading"
              className="h-10 font-display text-lg font-semibold"
              data-ocid="draft.section_heading_input"
            />
            <Label htmlFor="section-body" className="mt-4">
              Body
            </Label>
            <textarea
              id="section-body"
              ref={bodyRef}
              value={section.body}
              onChange={(event) => onBodyChange(event.target.value)}
              placeholder="Write this section. Insert a library passage from the panel to quote it with its citation."
              className="min-h-[22rem] w-full resize-y rounded-md border border-input bg-card px-3 py-2 font-body text-[15px] leading-[1.75] text-foreground placeholder:text-muted-foreground/70 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              data-ocid="draft.section_body_input"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
          <div className="max-w-sm">
            <p className="font-display text-lg font-semibold text-foreground">
              No section selected
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Add a section from the outline to start writing this draft.
            </p>
          </div>
        </div>
      )}

      {section && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3 sm:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={index === 0}
            data-ocid="draft.prev_section_button"
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={index >= total - 1}
            data-ocid="draft.next_section_button"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
