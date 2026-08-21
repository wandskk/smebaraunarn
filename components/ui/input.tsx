import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Aplica o estado visual de erro (usar junto de FormField/FormMessage). */
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      // pl/pr em vez de px: permite sobrescrever só um lado (ex.: pl-10 p/ ícone) sem perder o outro no merge do tailwind-merge.
      "w-full rounded-lg border bg-surface pl-3 pr-3 py-2 text-sm text-foreground transition placeholder:text-foreground-muted/60",
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
Input.displayName = "Input";
