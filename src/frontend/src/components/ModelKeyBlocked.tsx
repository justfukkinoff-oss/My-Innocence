import { ButtonLink } from "@/components/ui/button-link";
import { KeyRound } from "lucide-react";

interface ModelKeyBlockedProps {
  /** What the user was trying to do, e.g. "run a citation check". */
  action?: string;
  className?: string;
}

/** Shown whenever an AI action runs without a configured model key. */
export function ModelKeyBlocked({ action, className }: ModelKeyBlockedProps) {
  return (
    <div
      role="alert"
      data-ocid="model_key.blocked_state"
      className={`rounded-lg border border-warning/40 bg-warning/10 px-5 py-4 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-warning/40 bg-card text-warning-foreground">
          <KeyRound aria-hidden="true" className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Add your model key to continue
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {action
              ? `Docket needs your own provider key to ${action}.`
              : "Docket needs your own provider key for AI-assisted work."}{" "}
            Your key is stored with your account and never shown again.
          </p>
          <ButtonLink
            to="/settings"
            variant="primary"
            size="sm"
            className="mt-3"
            data-ocid="model_key.settings_link"
          >
            Open Settings
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
