import type { Draft, DraftSection, RetrievalResult } from "@/backend";
import { CitationChip } from "@/components/CitationChip";
import {
  DraftEditor,
  SaveIndicator,
  type SaveState,
} from "@/components/DraftEditor";
import { DraftOutline } from "@/components/DraftOutline";
import { ModelKeyBlocked } from "@/components/ModelKeyBlocked";
import { VersionHistory } from "@/components/VersionHistory";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { ErrorState, LoadingState } from "@/components/ui/states";
import {
  useAutosaveDraft,
  useDeleteDraft,
  useDraft,
  useExportDraftDocx,
  useModelKeyStatus,
  useRestoreDraftVersion,
  useRetrievePassages,
} from "@/hooks/useQueries";
import { downloadBytes } from "@/lib/download";
import { isMissingModelKey, trapMessage } from "@/lib/errors";
import { formatDateTime, formatLocator } from "@/lib/format";
import { useBlocker, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Download, FileSearch, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTOSAVE_DELAY_MS = 1200;

const EXPORT_OPTIONS = {
  caption: "IN THE UNITED STATES DISTRICT COURT",
  disclaimer:
    "Prepared with Docket. This document is not legal advice and no attorney-client relationship is created.",
};

function newSectionId(): bigint {
  return BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
}

function toSections(draft: Draft): DraftSection[] {
  return draft.sections.map((section) => ({ ...section }));
}

export default function DraftEditorPage() {
  const { draftId } = useParams({ from: "/drafts/$draftId" });
  const id = BigInt(draftId);
  const draft = useDraft(id);

  if (draft.isPending) {
    return <LoadingState label="Opening draft…" />;
  }

  if (draft.isError || !draft.data) {
    return (
      <ErrorState
        title="Could not open this draft"
        message={
          draft.error ? trapMessage(draft.error) : "The draft was not found."
        }
        action={
          <ButtonLink
            to="/drafts"
            variant="secondary"
            size="sm"
            data-ocid="draft.back_link"
          >
            Back to drafts
          </ButtonLink>
        }
      />
    );
  }

  return <DraftWorkspace draft={draft.data} />;
}

function DraftWorkspace({ draft }: { draft: Draft }) {
  const navigate = useNavigate();
  const autosave = useAutosaveDraft();
  const restore = useRestoreDraftVersion();
  const remove = useDeleteDraft();
  const exportDocx = useExportDraftDocx();
  const keyStatus = useModelKeyStatus();
  const keyMissing = keyStatus.data?.configured === false;

  const [title, setTitle] = useState(draft.title);
  const [sections, setSections] = useState<DraftSection[]>(() =>
    toSections(draft),
  );
  const [activeId, setActiveId] = useState<string | null>(
    draft.sections[0]?.id.toString() ?? null,
  );
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<string>(() =>
    formatDateTime(draft.autosavedAt),
  );
  const [exportMessage, setExportMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursor = useRef<number | null>(null);
  const latest = useRef({ title, sections });
  latest.current = { title, sections };

  const dirty = saveState === "dirty" || saveState === "error";

  const save = useCallback(() => {
    const snapshot = latest.current;
    setSaveState("saving");
    autosave.mutate(
      {
        id: draft.id,
        content: {
          title: snapshot.title.trim() || "Untitled draft",
          sections: snapshot.sections,
        },
      },
      {
        onSuccess: (saved) => {
          setSavedAt(formatDateTime(saved.autosavedAt));
          setSaveState("saved");
        },
        onError: () => setSaveState("error"),
      },
    );
  }, [autosave, draft.id]);

  // Debounced autosave: any edit schedules one save after a short pause.
  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = window.setTimeout(save, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [saveState, save]);

  // Warn before leaving with unsaved changes.
  useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: () => dirty,
    disabled: !dirty,
  });

  // Place the caret after an inserted passage once the body re-renders.
  useEffect(() => {
    const cursor = pendingCursor.current;
    if (cursor === null || !bodyRef.current) return;
    bodyRef.current.focus();
    bodyRef.current.setSelectionRange(cursor, cursor);
    pendingCursor.current = null;
  }, []);

  function markDirty() {
    setSaveState("dirty");
  }

  function updateTitle(next: string) {
    setTitle(next);
    markDirty();
  }

  function updateSection(sectionId: string, patch: Partial<DraftSection>) {
    setSections((current) =>
      current.map((section) =>
        section.id.toString() === sectionId
          ? { ...section, ...patch }
          : section,
      ),
    );
    markDirty();
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    setSections((current) => {
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
    markDirty();
  }

  function addSection() {
    const section: DraftSection = {
      id: newSectionId(),
      heading: `Section ${sections.length + 1}`,
      body: "",
    };
    setSections((current) => [...current, section]);
    setActiveId(section.id.toString());
    markDirty();
  }

  function removeSection(sectionId: string) {
    setSections((current) => {
      const next = current.filter((s) => s.id.toString() !== sectionId);
      if (activeId === sectionId) {
        setActiveId(next[0]?.id.toString() ?? null);
      }
      return next;
    });
    markDirty();
  }

  function insertPassage(text: string) {
    const section = sections.find((s) => s.id.toString() === activeId);
    if (!section) return;
    const textarea = bodyRef.current;
    const start = textarea?.selectionStart ?? section.body.length;
    const end = textarea?.selectionEnd ?? section.body.length;
    const before = section.body.slice(0, start);
    const after = section.body.slice(end);
    const lead = before && !before.endsWith("\n") ? "\n\n" : "";
    const trail = after && !after.startsWith("\n") ? "\n\n" : "";
    const inserted = `${lead}${text}${trail}`;
    const nextBody = `${before}${inserted}${after}`;
    pendingCursor.current = start + inserted.length;
    updateSection(section.id.toString(), { body: nextBody });
  }

  function onRestore(version: bigint) {
    restore.mutate(
      { id: draft.id, version },
      {
        onSuccess: (restored) => {
          setTitle(restored.title);
          setSections(toSections(restored));
          setActiveId(restored.sections[0]?.id.toString() ?? null);
          setSavedAt(formatDateTime(restored.autosavedAt));
          setSaveState("saved");
        },
      },
    );
  }

  function onExport() {
    setExportMessage(null);
    exportDocx.mutate(
      { draftId: draft.id, options: EXPORT_OPTIONS },
      {
        onSuccess: (doc) => {
          downloadBytes(doc.bytes, doc.filename);
          setExportMessage({
            tone: "success",
            text: `Exported ${doc.filename}.`,
          });
        },
        onError: (error) => {
          setExportMessage({
            tone: "error",
            text: `Export failed: ${trapMessage(error)}`,
          });
        },
      },
    );
  }

  function onDelete() {
    remove.mutate(draft.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        void navigate({ to: "/drafts" });
      },
    });
  }

  const activeIndex = sections.findIndex((s) => s.id.toString() === activeId);
  const activeSection = activeIndex >= 0 ? sections[activeIndex] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <ButtonLink
            to="/drafts"
            variant="ghost"
            size="sm"
            className="-ml-2"
            data-ocid="draft.back_link"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            All drafts
          </ButtonLink>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <SaveIndicator state={saveState} savedAt={savedAt} />
            <span className="text-xs text-muted-foreground">
              {sections.length} section{sections.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            disabled={exportDocx.isPending}
            data-ocid="draft.export_button"
          >
            <Download aria-hidden="true" className="size-4" />
            {exportDocx.isPending ? "Exporting…" : "Export DOCX"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            data-ocid="draft.delete_button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      {exportMessage && (
        <output
          data-ocid={
            exportMessage.tone === "success"
              ? "draft.export_success"
              : "draft.export_error"
          }
          className={
            exportMessage.tone === "success"
              ? "block rounded-md border border-success/25 bg-success/10 px-4 py-2.5 text-sm text-success"
              : "block rounded-md border border-destructive/25 bg-destructive/5 px-4 py-2.5 text-sm text-destructive"
          }
        >
          {exportMessage.text}
        </output>
      )}

      {restore.isError && (
        <ErrorState
          title="Could not restore that version"
          message={trapMessage(restore.error)}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_17rem]">
        <Card className="overflow-hidden">
          <DraftOutline
            sections={sections}
            activeId={activeId}
            onSelect={setActiveId}
            onMove={moveSection}
            onRename={(sectionId, heading) =>
              updateSection(sectionId, { heading })
            }
            onAdd={addSection}
            onRemove={removeSection}
          />
        </Card>

        <Card className="overflow-hidden">
          <DraftEditor
            section={activeSection}
            index={activeIndex}
            total={sections.length}
            title={title}
            onTitleChange={updateTitle}
            onHeadingChange={(heading) => {
              if (activeSection) {
                updateSection(activeSection.id.toString(), { heading });
              }
            }}
            onBodyChange={(body) => {
              if (activeSection) {
                updateSection(activeSection.id.toString(), { body });
              }
            }}
            bodyRef={bodyRef}
            onPrev={() => {
              const prev = sections[activeIndex - 1];
              if (prev) setActiveId(prev.id.toString());
            }}
            onNext={() => {
              const next = sections[activeIndex + 1];
              if (next) setActiveId(next.id.toString());
            }}
          />
        </Card>

        <div className="space-y-4">
          <PassagePanel
            keyMissing={keyMissing}
            activeSection={activeSection}
            onInsert={insertPassage}
          />
          <Card className="overflow-hidden">
            <VersionHistory
              versions={draft.versions}
              onRestore={onRestore}
              restoringVersion={
                restore.isPending ? (restore.variables?.version ?? null) : null
              }
              disabled={saveState === "saving"}
            />
          </Card>
        </div>
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this draft?"
        description="The draft and its version history will be removed. This cannot be undone."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              data-ocid="draft.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={remove.isPending}
              data-ocid="draft.delete_confirm_button"
            >
              {remove.isPending ? "Deleting…" : "Delete draft"}
            </Button>
          </>
        }
      >
        {remove.isError && (
          <p role="alert" className="text-sm text-destructive">
            {trapMessage(remove.error)}
          </p>
        )}
      </Dialog>
    </div>
  );
}

interface PassagePanelProps {
  keyMissing: boolean;
  activeSection: DraftSection | null;
  onInsert: (text: string) => void;
}

/** Search the library and insert a passage with its citation at the cursor. */
function PassagePanel({
  keyMissing,
  activeSection,
  onInsert,
}: PassagePanelProps) {
  const retrieve = useRetrievePassages();
  const [question, setQuestion] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    retrieve.mutate({
      question: trimmed,
      scope: { __kind__: "library", library: null },
    });
  }

  const result: RetrievalResult | undefined = retrieve.data;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <FileSearch
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Insert from library
        </p>
      </div>
      <CardContent className="space-y-3 p-4">
        {keyMissing ? (
          <ModelKeyBlocked action="search your library" />
        ) : (
          <form onSubmit={onSubmit} className="space-y-2">
            <Label htmlFor="passage-question">Find a passage</Label>
            <Input
              id="passage-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What did the state court hold?"
              data-ocid="draft.passage_question_input"
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={!question.trim() || retrieve.isPending}
              data-ocid="draft.passage_search_button"
            >
              {retrieve.isPending ? "Searching…" : "Search library"}
            </Button>
          </form>
        )}

        {retrieve.isError &&
          (isMissingModelKey(retrieve.error) ? (
            <ModelKeyBlocked action="search your library" />
          ) : (
            <ErrorState
              title="Search failed"
              message={trapMessage(retrieve.error)}
            />
          ))}

        {result?.__kind__ === "notFoundInLibrary" && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Nothing in your library matches that. Try different wording.
          </p>
        )}

        {result?.__kind__ === "found" && (
          <ul className="space-y-2" data-ocid="draft.passage_results">
            {result.found.passages.map((cited, index) => (
              <li
                key={cited.passage.id.toString()}
                data-ocid={`draft.passage_result.${index + 1}`}
                className="rounded-md border border-border bg-card p-3"
              >
                <CitationChip
                  passage={cited.passage}
                  filename={cited.filename}
                />
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-foreground/85">
                  {cited.passage.text}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  disabled={!activeSection}
                  onClick={() =>
                    onInsert(
                      `"${cited.passage.text}" (${formatLocator(
                        cited.passage,
                        cited.filename,
                      )})`,
                    )
                  }
                  data-ocid={`draft.insert_passage_button.${index + 1}`}
                >
                  <Plus aria-hidden="true" className="size-3.5" />
                  Insert at cursor
                </Button>
              </li>
            ))}
          </ul>
        )}

        {!activeSection && (
          <p className="text-xs text-muted-foreground">
            Select a section to insert a passage.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
