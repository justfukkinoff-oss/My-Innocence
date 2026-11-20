import type { DraftType } from "@/backend";
import { DraftType as DraftTypeEnum } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useCreateDraft, useDrafts, useProjects } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { formatRelative } from "@/lib/format";
import { Link, useNavigate } from "@tanstack/react-router";
import { PenLine, Plus } from "lucide-react";
import { useState } from "react";

const DRAFT_TYPES: { value: DraftType; label: string; blurb: string }[] = [
  {
    value: DraftTypeEnum.petition,
    label: "Petition for writ of habeas corpus",
    blurb: "The §2254 petition itself, with grounds and supporting facts.",
  },
  {
    value: DraftTypeEnum.memorandum,
    label: "Memorandum of law",
    blurb: "Argument on the legal standard and the record.",
  },
  {
    value: DraftTypeEnum.motion,
    label: "Motion",
    blurb: "A request to the court, with its supporting basis.",
  },
  {
    value: DraftTypeEnum.reply,
    label: "Reply",
    blurb: "Answer the state's response point by point.",
  },
  {
    value: DraftTypeEnum.noticeOfExhaustion,
    label: "Notice of exhaustion",
    blurb: "Show that state remedies were exhausted.",
  },
];

const TYPE_LABEL = new Map(DRAFT_TYPES.map((t) => [t.value, t.label]));

function typeLabel(type: DraftType): string {
  return TYPE_LABEL.get(type) ?? "Draft";
}

export default function DraftsPage() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState<bigint | null>(null);
  const selectedProject =
    projects.data?.find((p) => p.id === projectId) ??
    projects.data?.[0] ??
    null;
  const drafts = useDrafts(selectedProject?.id ?? null);
  const createDraft = useCreateDraft();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [draftType, setDraftType] = useState<DraftType>(DraftTypeEnum.petition);
  const [title, setTitle] = useState("");

  function openCreate() {
    setDraftType(DraftTypeEnum.petition);
    setTitle("");
    createDraft.reset();
    setOpen(true);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    createDraft.mutate(
      { projectId: selectedProject.id, draftType, title: trimmed },
      {
        onSuccess: (draft) => {
          setOpen(false);
          void navigate({
            to: "/drafts/$draftId",
            params: { draftId: draft.id.toString() },
          });
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Drafting
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
            Drafts
          </h1>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Petitions, memoranda, and motions, autosaved with a version history
            and exportable to DOCX.
          </p>
        </div>
        {selectedProject && (
          <Button
            variant="primary"
            onClick={openCreate}
            data-ocid="drafts.new_button"
          >
            <Plus aria-hidden="true" className="size-4" />
            New draft
          </Button>
        )}
      </header>

      {projects.isPending && <SkeletonRows rows={3} />}

      {projects.isError && (
        <ErrorState
          title="Could not load drafts"
          message={trapMessage(projects.error)}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void projects.refetch()}
              data-ocid="drafts.retry_button"
            >
              Retry
            </Button>
          }
        />
      )}

      {projects.data && !selectedProject && (
        <EmptyState
          icon={<PenLine aria-hidden="true" className="size-5" />}
          title="Create a project first"
          description="Drafts belong to a project. Create one for your matter, then start drafting."
          action={
            <ButtonLink
              to="/projects"
              variant="primary"
              data-ocid="drafts.projects_link"
            >
              Go to projects
            </ButtonLink>
          }
        />
      )}

      {projects.data && projects.data.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Project
          </span>
          {projects.data.map((project) => (
            <Button
              key={project.id.toString()}
              variant={
                project.id === selectedProject?.id ? "primary" : "secondary"
              }
              size="sm"
              onClick={() => setProjectId(project.id)}
              data-ocid={`drafts.project_tab.${project.id.toString()}`}
            >
              {project.name}
            </Button>
          ))}
        </div>
      )}

      {selectedProject && drafts.isPending && <SkeletonRows rows={3} />}

      {selectedProject && drafts.isError && (
        <ErrorState
          title="Could not load drafts"
          message={trapMessage(drafts.error)}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void drafts.refetch()}
              data-ocid="drafts.list_retry_button"
            >
              Retry
            </Button>
          }
        />
      )}

      {selectedProject && drafts.data && drafts.data.length === 0 && (
        <EmptyState
          icon={<PenLine aria-hidden="true" className="size-5" />}
          title="No drafts yet"
          description={`No drafts in ${selectedProject.name}. Start a petition, memorandum, or motion for this matter.`}
          action={
            <Button
              variant="primary"
              onClick={openCreate}
              data-ocid="drafts.empty_new_button"
            >
              <Plus aria-hidden="true" className="size-4" />
              New draft
            </Button>
          }
        />
      )}

      {selectedProject && drafts.data && drafts.data.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{selectedProject.name}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {drafts.data.length} draft{drafts.data.length === 1 ? "" : "s"}
            </span>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border" data-ocid="drafts.list">
              {drafts.data.map((draft, index) => (
                <li
                  key={draft.id.toString()}
                  data-ocid={`drafts.item.${index + 1}`}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      to="/drafts/$draftId"
                      params={{ draftId: draft.id.toString() }}
                      className="block truncate text-sm font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {draft.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone="primary">{typeLabel(draft.draftType)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Saved {formatRelative(draft.autosavedAt)}
                      </span>
                    </div>
                  </div>
                  <ButtonLink
                    to="/drafts/$draftId"
                    params={{ draftId: draft.id.toString() }}
                    variant="ghost"
                    size="sm"
                    data-ocid={`drafts.open_button.${index + 1}`}
                  >
                    Open
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="New draft"
        description={
          selectedProject
            ? `Start a draft in ${selectedProject.name}.`
            : "Choose a project for this draft."
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              data-ocid="drafts.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="new-draft-form"
              variant="primary"
              disabled={!title.trim() || createDraft.isPending}
              data-ocid="drafts.create_button"
            >
              {createDraft.isPending ? "Creating…" : "Create draft"}
            </Button>
          </>
        }
      >
        <form id="new-draft-form" onSubmit={onSubmit} className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Draft type
            </legend>
            <div className="space-y-1.5">
              {DRAFT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card px-3 py-2 transition-smooth hover:border-input has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="draft-type"
                    value={type.value}
                    checked={draftType === type.value}
                    onChange={() => setDraftType(type.value)}
                    className="mt-1 size-3.5 accent-primary"
                    data-ocid={`drafts.type_radio.${type.value}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {type.label}
                    </span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      {type.blurb}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <Label htmlFor="new-draft-title">Title</Label>
            <Input
              id="new-draft-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Petition for Writ of Habeas Corpus"
              data-ocid="drafts.title_input"
            />
          </div>

          {createDraft.isError && (
            <p role="alert" className="text-sm text-destructive">
              {trapMessage(createDraft.error)}
            </p>
          )}
        </form>
      </Dialog>
    </div>
  );
}
