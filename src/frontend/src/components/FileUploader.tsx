import { ExternalBlob } from "@/backend";
import { Button } from "@/components/ui/button";
import { useRegisterCaseFile } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import { useId, useRef, useState } from "react";

const ACCEPTED = ".pdf,.docx,.txt";
const MAX_BYTES = 25 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

type Phase = "reading" | "uploading" | "registering" | "done" | "error";

interface UploadItem {
  key: string;
  filename: string;
  sizeBytes: number;
  progress: number;
  phase: Phase;
  message?: string;
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

function mimeFor(filename: string): string | null {
  return MIME_BY_EXT[extensionOf(filename)] ?? null;
}

/** Best-effort page count: PDF page objects, DOCX page breaks, else 1. */
function estimatePageCount(bytes: Uint8Array, ext: string): bigint {
  if (ext === "pdf") {
    const text = new TextDecoder("latin1").decode(bytes);
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    if (matches && matches.length > 0) return BigInt(matches.length);
    return 1n;
  }
  if (ext === "docx") {
    const text = new TextDecoder("latin1").decode(bytes);
    const breaks = text.match(/w:type="page"/g);
    return BigInt(1 + (breaks?.length ?? 0));
  }
  return 1n;
}

/** Extract readable text in the browser so the library can index it. */
async function extractText(file: File, ext: string): Promise<string> {
  if (ext === "txt") return file.text();
  if (ext === "pdf") {
    const text = new TextDecoder("latin1").decode(
      new Uint8Array(await file.arrayBuffer()),
    );
    const runs = text.match(/\((?:\\.|[^\\()])*\)/g) ?? [];
    return runs
      .map((run) => run.slice(1, -1).replace(/\\([()\\])/g, "$1"))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (ext === "docx") {
    const text = new TextDecoder("utf-8").decode(
      new Uint8Array(await file.arrayBuffer()),
    );
    const paragraphs = text.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [];
    return paragraphs
      .map((node) => node.replace(/<[^>]+>/g, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return "";
}

const PHASE_LABEL: Record<Phase, string> = {
  reading: "Reading text",
  uploading: "Uploading",
  registering: "Indexing",
  done: "Added",
  error: "Failed",
};

interface FileUploaderProps {
  projectId: bigint;
}

export function FileUploader({ projectId }: FileUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const register = useRegisterCaseFile();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);

  function patch(key: string, next: Partial<UploadItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...next } : item)),
    );
  }

  async function uploadOne(file: File, key: string) {
    const ext = extensionOf(file.name);
    const mimeType = mimeFor(file.name);
    if (!mimeType) {
      patch(key, {
        phase: "error",
        message: "Only PDF, DOCX and TXT files are supported.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      patch(key, {
        phase: "error",
        message: `File is larger than ${formatFileSize(BigInt(MAX_BYTES))}.`,
      });
      return;
    }

    try {
      patch(key, { phase: "reading", progress: 0 });
      const bytes = new Uint8Array(await file.arrayBuffer());
      const extractedText = await extractText(file, ext);
      const pageCount = estimatePageCount(bytes, ext);

      patch(key, { phase: "uploading", progress: 0 });
      const blob = ExternalBlob.fromBytes(bytes, mimeType, file.name);
      blob.withUploadProgress((percentage) =>
        patch(key, { progress: Math.round(percentage) }),
      );

      patch(key, { phase: "registering", progress: 100 });
      await register.mutateAsync({
        projectId,
        filename: file.name,
        mimeType,
        sizeBytes: BigInt(file.size),
        pageCount,
        blob,
        extractedText: extractedText.length > 0 ? extractedText : undefined,
      });
      patch(key, { phase: "done", progress: 100 });
    } catch (error) {
      patch(key, { phase: "error", message: trapMessage(error) });
    }
  }

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    const queued: UploadItem[] = files.map((file, index) => ({
      key: `${Date.now()}-${index}-${file.name}`,
      filename: file.name,
      sizeBytes: file.size,
      progress: 0,
      phase: "reading",
    }));
    setItems((current) => [...queued, ...current]);
    for (const [index, file] of files.entries()) {
      void uploadOne(file, queued[index].key);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  const busy = items.some(
    (item) =>
      item.phase === "reading" ||
      item.phase === "uploading" ||
      item.phase === "registering",
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-smooth",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30",
        )}
        data-ocid="project.dropzone"
      >
        <div className="mb-3 flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
          <FileUp aria-hidden="true" className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Drop case files here, or choose them from your computer
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, DOCX or TXT · up to {formatFileSize(BigInt(MAX_BYTES))} each ·
          re-uploading a name adds a new version
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED}
          multiple
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
          data-ocid="project.file_input"
        />
        <Button
          variant="primary"
          size="sm"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
          data-ocid="project.upload_button"
        >
          <Upload aria-hidden="true" className="size-4" />
          Choose files
        </Button>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2" data-ocid="project.upload_list">
          {items.map((item, index) => (
            <li
              key={item.key}
              data-ocid={`project.upload_item.${index + 1}`}
              className="rounded-md border border-border bg-card px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="shrink-0 text-muted-foreground">
                  {item.phase === "done" ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 text-success"
                    />
                  ) : item.phase === "error" ? (
                    <AlertCircle
                      aria-hidden="true"
                      className="size-4 text-destructive"
                    />
                  ) : (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.filename}
                  </p>
                  <p className="citation-locator text-muted-foreground">
                    {formatFileSize(BigInt(item.sizeBytes))} ·{" "}
                    {PHASE_LABEL[item.phase]}
                    {item.phase === "uploading" ? ` ${item.progress}%` : ""}
                  </p>
                </div>
              </div>
              {(item.phase === "uploading" || item.phase === "registering") && (
                <div
                  className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  tabIndex={0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.progress}
                  aria-label={`Upload progress for ${item.filename}`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-smooth"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.phase === "error" && item.message && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {item.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {busy && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Keep this page open while files upload and index.
        </p>
      )}
    </div>
  );
}
