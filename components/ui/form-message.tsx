import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function FormMessage({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <p className={cn("mt-1 text-xs text-danger", className)} {...props}>
      {children}
    </p>
  );
}
