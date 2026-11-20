import type { CaseFile } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useFilePassages } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { formatFileSize } from "@/lib/format";
import { describeIndexing, indexingFailureReason } from "@/lib/status";
import { BookOpen, FileText } from "lucide-react";

interface FileReaderProps {
  file: CaseFile | null;
  onClose: () => void;
}

export function FileReader({ file, onClose }: FileReaderProps) {
  const passages = useFilePassages(file?.id ?? null);
  const status = file ? describeIndexing(file.indexingStatus) : null;
  const reason = file ? indexingFailureReason(file.indexingStatus) : null;

  return (
    <Dialog
      open={file !== null}
      onClose={onClose}
      title={file?.filename ?? "Case file"}
      description={
        file
          ? `${formatFileSize(file.sizeBytes)} · ${file.pageCount.toString()} pp · version ${file.version.toString()}`
          : undefined
      }
      className="max-w-2xl"
      footer={
        <Button
          variant="secondary"
          onClick={onClose}
          data-ocid="reader.close_button"
        >
          Close
        </Button>
      }
    >
      <div className="space-y-4" data-ocid="reader.panel">
        {status && (
          <div className="flex items-center gap-2">
            <Badge tone={status.tone} pulse={status.pulse}>
              {status.label}
            </Badge>
            {passages.data && (
              <span className="citation-locator text-muted-foreground">
                {passages.data.total.toString()} indexed passages
              </span>
            )}
          </div>
        )}

        {reason && (
          <p className="text-xs leading-relaxed text-destructive">{reason}</p>
        )}

        {file && file.indexingStatus.__kind__ !== "indexed" && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Passages appear here once indexing finishes. If it failed, retry
            from the file list.
          </p>
        )}

        {passages.isPending && <SkeletonRows rows={4} />}

        {passages.isError && (
          <ErrorState
            title="Could not load passages"
            message={trapMessage(passages.error)}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void passages.refetch()}
                data-ocid="reader.retry_button"
              >
                Retry
              </Button>
            }
          />
        )}

        {passages.data && passages.data.passages.length === 0 && (
          <EmptyState
            icon={<FileText aria-hidden="true" className="size-5" />}
            title="No passages yet"
            description="This file has no indexed text. Retry indexing from the file list, or upload a text-based copy."
          />
        )}

        {passages.data && passages.data.passages.length > 0 && (
          <ol
            className="max-h-[55vh] space-y-3 overflow-y-auto pr-1"
            data-ocid="reader.passage_list"
          >
            {passages.data.passages.map((passage, index) => (
              <li
                key={passage.id.toString()}
                data-ocid={`reader.passage.${index + 1}`}
                className="rounded-md border border-border bg-card px-3.5 py-3"
              >
                <p className="citation-locator mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                  <BookOpen aria-hidden="true" className="size-3" />
                  p.{passage.page.toString()} · ¶{passage.paragraph.toString()}
                </p>
                <p className="prose-legal text-sm text-foreground">
                  {passage.text}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Dialog>
  );
}
