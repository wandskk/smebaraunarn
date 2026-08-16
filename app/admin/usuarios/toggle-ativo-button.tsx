"use client";

import { useTransition } from "react";
import { toggleUserAtivoAction } from "./actions";

export function ToggleAtivoButton({ userId, ativo }: { userId: string; ativo: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => toggleUserAtivoAction(userId, !ativo))}
      className={
        ativo
          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-100"
          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-200"
      }
    >
      {ativo ? "Ativo" : "Inativo"}
    </button>
  );
}
