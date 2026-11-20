import type { DraftSection } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface DraftOutlineProps {
  sections: DraftSection[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRename: (id: string, heading: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

/** Ordered section outline: select, reorder, rename, add, remove. */
export function DraftOutline({
  sections,
  activeId,
  onSelect,
  onMove,
  onRename,
  onAdd,
  onRemove,
}: DraftOutlineProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftHeading, setDraftHeading] = useState("");

  function startRename(section: DraftSection) {
    setEditingId(section.id.toString());
    setDraftHeading(section.heading);
  }

  function commitRename(id: string) {
    const trimmed = draftHeading.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Outline
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          data-ocid="draft.add_section_button"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            This draft has no sections yet.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={onAdd}
            data-ocid="draft.empty_add_section_button"
          >
            <Plus aria-hidden="true" className="size-3.5" />
            Add first section
          </Button>
        </div>
      ) : (
        <ol className="flex-1 space-y-1 overflow-y-auto scrollbar-thin p-2">
          {sections.map((section, index) => {
            const id = section.id.toString();
            const active = id === activeId;
            const editing = id === editingId;
            return (
              <li key={id} data-ocid={`draft.outline_item.${index + 1}`}>
                <div
                  className={cn(
                    "group rounded-md border px-2 py-1.5 transition-smooth",
                    active
                      ? "border-primary/30 bg-primary/5"
                      : "border-transparent hover:bg-secondary/60",
                  )}
                >
                  {editing ? (
                    <form
                      className="flex items-center gap-1"
                      onSubmit={(event) => {
                        event.preventDefault();
                        commitRename(id);
                      }}
                    >
                      <Input
                        value={draftHeading}
                        onChange={(event) =>
                          setDraftHeading(event.target.value)
                        }
                        aria-label="Section heading"
                        className="h-8 text-[13px]"
                        data-ocid={`draft.heading_input.${index + 1}`}
                      />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        aria-label="Save heading"
                        data-ocid={`draft.heading_save_button.${index + 1}`}
                      >
                        <Check aria-hidden="true" className="size-3.5" />
                      </Button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelect(id)}
                        data-ocid={`draft.outline_select.${index + 1}`}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="citation-locator w-5 shrink-0 text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={cn(
                            "truncate text-[13px]",
                            active
                              ? "font-semibold text-foreground"
                              : "text-foreground/85",
                          )}
                        >
                          {section.heading || "Untitled section"}
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center">
                        <button
                          type="button"
                          onClick={() => startRename(section)}
                          aria-label={`Rename ${section.heading || "section"}`}
                          data-ocid={`draft.rename_button.${index + 1}`}
                          className="flex size-11 items-center justify-center rounded text-muted-foreground hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMove(index, -1)}
                          disabled={index === 0}
                          aria-label="Move section up"
                          data-ocid={`draft.move_up_button.${index + 1}`}
                          className="flex size-11 items-center justify-center rounded text-muted-foreground hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                        >
                          <ArrowUp aria-hidden="true" className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMove(index, 1)}
                          disabled={index === sections.length - 1}
                          aria-label="Move section down"
                          data-ocid={`draft.move_down_button.${index + 1}`}
                          className="flex size-11 items-center justify-center rounded text-muted-foreground hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                        >
                          <ArrowDown aria-hidden="true" className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(id)}
                          aria-label={`Remove ${section.heading || "section"}`}
                          data-ocid={`draft.remove_section_button.${index + 1}`}
                          className="flex size-11 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
