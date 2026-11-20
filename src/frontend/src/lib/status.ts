import type { IndexingStatus } from "@/backend";

export type Tone = "neutral" | "success" | "warning" | "danger" | "primary";

export interface StatusDescriptor {
  label: string;
  tone: Tone;
  pulse?: boolean;
}

export function describeIndexing(status: IndexingStatus): StatusDescriptor {
  switch (status.__kind__) {
    case "indexed":
      return { label: "Ready", tone: "success" };
    case "indexing":
      return { label: "Indexing", tone: "warning", pulse: true };
    case "pending":
      return { label: "Queued", tone: "neutral" };
    case "failed":
      return { label: "Failed", tone: "danger" };
  }
}

export function indexingFailureReason(status: IndexingStatus): string | null {
  return status.__kind__ === "failed" ? status.failed.reason : null;
}
