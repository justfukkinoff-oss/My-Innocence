/** The readable core of a canister reject: the trap message without the
 * replica's request/error-code framing. */
export function trapMessage(error: unknown): string {
  const raw = String((error as Error)?.message ?? error);
  const match = raw.match(/trap.*?'(.*)'/s);
  return match ? match[1] : raw.slice(0, 300);
}

/** True when a backend call failed because no model key is configured. */
export function isMissingModelKey(error: unknown): boolean {
  const message = trapMessage(error).toLowerCase();
  return (
    message.includes("model key") ||
    message.includes("no key") ||
    message.includes("key not configured") ||
    message.includes("not configured")
  );
}
