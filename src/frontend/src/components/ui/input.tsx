import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const FIELD_BASE =
  "w-full rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_BASE, "h-10", className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(FIELD_BASE, "min-h-24 py-2 leading-relaxed", className)}
      {...rest}
    />
  );
}

export function Label({
  className,
  children,
  htmlFor,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement> & { htmlFor: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground",
        className,
      )}
      {...rest}
    >
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs text-destructive">
      {children}
    </p>
  );
}
