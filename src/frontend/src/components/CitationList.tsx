import type { CitationCheck, CitationStatus } from "@/backend";
import { CitationChip } from "@/components/CitationChip";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/states";
import { formatCitationLocation } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CircleCheck, CircleHelp, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

interface StatusDescriptor {
  label: string;
  tone: "success" | "warning" | "danger";
  icon: ReactNode;
}

function describeStatus(status: CitationStatus): StatusDescriptor {
  switch (status.__kind__) {
    case "verifiedInLibrary":
      return {
        label: "Verified in library",
        tone: "success",
        icon: <CircleCheck aria-hidden="true" className="size-3.5" />,
      };
    case "unverified":
      return {
        label: "Unverified",
        tone: "warning",
        icon: <CircleHelp aria-hidden="true" className="size-3.5" />,
      };
    case "malformed":
      return {
        label: "Malformed",
        tone: "danger",
        icon: <TriangleAlert aria-hidden="true" className="size-3.5" />,
      };
  }
}

interface CitationListProps {
  citations: CitationCheck[];
}

/** Every citation found in a draft, grouped by verification status. */
export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return (
      <EmptyState
        icon={<CircleCheck aria-hidden="true" className="size-5" />}
        title="No citations found"
        description="This draft contains no recognizable legal citations. Add pinpoint cites such as “Strickland v. Washington, 466 U.S. 668, 687 (1984)” and run the check again."
      />
    );
  }

  const verified = citations.filter(
    (citation) => citation.status.__kind__ === "verifiedInLibrary",
  );
  const needsAttention = citations.filter(
    (citation) => citation.status.__kind__ !== "verifiedInLibrary",
  );

  return (
    <div className="space-y-6" data-ocid="citation_check.list">
      <section aria-labelledby="citations-verified-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            id="citations-verified-heading"
            className="font-display text-base font-semibold tracking-tight text-foreground"
          >
            Verified in library
          </h3>
          <span className="citation-locator text-muted-foreground">
            {verified.length} of {citations.length}
          </span>
        </div>
        {verified.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            None of the citations in this draft trace to a passage in your
            library yet.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {verified.map((citation, index) => {
              const status = describeStatus(citation.status);
              const cited =
                citation.status.__kind__ === "verifiedInLibrary"
                  ? citation.status.verifiedInLibrary
                  : null;
              return (
                <li
                  key={`verified-${citation.location.sectionId}-${citation.location.offset}`}
                  data-ocid={`citation_check.verified.${index + 1}`}
                  className="py-3"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Badge tone={status.tone}>
                      {status.icon}
                      {status.label}
                    </Badge>
                    <span className="citation-locator min-w-0 flex-1 break-words text-foreground">
                      {citation.rawText}
                    </span>
                  </div>
                  {cited && (
                    <div className="mt-2 rounded-md border border-border bg-muted/40 p-3">
                      <CitationChip
                        passage={cited.passage}
                        filename={cited.filename}
                      />
                      <p className="prose-legal mt-2 line-clamp-4 text-sm text-foreground/90">
                        {cited.passage.text}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="citations-attention-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            id="citations-attention-heading"
            className="font-display text-base font-semibold tracking-tight text-foreground"
          >
            Needs your attention
          </h3>
          <span className="citation-locator text-muted-foreground">
            {needsAttention.length}
          </span>
        </div>
        {needsAttention.length === 0 ? (
          <p className="mt-2 rounded-lg border border-success/25 bg-success/8 px-4 py-3 text-sm text-foreground">
            Every citation in this draft traces to a passage in your library.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {needsAttention.map((citation, index) => {
              const status = describeStatus(citation.status);
              const malformed = citation.status.__kind__ === "malformed";
              return (
                <li
                  key={`attention-${citation.location.sectionId}-${citation.location.offset}`}
                  data-ocid={`citation_check.unverified.${index + 1}`}
                  className="py-3"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Badge tone={status.tone}>
                      {status.icon}
                      {status.label}
                    </Badge>
                    <span
                      className={cn(
                        "citation-locator min-w-0 flex-1 break-words",
                        malformed
                          ? "text-destructive line-through decoration-destructive/50"
                          : "text-foreground",
                      )}
                    >
                      {citation.rawText}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {malformed
                      ? "This cite is not in a recognizable reporter format. Correct the citation, then run the check again."
                      : "No passage in your library supports this cite. Upload the source document so it can be indexed and matched."}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ButtonLink
                      to="/projects"
                      variant="secondary"
                      size="sm"
                      data-ocid={`citation_check.upload_source.${index + 1}`}
                    >
                      Upload the source
                    </ButtonLink>
                    <span className="citation-locator text-muted-foreground">
                      {formatCitationLocation(citation.location)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
