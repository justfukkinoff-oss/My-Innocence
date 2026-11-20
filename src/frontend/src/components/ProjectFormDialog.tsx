import type { Id, Project } from "@/backend";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { useCreateProject, useRenameProject } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { type FormEvent, useEffect, useId, useState } from "react";

type Mode = "create" | "rename";

interface ProjectFormDialogProps {
  open: boolean;
  mode: Mode;
  /** The project being renamed; ignored in create mode. */
  project?: Project | null;
  onClose: () => void;
  /** Called with the new project id after a successful create. */
  onCreated?: (id: Id) => void;
}

const COPY: Record<
  Mode,
  { title: string; description: string; submit: string }
> = {
  create: {
    title: "New project",
    description:
      "Name the matter and add its case caption. You can upload the record next.",
    submit: "Create project",
  },
  rename: {
    title: "Rename project",
    description: "Update the project name and case caption.",
    submit: "Save changes",
  },
};

/** Create-or-rename modal. Owns its own draft state, reset on open. */
export function ProjectFormDialog({
  open,
  mode,
  project,
  onClose,
  onCreated,
}: ProjectFormDialogProps) {
  const nameId = useId();
  const captionId = useId();
  const create = useCreateProject();
  const rename = useRenameProject();
  const mutation = mode === "create" ? create : rename;

  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [touched, setTouched] = useState(false);

  // Seed the draft once each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setName(mode === "rename" ? (project?.name ?? "") : "");
    setCaption(mode === "rename" ? (project?.caption ?? "") : "");
    setTouched(false);
  }, [open, mode, project]);

  const trimmedName = name.trim();
  const nameError =
    touched && trimmedName.length === 0 ? "Enter a project name." : null;
  const copy = COPY[mode];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (trimmedName.length === 0) return;

    const input = { name: trimmedName, caption: caption.trim() };

    if (mode === "create") {
      create.mutate(input, {
        onSuccess: (created) => {
          onCreated?.(created.id);
          onClose();
        },
      });
    } else if (project) {
      rename.mutate({ id: project.id, input }, { onSuccess: () => onClose() });
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="project_form.cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="project-form"
            disabled={mutation.isPending}
            data-ocid="project_form.submit_button"
          >
            {mutation.isPending ? "Saving…" : copy.submit}
          </Button>
        </>
      }
    >
      <form
        id="project-form"
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
      >
        <div>
          <Label htmlFor={nameId}>Project name</Label>
          <Input
            id={nameId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Smith v. Warden"
            autoComplete="off"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${nameId}-error` : undefined}
            data-ocid="project_form.name_input"
          />
          <div id={`${nameId}-error`}>
            <FieldError>{nameError}</FieldError>
          </div>
        </div>

        <div>
          <Label htmlFor={captionId}>Case caption</Label>
          <Textarea
            id={captionId}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="In re: John Doe, No. 24-cv-01234 (E.D. Cal.)"
            rows={3}
            data-ocid="project_form.caption_input"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Optional. The full caption helps you tell matters apart at a glance.
          </p>
        </div>

        {mutation.isError && (
          <FieldError>{trapMessage(mutation.error)}</FieldError>
        )}
      </form>
    </Dialog>
  );
}
