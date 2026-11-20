import type { RetrievalScope } from "@/backend";
import { AnswerPanel } from "@/components/AnswerPanel";
import { ModelKeyBlocked } from "@/components/ModelKeyBlocked";
import { SourceCitation } from "@/components/SourceCitation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  useAnswerFromLibrary,
  useModelKeyStatus,
  useProjects,
  useRetrievePassages,
} from "@/hooks/useQueries";
import { isMissingModelKey, trapMessage } from "@/lib/errors";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FileSearch, Library, Search } from "lucide-react";
import { useState } from "react";

type Mode = "answer" | "passages";

const MODES: { id: Mode; label: string; hint: string }[] = [
  {
    id: "answer",
    label: "Answer",
    hint: "A written answer grounded in your files",
  },
  {
    id: "passages",
    label: "Passages",
    hint: "The matching passages, without a written answer",
  },
];

export default function ResearchPage() {
  const [question, setQuestion] = useState("");
  const [scopeProjectId, setScopeProjectId] = useState<string>("library");
  const [mode, setMode] = useState<Mode>("answer");

  const projects = useProjects();
  const keyStatus = useModelKeyStatus();
  const answer = useAnswerFromLibrary();
  const retrieve = useRetrievePassages();

  const keyMissing = keyStatus.data?.configured === false;
  const active = mode === "answer" ? answer : retrieve;
  const pending = active.isPending;
  const error = active.error;
  const trimmed = question.trim();

  const scopeLabel =
    scopeProjectId === "library"
      ? "your whole library"
      : (projects.data?.find((p) => p.id.toString() === scopeProjectId)?.name ??
        "this project");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed || keyMissing) return;
    const scope: RetrievalScope =
      scopeProjectId === "library"
        ? { __kind__: "library", library: null }
        : { __kind__: "project", project: BigInt(scopeProjectId) };
    const request = { question: trimmed, scope };
    if (mode === "answer") {
      answer.mutate(request);
    } else {
      retrieve.mutate(request);
    }
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    answer.reset();
    retrieve.reset();
  }

  const answerResult = answer.data;
  const passageResult = retrieve.data;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Grounded retrieval
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          Research
        </h1>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Ask a question about your record. Answers come only from passages in
          your library, each carrying its file, page, and paragraph.
        </p>
      </header>

      {keyMissing && <ModelKeyBlocked action="search your library" />}

      <Card>
        <CardContent className="space-y-4 p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="research-question">Your question</Label>
              <Textarea
                id="research-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What did the state court hold about exhaustion of state remedies?"
                rows={3}
                data-ocid="research.question_input"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="research-scope">Search in</Label>
                <select
                  id="research-scope"
                  value={scopeProjectId}
                  onChange={(event) => setScopeProjectId(event.target.value)}
                  data-ocid="research.scope_select"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                >
                  <option value="library">Entire library</option>
                  {projects.data?.map((project) => (
                    <option
                      key={project.id.toString()}
                      value={project.id.toString()}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Result
                </span>
                <div className="flex rounded-md border border-border bg-muted/40 p-0.5">
                  {MODES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => switchMode(option.id)}
                      aria-pressed={mode === option.id}
                      title={option.hint}
                      data-ocid={`research.mode.${option.id}`}
                      className={cn(
                        "flex-1 rounded px-3 py-1.5 text-[13px] font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        mode === option.id
                          ? "bg-card text-foreground shadow-subtle"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Library aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="truncate">Searching {scopeLabel}</span>
              </p>
              <Button
                type="submit"
                variant="primary"
                disabled={!trimmed || pending || keyMissing}
                data-ocid="research.search_button"
              >
                <Search aria-hidden="true" className="size-4" />
                {pending
                  ? "Searching…"
                  : mode === "answer"
                    ? "Answer from library"
                    : "Find passages"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {pending && (
        <LoadingState
          label={
            mode === "answer"
              ? "Reading your library and drafting an answer…"
              : "Reading your library…"
          }
        />
      )}

      {error &&
        (isMissingModelKey(error) ? (
          <ModelKeyBlocked action="search your library" />
        ) : (
          <ErrorState
            title={mode === "answer" ? "Answer failed" : "Search failed"}
            message={trapMessage(error)}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => active.reset()}
                data-ocid="research.retry_button"
              >
                Dismiss
              </Button>
            }
          />
        ))}

      {mode === "answer" && answerResult?.__kind__ === "answered" && (
        <AnswerPanel
          answer={answerResult.answered.answer}
          passages={answerResult.answered.passages}
        />
      )}

      {mode === "answer" && answerResult?.__kind__ === "notFoundInLibrary" && (
        <EmptyState
          icon={<FileSearch aria-hidden="true" className="size-5" />}
          title="Not found in your library"
          description="No passage in your uploaded files supports an answer to this question. Docket will not answer from general knowledge — try different wording, widen the scope, or upload the document that discusses it."
        />
      )}

      {mode === "passages" && passageResult?.__kind__ === "found" && (
        <Card data-ocid="research.results" className="animate-fade-in">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <CardTitle>Passages</CardTitle>
            <span className="citation-locator shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-muted-foreground">
              {pluralize(
                passageResult.found.passages.length,
                "match",
                "matches",
              )}
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            {passageResult.found.passages.map((cited, index) => (
              <SourceCitation
                key={cited.passage.id.toString()}
                cited={cited}
                index={index + 1}
                defaultOpen={index === 0}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {mode === "passages" &&
        passageResult?.__kind__ === "notFoundInLibrary" && (
          <EmptyState
            icon={<FileSearch aria-hidden="true" className="size-5" />}
            title="Nothing in your library answers that"
            description="No passage in your uploaded files matches this question. Try different wording, widen the scope, or upload the document that discusses it."
          />
        )}
    </div>
  );
}
