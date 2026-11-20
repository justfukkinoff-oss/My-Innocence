import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useSaveModelKey } from "@/hooks/useQueries";
import { trapMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

/** The small supported set of providers and their current model names. */
const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4.1", "gpt-4.1-mini", "o4-mini"],
    hint: "Starts with sk-",
    placeholder: "sk-…",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-sonnet-4", "claude-opus-4", "claude-haiku-3.5"],
    hint: "Starts with sk-ant-",
    placeholder: "sk-ant-…",
  },
  {
    id: "google",
    name: "Google",
    models: ["gemini-2.5-pro", "gemini-2.5-flash"],
    hint: "Starts with AIza",
    placeholder: "AIza…",
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

interface ApiKeyFormProps {
  /** True when a key is already stored — the form then reads as a replacement. */
  replacing: boolean;
  onSaved: () => void;
}

/**
 * Paste-a-key form. The draft lives in local state only; the key is sent once
 * to the backend and never read back into the UI.
 */
export function ApiKeyForm({ replacing, onSaved }: ApiKeyFormProps) {
  const saveKey = useSaveModelKey();
  const [providerId, setProviderId] = useState<ProviderId>("openai");
  const [model, setModel] = useState<string>(PROVIDERS[0].models[0]);
  const [key, setKey] = useState("");

  const provider =
    PROVIDERS.find((item) => item.id === providerId) ?? PROVIDERS[0];
  const trimmed = key.trim();
  const canSubmit = trimmed.length > 0 && !saveKey.isPending;

  function selectProvider(next: ProviderId) {
    const found = PROVIDERS.find((item) => item.id === next);
    if (!found) return;
    setProviderId(next);
    setModel(found.models[0]);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const submitted = trimmed;
    setKey("");
    saveKey.mutate(submitted, {
      onSuccess: (validation) => {
        if (validation.__kind__ === "valid") onSaved();
      },
      onError: () => {
        setKey((current) => (current === "" ? submitted : current));
      },
    });
  }

  const invalidReason =
    saveKey.data?.__kind__ === "invalid" ? saveKey.data.invalid.reason : null;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <fieldset className="space-y-2">
        <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Provider
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PROVIDERS.map((item) => {
            const active = item.id === providerId;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => selectProvider(item.id)}
                data-ocid={`settings.provider.${item.id}`}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-smooth",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-input hover:text-foreground",
                )}
              >
                <span className="font-medium">{item.name}</span>
                {active && (
                  <Check aria-hidden="true" className="size-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="model-key-model">Model</Label>
        <select
          id="model-key-model"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          data-ocid="settings.model_select"
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        >
          {provider.models.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Used for research, drafting assistance, and citation checks.
        </p>
      </div>

      <div>
        <Label htmlFor="model-key">Provider key</Label>
        <Input
          id="model-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder={provider.placeholder}
          aria-describedby="model-key-hint"
          aria-invalid={invalidReason !== null || saveKey.isError}
          data-ocid="settings.model_key_input"
        />
        <p id="model-key-hint" className="mt-1.5 text-xs text-muted-foreground">
          {provider.hint}. Paste the full key — it is sent once and never shown
          again.
        </p>
      </div>

      {saveKey.isError && (
        <p
          role="alert"
          className="text-sm text-destructive"
          data-ocid="settings.save_error"
        >
          {trapMessage(saveKey.error)}
        </p>
      )}
      {invalidReason && (
        <p
          role="alert"
          className="text-sm text-destructive"
          data-ocid="settings.validation_error"
        >
          {invalidReason}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={!canSubmit}
          data-ocid="settings.save_key_button"
        >
          {saveKey.isPending && (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          )}
          {saveKey.isPending
            ? "Validating…"
            : replacing
              ? "Replace key"
              : "Save key"}
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="size-3.5 text-accent" />
          Stored securely for your account only.
        </p>
      </div>
    </form>
  );
}
