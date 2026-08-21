"use client";

import { useTransition } from "react";
import { updateServidorEscolaAction } from "./actions";
import { Select } from "@/components/ui/select";

interface EscolaSelectProps {
  servidorId: number;
  escolaId: number | null;
  escolas: { id: number; nome: string }[];
}

export function EscolaSelect({ servidorId, escolaId, escolas }: EscolaSelectProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={escolaId ?? ""}
      disabled={isPending}
      onChange={(e) => {
        const value = e.target.value ? Number(e.target.value) : null;
        startTransition(() => updateServidorEscolaAction(servidorId, value));
      }}
      className="w-auto py-1 text-xs"
    >
      <option value="">Sem escola (Secretaria)</option>
      {escolas.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nome}
        </option>
      ))}
    </Select>
  );
}
