"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteRowButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm("Remover este item?")) {
          startTransition(() => onDelete());
        }
      }}
      className="text-red-600 hover:text-red-700 disabled:opacity-50"
      aria-label="Remover"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
