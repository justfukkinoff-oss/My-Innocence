import type { DraftVersion } from "@/backend";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { History, RotateCcw } from "lucide-react";

interface VersionHistoryProps {
  versions: DraftVersion[];
  onRestore: (version: bigint) => void;
  restoringVersion: bigint | null;
  disabled?: boolean;
}

/** Prior autosaved versions, newest first, each restorable in one click. */
export function VersionHistory({
  versions,
  onRestore,
  restoringVersion,
  disabled = false,
}: VersionHistoryProps) {
  const ordered = [...versions].sort((a, b) =>
    a.version < b.version ? 1 : -1,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <History aria-hidden="true" className="size-4 text-muted-foreground" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Version history
        </p>
      </div>

      {ordered.length === 0 ? (
        <div className="px-4 py-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            No prior versions yet. Each autosave keeps the previous state here
            so you can step back.
          </p>
        </div>
      ) : (
        <ol
          className="flex-1 space-y-1 overflow-y-auto scrollbar-thin p-2"
          data-ocid="draft.version_list"
        >
          {ordered.map((version, index) => {
            const isRestoring = restoringVersion === version.version;
            return (
              <li
                key={version.version.toString()}
                data-ocid={`draft.version_item.${index + 1}`}
                className="rounded-md border border-transparent px-2 py-2 transition-smooth hover:border-border hover:bg-secondary/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      Version {version.version.toString()}
                    </p>
                    <p className="citation-locator text-muted-foreground">
                      {formatDateTime(version.savedAt)} ·{" "}
                      {version.sections.length} sections
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestore(version.version)}
                    disabled={disabled || restoringVersion !== null}
                    data-ocid={`draft.restore_button.${index + 1}`}
                  >
                    <RotateCcw aria-hidden="true" className="size-3.5" />
                    {isRestoring ? "Restoring…" : "Restore"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
