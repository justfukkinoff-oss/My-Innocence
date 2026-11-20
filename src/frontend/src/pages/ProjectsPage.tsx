import type { Project } from "@/backend";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectFormDialog } from "@/components/ProjectFormDialog";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useProjects } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { useNavigate } from "@tanstack/react-router";
import { FolderOpen, Plus } from "lucide-react";
import { useState } from "react";

type DialogState =
  | { mode: "create" }
  | { mode: "rename"; project: Project }
  | null;

export default function ProjectsPage() {
  const projects = useProjects();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<DialogState>(null);

  const count = projects.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Library
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Each project holds one matter: its case files, indexed passages,
            drafts, and citation checks.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setDialog({ mode: "create" })}
          data-ocid="projects.new_button"
        >
          <Plus aria-hidden="true" className="size-4" />
          New project
        </Button>
      </header>

      {projects.isPending && (
        <div data-ocid="projects.loading_state">
          <SkeletonRows rows={4} />
        </div>
      )}

      {projects.isError && (
        <div data-ocid="projects.error_state">
          <ErrorState
            title="Could not load your projects"
            message={trapMessage(projects.error)}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void projects.refetch()}
                data-ocid="projects.retry_button"
              >
                Retry
              </Button>
            }
          />
        </div>
      )}

      {projects.data && count === 0 && (
        <div data-ocid="projects.empty_state">
          <EmptyState
            icon={<FolderOpen aria-hidden="true" className="size-5" />}
            title="No projects yet"
            description="Create a project for your matter, then upload the record — the petition, state court opinions, and transcripts."
            action={
              <Button
                variant="primary"
                onClick={() => setDialog({ mode: "create" })}
                data-ocid="projects.empty_new_button"
              >
                <Plus aria-hidden="true" className="size-4" />
                Create your first project
              </Button>
            }
          />
        </div>
      )}

      {projects.data && count > 0 && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {count} {count === 1 ? "matter" : "matters"}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2" data-ocid="projects.list">
            {projects.data.map((project, index) => (
              <li key={project.id.toString()} className="min-w-0">
                <ProjectCard
                  project={project}
                  position={index + 1}
                  onRename={(target) =>
                    setDialog({ mode: "rename", project: target })
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <ProjectFormDialog
        open={dialog !== null}
        mode={dialog?.mode ?? "create"}
        project={dialog?.mode === "rename" ? dialog.project : null}
        onClose={() => setDialog(null)}
        onCreated={(id) =>
          void navigate({
            to: "/projects/$projectId",
            params: { projectId: id.toString() },
          })
        }
      />
    </div>
  );
}
