import { ApiKeyForm } from "@/components/ApiKeyForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState, LoadingState, Skeleton } from "@/components/ui/states";
import { useModelKeyStatus, useRemoveModelKey } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { KeyRound, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const keyStatus = useModelKeyStatus();
  const removeKey = useRemoveModelKey();
  const [replacing, setReplacing] = useState(false);

  const configured = keyStatus.data?.configured === true;
  const last4 = keyStatus.data?.last4;
  const showForm = !configured || replacing;

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-ocid="settings.page">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Configuration
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Docket runs on your own model provider key. Add one to unlock
          research, drafting assistance, and citation checks.
        </p>
      </header>

      <Card data-ocid="settings.model_key_card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <KeyRound
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              Model key
            </CardTitle>
            {keyStatus.isPending ? (
              <Skeleton className="h-6 w-24 rounded-full" />
            ) : (
              <span data-ocid="settings.key_status_badge">
                <Badge tone={configured ? "success" : "warning"}>
                  {configured ? "Configured" : "Not configured"}
                </Badge>
              </span>
            )}
          </div>
          <CardDescription>
            {configured
              ? "Your key is active for this account."
              : "No key yet — AI-assisted features stay locked until you add one."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {keyStatus.isPending && (
            <div data-ocid="settings.loading_state">
              <LoadingState label="Checking your key…" className="py-2" />
            </div>
          )}

          {keyStatus.isError && (
            <ErrorState
              title="Could not read your key status"
              message={trapMessage(keyStatus.error)}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void keyStatus.refetch()}
                  data-ocid="settings.retry_button"
                >
                  Retry
                </Button>
              }
            />
          )}

          {configured && !replacing && (
            <div
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3"
              data-ocid="settings.configured_panel"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success"
                >
                  <ShieldCheck className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Key ending in{" "}
                    <span className="font-mono tracking-wider">
                      ••••{last4 ?? "••••"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The full key is never shown again.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setReplacing(true)}
                  data-ocid="settings.replace_key_button"
                >
                  Replace key
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeKey.mutate()}
                  disabled={removeKey.isPending}
                  data-ocid="settings.remove_key_button"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  {removeKey.isPending ? "Removing…" : "Remove"}
                </Button>
              </div>
            </div>
          )}

          {removeKey.isError && (
            <p role="alert" className="text-sm text-destructive">
              {trapMessage(removeKey.error)}
            </p>
          )}

          {showForm && !keyStatus.isPending && (
            <div className="space-y-4">
              {replacing && (
                <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/60 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Saving a new key replaces the current one.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplacing(false)}
                    data-ocid="settings.cancel_replace_button"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <ApiKeyForm
                replacing={configured}
                onSaved={() => setReplacing(false)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-subtle">
        <CardContent className="space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <Lock aria-hidden="true" className="size-4 text-muted-foreground" />
            How your key is handled
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-2">
              <span
                aria-hidden="true"
                className="mt-2 size-1 shrink-0 rounded-full bg-accent"
              />
              Stored securely and bound to your signed-in account — no other
              user can read or use it.
            </li>
            <li className="flex gap-2">
              <span
                aria-hidden="true"
                className="mt-2 size-1 shrink-0 rounded-full bg-accent"
              />
              Used only to power this app&apos;s AI features: research,
              drafting, and citation checks.
            </li>
            <li className="flex gap-2">
              <span
                aria-hidden="true"
                className="mt-2 size-1 shrink-0 rounded-full bg-accent"
              />
              After saving, only the last four characters are ever displayed.
              You can replace or remove it at any time.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
