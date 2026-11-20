import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmAttestation } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { useNavigate } from "@tanstack/react-router";
import { Check, Globe2, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

const CONFIRMATIONS = [
  {
    id: "united-states",
    icon: Globe2,
    title: "I am located in the United States",
    body: "Docket is built for U.S. federal habeas practice under 28 U.S.C. §2254 and is offered only to people in the United States.",
  },
  {
    id: "pro-se",
    icon: UserRound,
    title: "I am proceeding pro se",
    body: "You are representing yourself, without a licensed attorney acting for you in this matter.",
  },
  {
    id: "not-advice",
    icon: ShieldCheck,
    title: "I understand this is not legal advice",
    body: "Docket organizes your documents and drafts. It does not give legal advice, and no attorney-client relationship is created.",
  },
] as const;

type ConfirmationId = (typeof CONFIRMATIONS)[number]["id"];

export default function AttestationPage() {
  const navigate = useNavigate();
  const confirm = useConfirmAttestation();
  const [checked, setChecked] = useState<Record<ConfirmationId, boolean>>({
    "united-states": false,
    "pro-se": false,
    "not-advice": false,
  });

  const allChecked = CONFIRMATIONS.every((item) => checked[item.id]);

  function toggle(id: ConfirmationId) {
    setChecked((current) => ({ ...current, [id]: !current[id] }));
  }

  function onConfirm() {
    confirm.mutate(undefined, {
      onSuccess: () => {
        void navigate({ to: "/projects", replace: true });
      },
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Before you begin
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Confirm your eligibility
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Docket is a private workspace for people in the United States
          representing themselves in federal habeas corpus proceedings. Please
          confirm each statement below to open your workspace.
        </p>
      </div>

      <Card data-ocid="attestation.card">
        <CardHeader>
          <CardTitle>Three confirmations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CONFIRMATIONS.map((item) => {
            const Icon = item.icon;
            const isChecked = checked[item.id];
            return (
              <label
                key={item.id}
                data-ocid={`attestation.checkbox.${item.id}`}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-smooth ${
                  isChecked
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card hover:border-input"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-smooth ${
                    isChecked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card text-transparent"
                  }`}
                >
                  <Check className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </span>
                </span>
              </label>
            );
          })}

          {confirm.isError && (
            <p role="alert" className="text-sm text-destructive">
              {trapMessage(confirm.error)}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
            <ButtonLink
              to="/not-eligible"
              variant="ghost"
              data-ocid="attestation.decline_link"
            >
              I do not meet these criteria
            </ButtonLink>
            <Button
              variant="primary"
              onClick={onConfirm}
              disabled={!allChecked || confirm.isPending}
              data-ocid="attestation.confirm_button"
            >
              {confirm.isPending ? "Confirming…" : "Confirm and open workspace"}
            </Button>
          </div>
          {!allChecked && (
            <p className="text-xs text-muted-foreground">
              Confirm all three statements to continue.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
