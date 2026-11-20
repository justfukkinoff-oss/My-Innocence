import type { CitationLocation, Passage } from "@/backend";

/** Motoko `Time.now()` values are nanosecond bigints. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DATE_TIME_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  return date ? DATE_FMT.format(date) : "—";
}

export function formatDateTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  return date ? DATE_TIME_FMT.format(date) : "—";
}

/** "just now", "12 min ago", "3 days ago", then an absolute date. */
export function formatRelative(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return formatDate(timestamp);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(timestamp);
}

export function formatFileSize(bytes: bigint): string {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return "—";
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB"];
  let size = value / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[unit]}`;
}

/** The signature locator: `brief.pdf · p.14 · ¶3`. */
export function formatLocator(passage: Passage, filename?: string): string {
  const parts: string[] = [];
  if (filename) parts.push(filename);
  parts.push(`p.${passage.page}`);
  parts.push(`¶${passage.paragraph}`);
  return parts.join(" · ");
}

export function formatCitationLocation(location: CitationLocation): string {
  return `offset ${location.offset}`;
}

export function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}
