"use client";

import { useEffect, useState, useTransition } from "react";
import { searchVinculosAction, type VinculoOption } from "./actions";
import type { VinculoTipo } from "@/lib/validations/user";

export interface VinculoSelection {
  tipo: VinculoTipo;
  id: string;
  nome: string;
  cpfDigits: string | null;
}

const TIPO_LABEL: Record<VinculoTipo, string> = {
  NENHUM: "Sem vínculo (conta independente)",
  SERVIDOR: "Vincular a Servidor (Direção/Professor/Servidor Geral)",
  ESTUDANTE: "Vincular a Estudante",
};

interface VinculoPickerProps {
  value: VinculoSelection;
  onChange: (value: VinculoSelection) => void;
}

export function VinculoPicker({ value, onChange }: VinculoPickerProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<VinculoOption[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (value.tipo === "NENHUM" || value.id || query.trim().length < 2) {
      setOptions([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const results = await searchVinculosAction(value.tipo, query);
        setOptions(results);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [value.tipo, value.id, query]);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {/* Espelha o estado em campos nomeados, para o <form action={formAction}> nativo capturar
          o vínculo via FormData (este componente é controlado só em memória por fora). */}
      <input type="hidden" name="vinculoTipo" value={value.tipo} />
      <input type="hidden" name="vinculoId" value={value.id} />
      <select
        value={value.tipo}
        onChange={(e) => {
          const tipo = e.target.value as VinculoTipo;
          onChange({ tipo, id: "", nome: "", cpfDigits: null });
          setQuery("");
          setOptions([]);
        }}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        {Object.entries(TIPO_LABEL).map(([tipo, label]) => (
          <option key={tipo} value={tipo}>
            {label}
          </option>
        ))}
      </select>

      {value.tipo !== "NENHUM" && (
        <div className="relative">
          {value.id ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <span className="truncate">{value.nome}</span>
              <button
                type="button"
                onClick={() => {
                  onChange({ ...value, id: "", nome: "", cpfDigits: null });
                  setQuery("");
                }}
                className="ml-2 shrink-0 text-xs text-emerald-700 underline"
              >
                trocar
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, CPF ou matrícula..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              {isPending && <p className="mt-1 text-xs text-slate-400">Buscando...</p>}
              {options.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {options.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ tipo: value.tipo, id: o.id, nome: o.nome, cpfDigits: o.cpfDigits });
                          setOptions([]);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        {o.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
