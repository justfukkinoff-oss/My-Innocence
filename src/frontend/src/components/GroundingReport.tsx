import type { DraftSection, UngroundedSentence } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { CircleCheck, Quote } from "lucide-react";

interface GroundingReportProps {
  ungrounded: UngroundedSentence[];
  sections: DraftSection[];
}

/** Sentences that assert a claim without a supporting library citation. */
export function GroundingReport({
  ungrounded,
  sections,
}: GroundingReportProps) {
  if (ungrounded.length === 0) {
    return (
      <EmptyState
        icon={<CircleCheck aria-hidden="true" className="size-5" />}
        title="Every claim is grounded"
        description="Each sentence that makes a factual or legal claim carries a citation to a passage in your library."
      />
    );
  }

  const headingFor = (sectionId: bigint) =>
    sections.find((section) => section.id === sectionId)?.heading ?? null;

  return (
    <div className="space-y-3" data-ocid="citation_check.grounding_list">
      <p className="text-sm leading-relaxed text-muted-foreground">
        These sentences make a claim but cite nothing in your library. Add a
        supporting citation or revise the sentence.
      </p>
      <ul className="divide-y divide-border">
        {ungrounded.map((item, index) => {
          const heading = headingFor(item.sectionId);
          return (
            <li
              key={`ungrounded-${item.sectionId}-${index}`}
              data-ocid={`citation_check.grounding.${index + 1}`}
              className="flex gap-3 py-3"
            >
              <Quote
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <div className="min-w-0 flex-1">
                <p className="prose-legal text-sm text-foreground/90">
                  {item.sentence}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge tone="warning">No supporting citation</Badge>
                  {heading && (
                    <span className="citation-locator truncate text-muted-foreground">
                      {heading}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
