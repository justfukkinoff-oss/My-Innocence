import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Scale } from "lucide-react";

export default function NotEligiblePage() {
  const { clear } = useInternetIdentity();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-12 sm:px-6">
      <Card data-ocid="not_eligible.card">
        <CardContent className="p-8">
          <span className="flex size-11 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <Scale aria-hidden="true" className="size-5" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
            Docket is not available for your situation
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This workspace is offered only to people located in the United
            States who are proceeding pro se in federal habeas corpus matters.
            Because you did not confirm those criteria, the workspace stays
            locked.
          </p>
          <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold text-foreground">
              Where to find help
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              If you are outside the United States, or you have an attorney
              representing you, please work with that attorney or a local legal
              aid organization. If you believe you do meet the criteria, you can
              return and confirm them.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <ButtonLink
              to="/attestation"
              variant="primary"
              data-ocid="not_eligible.review_link"
            >
              Review the criteria again
            </ButtonLink>
            <Button
              variant="ghost"
              onClick={() => clear()}
              data-ocid="not_eligible.sign_out_button"
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
