import { ButtonLink } from "@/components/ui/button-link";
import { FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-11 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        <FileQuestion aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          That page is not part of your workspace.
        </p>
      </div>
      <ButtonLink
        to="/projects"
        variant="primary"
        data-ocid="not_found.projects_link"
      >
        Back to projects
      </ButtonLink>
    </div>
  );
}
