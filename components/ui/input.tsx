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
Input.displayName = "Input";
