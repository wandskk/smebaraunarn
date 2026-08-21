import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full rounded-lg border bg-surface pl-3 pr-3 py-2 text-sm text-foreground transition",
      "focus:outline-none focus:ring-2 focus:ring-offset-0",
      "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted",
      error
        ? "border-danger focus:border-danger focus:ring-danger/20"
        : "border-border focus:border-primary focus:ring-primary/20",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
