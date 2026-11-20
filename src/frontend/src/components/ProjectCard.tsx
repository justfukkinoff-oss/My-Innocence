import type { Project } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDeleteProject } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { formatRelative, pluralize } from "@/lib/format";
import { describeIndexing, indexingFailureReason } from "@/lib/status";
import { Link } from "@tanstack/react-router";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface ProjectCardProps {
  project: Project;
  /** 1-based position, used for deterministic test markers. */
  position: number;
  onRename: (project: Project) => void;
}

/** One matter in the library: name, caption, activity, files, index status. */
export function ProjectCard({ project, position, onRename }: ProjectCardProps) {
  const status = describeIndexing(project.indexingStatus);
  const failure = indexingFailureReason(project.indexingStatus);
  const remove = useDeleteProject();
  const [confirming, setConfirming] = useState(false);

  const fileCount = Number(project.fileCount);

  return (
    <Card
      data-ocid={`projects.item.${position}`}
      className="flex h-full flex-col transition-smooth hover:shadow-elevated"
    >
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0">
            <Link
              to="/projects/$projectId"
              params={{ projectId: project.id.toString() }}
              data-ocid={`projects.link.${position}`}
              className="block truncate rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {project.name}
            </Link>
          </CardTitle>
          <Badge tone={status.tone} pulse={status.pulse}>
            {status.label}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {project.caption || "No case caption yet."}
        </CardDescription>
        {failure && (
          <p className="mt-2 text-xs leading-relaxed text-destructive">
            Indexing failed: {failure}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText aria-hidden="true" className="size-3.5" />
            <dt className="sr-only">Case files</dt>
            <dd>{pluralize(fileCount, "file")}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Last activity</dt>
            <dd>Active {formatRelative(project.lastActivityAt)}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id.toString() }}
            data-ocid={`projects.open_link.${position}`}
            className="text-xs font-semibold text-primary underline-offset-4 transition-smooth hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Open case files
          </Link>

          {confirming ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => remove.mutate(project.id)}
                disabled={remove.isPending}
                data-ocid={`projects.confirm_delete_button.${position}`}
              >
                {remove.isPending ? "Deleting…" : "Delete"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={remove.isPending}
                data-ocid={`projects.cancel_delete_button.${position}`}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRename(project)}
                aria-label={`Rename ${project.name}`}
                data-ocid={`projects.rename_button.${position}`}
              >
                <Pencil aria-hidden="true" className="size-3.5" />
                Rename
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(true)}
                aria-label={`Delete ${project.name}`}
                data-ocid={`projects.delete_button.${position}`}
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {remove.isError && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {trapMessage(remove.error)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
