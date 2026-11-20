import type { Draft } from "@/backend";
import { CitationList } from "@/components/CitationList";
import { GroundingReport } from "@/components/GroundingReport";
import { ModelKeyBlocked } from "@/components/ModelKeyBlocked";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SkeletonRows,
} from "@/components/ui/states";
import {
  useCheckDraftCitations,
  useCheckDraftGrounding,
  useDraft,
  useDrafts,
  useModelKeyStatus,
  useProjects,
} from "@/hooks/useQueries";
import { isMissingModelKey, trapMessage } from "@/lib/errors";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookOpenCheck, Info, ShieldCheck } from "lucide-react";
import { useState } from "react";

function AdvisoryNote() {
  return (
    <div
      data-ocid="citation_check.advisory_note"
      className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3"
    >
      <Info
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <p className="text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Advisory only.</span>{" "}
        These results compare your draft against the documents you uploaded.
        They are not a substitute for your own cite-checking against the
        official reporter, statute, or record.
      </p>
    </div>
  );
}

function DraftPicker({
  drafts,
  selectedId,
  onSelect,
}: {
  drafts: Draft[];
  selectedId: bigint | null;
  onSelect: (id: bigint) => void;
}) {
  return (
    <ul
      className="grid gap-2 sm:grid-cols-2"
      data-ocid="citation_check.draft_list"
    >
      {drafts.map((draft, index) => {
        const active = draft.id === selectedId;
        return (
          <li key={draft.id.toString()}>
            <button
              type="button"
              onClick={() => onSelect(draft.id)}
              aria-pressed={active}
              data-ocid={`citation_check.draft.${index + 1}`}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "border-primary/40 bg-primary/5 shadow-subtle"
                  : "border-border bg-card hover:border-input hover:bg-secondary",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {draft.title}
                </span>
                {active && <Badge tone="primary">Selected</Badge>}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {draft.draftType} · autosaved{" "}
                {formatRelative(draft.autosavedAt)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function CitationCheckPage() {
  const projects = useProjects();
  const firstProject = projects.data?.[0] ?? null;
  const drafts = useDrafts(firstProject?.id ?? null);
  const [draftId, setDraftId] = useState<bigint | null>(null);
  const selectedId = draftId ?? drafts.data?.[0]?.id ?? null;
  const selectedDraft = useDraft(selectedId);

  const citations = useCheckDraftCitations();
  const grounding = useCheckDraftGrounding();
  const keyStatus = useModelKeyStatus();
  const keyMissing = keyStatus.data?.configured === false;

  const isRunning = citations.isPending || grounding.isPending;
  const hasResults =
    citations.data !== undefined || grounding.data !== undefined;

  function runCheck() {
    if (selectedId === null) return;
    citations.mutate(selectedId);
    grounding.mutate(selectedId);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Verification
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          Citation &amp; grounding check
        </h1>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Match every citation in a draft against your indexed record, and find
          the sentences that make a claim without one.
        </p>
      </header>

      <AdvisoryNote />

      {keyMissing && <ModelKeyBlocked action="run a citation check" />}

      {projects.isPending && <SkeletonRows rows={2} />}

      {projects.isError && (
        <ErrorState
          title="Could not load your drafts"
          message={trapMessage(projects.error)}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void projects.refetch()}
              data-ocid="citation_check.retry_button"
            >
              Retry
            </Button>
          }
        />
      )}

      {projects.data && !firstProject && (
        <EmptyState
          icon={<BookOpenCheck aria-hidden="true" className="size-5" />}
          title="Create a project first"
          description="Citation checks run against a draft inside a project. Create a project, upload your record, then start drafting."
          action={
            <ButtonLink
              to="/projects"
              variant="primary"
              data-ocid="citation_check.projects_link"
            >
              Go to projects
            </ButtonLink>
          }
        />
      )}

      {firstProject && drafts.isPending && <SkeletonRows rows={2} />}

      {firstProject && drafts.isError && (
        <ErrorState
          title="Could not load drafts"
          message={trapMessage(drafts.error)}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void drafts.refetch()}
              data-ocid="citation_check.retry_button"
            >
              Retry
            </Button>
          }
        />
      )}

      {firstProject && drafts.data && drafts.data.length === 0 && (
        <EmptyState
          icon={<BookOpenCheck aria-hidden="true" className="size-5" />}
          title="No drafts to check"
          description={`No drafts in ${firstProject.name} yet. Start a petition or memorandum, then return here to verify its citations.`}
          action={
            <ButtonLink
              to="/projects/$projectId"
              params={{ projectId: firstProject.id.toString() }}
              variant="primary"
              data-ocid="citation_check.project_link"
            >
              Open {firstProject.name}
            </ButtonLink>
          }
        />
      )}

      {firstProject && drafts.data && drafts.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a draft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DraftPicker
              drafts={drafts.data}
              selectedId={selectedId}
              onSelect={setDraftId}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="min-w-0 text-xs text-muted-foreground">
                {selectedDraft.data
                  ? `${selectedDraft.data.sections.length} section${
                      selectedDraft.data.sections.length === 1 ? "" : "s"
                    } · autosaved ${formatRelative(selectedDraft.data.autosavedAt)}`
                  : "Select a draft to check."}
              </p>
              <Button
                variant="primary"
                disabled={selectedId === null || isRunning}
                onClick={runCheck}
                data-ocid="citation_check.run_button"
              >
                {isRunning ? "Checking…" : "Run check"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isRunning && <LoadingState label="Checking citations and grounding…" />}

      {citations.isError &&
        (isMissingModelKey(citations.error) ? (
          <ModelKeyBlocked action="run a citation check" />
        ) : (
          <ErrorState
            title="Citation check failed"
            message={trapMessage(citations.error)}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={runCheck}
                data-ocid="citation_check.retry_button"
              >
                Retry
              </Button>
            }
          />
        ))}

      {grounding.isError &&
        (isMissingModelKey(grounding.error) ? (
          <ModelKeyBlocked action="run a grounding check" />
        ) : (
          <ErrorState
            title="Grounding check failed"
            message={trapMessage(grounding.error)}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={runCheck}
                data-ocid="citation_check.retry_button"
              >
                Retry
              </Button>
            }
          />
        ))}

      {!hasResults && !isRunning && drafts.data && drafts.data.length > 0 && (
        <EmptyState
          icon={<ShieldCheck aria-hidden="true" className="size-5" />}
          title="No check run yet"
          description="Pick a draft above and run the check to see which citations trace to your library and which claims need support."
        />
      )}

      {citations.data && (
        <Card data-ocid="citation_check.results">
          <CardHeader>
            <CardTitle>Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <CitationList citations={citations.data.citations} />
          </CardContent>
        </Card>
      )}

      {grounding.data && (
        <Card data-ocid="citation_check.grounding">
          <CardHeader>
            <CardTitle>Grounding report</CardTitle>
          </CardHeader>
          <CardContent>
            <GroundingReport
              ungrounded={grounding.data.ungrounded}
              sections={selectedDraft.data?.sections ?? []}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
