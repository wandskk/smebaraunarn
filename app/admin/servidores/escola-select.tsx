"use client";

import { useTransition } from "react";
import { updateServidorEscolaAction } from "./actions";

interface EscolaSelectProps {
  servidorId: number;
  escolaId: number | null;
  escolas: { id: number; nome: string }[];
}

export function EscolaSelect({ servidorId, escolaId, escolas }: EscolaSelectProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={escolaId ?? ""}
      disabled={isPending}
      onChange={(e) => {
        const value = e.target.value ? Number(e.target.value) : null;
        startTransition(() => updateServidorEscolaAction(servidorId, value));
      }}
      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 disabled:opacity-50"
    >
      <option value="">Sem escola (Secretaria)</option>
      {escolas.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nome}
        </option>
      ))}
    </select>
  );
}
