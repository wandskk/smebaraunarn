"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteDocumentoAction } from "./actions";

export function DeleteDocumentoButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm("Excluir este documento?")) {
          startTransition(() => deleteDocumentoAction(id));
        }
      }}
      className="flex items-center gap-1 text-red-600 hover:underline disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Excluir
    </button>
  );
}
