import type { CitedPassage } from "@/backend";
import { SourceCitation } from "@/components/SourceCitation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pluralize } from "@/lib/format";
import { BookOpenCheck } from "lucide-react";

interface AnswerPanelProps {
  answer: string;
  passages: CitedPassage[];
}

/**
 * The grounded answer, followed by every passage it rests on. Each citation
 * expands inline to its source text; nothing here is generated from general
 * knowledge.
 */
export function AnswerPanel({ answer, passages }: AnswerPanelProps) {
  return (
    <Card data-ocid="research.answer_panel" className="animate-fade-in">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle>Answer</CardTitle>
        <span className="citation-locator shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-muted-foreground">
          {pluralize(passages.length, "source")}
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="prose-legal whitespace-pre-wrap text-foreground">
          {answer}
        </div>

        <section
          aria-labelledby="research-sources-heading"
          className="space-y-2"
        >
          <h4
            id="research-sources-heading"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            <BookOpenCheck aria-hidden="true" className="size-3.5" />
            Cited passages
          </h4>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Every claim above is drawn from these passages. Open any locator to
            read the source text in place.
          </p>
          <div className="space-y-2">
            {passages.map((cited, index) => (
              <SourceCitation
                key={cited.passage.id.toString()}
                cited={cited}
                index={index + 1}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
