"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePostAction } from "./actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm("Excluir esta publicação? Esta ação não pode ser desfeita.")) {
          startTransition(() => deletePostAction(postId));
        }
      }}
      className="flex items-center gap-1 text-red-600 hover:underline disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Excluir
    </button>
  );
}
