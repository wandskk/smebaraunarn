"use client";

import { useTransition } from "react";
import { toggleUserAtivoAction } from "./actions";
import { cn } from "@/lib/utils";

export function ToggleAtivoButton({ userId, ativo }: { userId: string; ativo: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => toggleUserAtivoAction(userId, !ativo))}
      className={cn(
        "rounded-full px-2 py-0.5 text-xs transition",
        ativo
          ? "bg-success-subtle text-success-subtle-foreground hover:opacity-80"
          : "bg-surface-muted text-foreground-muted hover:bg-border",
      )}
    >
      {ativo ? "Ativo" : "Inativo"}
    </button>
  );
}
