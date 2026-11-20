import type { CaseFile } from "@/backend";
import { FileList } from "@/components/FileList";
import { FileReader } from "@/components/FileReader";
import { FileUploader } from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useCaseFiles, useProject } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { pluralize } from "@/lib/format";
import { describeIndexing } from "@/lib/status";
import { useParams } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { useState } from "react";

export default function ProjectDetailPage() {
  const { projectId } = useParams({ from: "/projects/$projectId" });
  const id = BigInt(projectId);
  const project = useProject(id);
  const files = useCaseFiles(id);
  const [openFile, setOpenFile] = useState<CaseFile | null>(null);

  const list = files.data ?? [];
  const ready = list.filter(
    (file) => describeIndexing(file.indexingStatus).label === "Ready",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <ButtonLink
          to="/projects"
          variant="ghost"
          size="sm"
          className="-ml-2"
          data-ocid="project.back_link"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All projects
        </ButtonLink>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
          {project.data?.name ?? "Project"}
        </h1>
        {project.data?.caption && (
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {project.data.caption}
          </p>
        )}
        {list.length > 0 && (
          <p className="citation-locator mt-2 text-muted-foreground">
            {pluralize(list.length, "file")} · {ready} ready to cite
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add case files</CardTitle>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Upload the petition, state court opinions, and transcripts. Docket
            extracts the text and indexes every page and paragraph so citations
            can be traced back to the source.
          </p>
        </CardHeader>
        <CardContent>
          <FileUploader projectId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Case files</CardTitle>
          {list.length > 0 && (
            <span className="citation-locator text-muted-foreground">
              {list.length} total
            </span>
          )}
        </CardHeader>
        <CardContent>
          {files.isPending && (
            <div data-ocid="project.files_loading_state">
              <SkeletonRows rows={3} />
            </div>
          )}
          {files.isError && (
            <div data-ocid="project.files_error_state">
              <ErrorState
                title="Could not load case files"
                message={trapMessage(files.error)}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void files.refetch()}
                    data-ocid="project.files_retry_button"
                  >
                    Retry
                  </Button>
                }
              />
            </div>
          )}
          {files.data && files.data.length === 0 && (
            <div data-ocid="project.files_empty_state">
              <EmptyState
                icon={<FileText aria-hidden="true" className="size-5" />}
                title="No case files yet"
                description="Upload your first document above. Once indexed, every passage becomes citable by page and paragraph."
              />
            </div>
          )}
          {files.data && files.data.length > 0 && (
            <FileList files={files.data} onOpen={setOpenFile} />
          )}
        </CardContent>
      </Card>

      <FileReader file={openFile} onClose={() => setOpenFile(null)} />
    </div>
  );
}
