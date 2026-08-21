import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground transition placeholder:text-foreground-muted/60",
      "focus:outline-none focus:ring-2 focus:ring-offset-0",
      "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted",
      error
        ? "border-danger focus:border-danger focus:ring-danger/20"
        : "border-border focus:border-primary focus:ring-primary/20",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
