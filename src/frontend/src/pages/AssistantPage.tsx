import ChatView from "@/components/ChatView";
import { ModelKeyBlocked } from "@/components/ModelKeyBlocked";
import { LoadingState } from "@/components/ui/states";
import { useModelKeyStatus } from "@/hooks/useQueries";
import { MessagesSquare } from "lucide-react";

export default function AssistantPage() {
  const keyStatus = useModelKeyStatus();
  const keyMissing = keyStatus.data?.configured === false;

  return (
    <div className="space-y-5" data-ocid="assistant.page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Working notes
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
            Assistant
          </h1>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Think through a §2254 question, outline an argument, or draft a
            paragraph. Conversations are saved to your workspace and run on your
            own model key.
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <MessagesSquare aria-hidden="true" className="size-3.5" />
          {keyStatus.data?.configured && keyStatus.data.last4
            ? `Key ending ${keyStatus.data.last4}`
            : "Your own key"}
        </span>
      </header>

      {keyStatus.isPending ? (
        <div className="flex h-[calc(100dvh-16rem)] min-h-[28rem] items-center justify-center rounded-lg border border-border bg-card shadow-subtle">
          <LoadingState label="Checking your model key…" />
        </div>
      ) : keyMissing ? (
        <ModelKeyBlocked
          action="chat with the assistant"
          className="max-w-2xl"
        />
      ) : (
        <div className="h-[calc(100dvh-16rem)] min-h-[32rem] overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
          <ChatView />
        </div>
      )}
    </div>
  );
}
