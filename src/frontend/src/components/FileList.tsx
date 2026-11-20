import type { CaseFile } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteCaseFile, useRetryFileIndexing } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { formatFileSize, formatRelative } from "@/lib/format";
import { describeIndexing, indexingFailureReason } from "@/lib/status";
import { cn } from "@/lib/utils";
import { BookOpen, FileText, Loader2, RotateCw, Trash2 } from "lucide-react";
import { useState } from "react";

const TYPE_LABEL: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "text/plain": "TXT",
};

function typeLabel(file: CaseFile): string {
  return (
    TYPE_LABEL[file.mimeType] ??
    file.mimeType.split("/").pop()?.toUpperCase() ??
    "File"
  );
}

interface FileListProps {
  files: CaseFile[];
  onOpen: (file: CaseFile) => void;
}

export function FileList({ files, onOpen }: FileListProps) {
  const retry = useRetryFileIndexing();
  const remove = useDeleteCaseFile();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleRetry(file: CaseFile) {
    setActionError(null);
    retry.mutate(file.id, {
      onError: (error) => setActionError(trapMessage(error)),
    });
  }

  function handleDelete(file: CaseFile) {
    setActionError(null);
    remove.mutate(file.id, {
      onSuccess: () => setConfirmingId(null),
      onError: (error) => setActionError(trapMessage(error)),
    });
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <p role="alert" className="text-xs text-destructive">
          {actionError}
        </p>
      )}
      <ul className="divide-y divide-border" data-ocid="project.files_list">
        {files.map((file, index) => {
          const status = describeIndexing(file.indexingStatus);
          const reason = indexingFailureReason(file.indexingStatus);
          const fileId = file.id.toString();
          const isConfirming = confirmingId === fileId;
          const retrying =
            retry.isPending && retry.variables?.toString() === fileId;
          const deleting =
            remove.isPending && remove.variables?.toString() === fileId;

          return (
            <li
              key={fileId}
              data-ocid={`project.file.${index + 1}`}
              className="animate-fade-in py-3"
            >
              <div className="flex items-start gap-3">
                <FileText
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="min-w-0 truncate text-sm font-medium text-foreground">
                      {file.filename}
                    </p>
                    {file.version > 1n && (
                      <span className="citation-locator rounded border border-border bg-muted px-1.5 py-0.5 text-muted-foreground">
                        v{file.version.toString()}
                      </span>
                    )}
                    <Badge tone={status.tone} pulse={status.pulse}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="citation-locator mt-1 text-muted-foreground">
                    {typeLabel(file)} · {formatFileSize(file.sizeBytes)} ·{" "}
                    {file.pageCount.toString()} pp ·{" "}
                    {formatRelative(file.uploadedAt)}
                  </p>
                  {reason && (
                    <p className="mt-1 text-xs leading-relaxed text-destructive">
                      {reason}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpen(file)}
                    data-ocid={`project.open_button.${index + 1}`}
                  >
                    <BookOpen aria-hidden="true" className="size-4" />
                    Read
                  </Button>
                  {file.indexingStatus.__kind__ === "failed" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRetry(file)}
                      disabled={retrying}
                      data-ocid={`project.retry_button.${index + 1}`}
                    >
                      {retrying ? (
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                      ) : (
                        <RotateCw aria-hidden="true" className="size-4" />
                      )}
                      Retry
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setConfirmingId(isConfirming ? null : fileId)
                    }
                    aria-label={`Delete ${file.filename}`}
                    className={cn(
                      "text-muted-foreground hover:text-destructive",
                    )}
                    data-ocid={`project.delete_button.${index + 1}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </div>

              {isConfirming && (
                <div className="mt-2 flex flex-wrap items-center justify-end gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2">
                  <p className="mr-auto text-xs text-muted-foreground">
                    Delete this file and its indexed passages?
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingId(null)}
                    data-ocid={`project.delete_cancel_button.${index + 1}`}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(file)}
                    disabled={deleting}
                    data-ocid={`project.delete_confirm_button.${index + 1}`}
                  >
                    {deleting ? "Deleting…" : "Delete file"}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
