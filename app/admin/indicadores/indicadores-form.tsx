"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateIndicadoresAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

interface Props {
  indicadores: {
    totalEscolas: number;
    totalAlunos: number;
    totalDocumentos: number;
    totalAcessos: number;
  };
}

export function IndicadoresForm({ indicadores }: Props) {
  const [state, formAction] = useFormState(updateIndicadoresAction, initialState);

  return (
    <form action={formAction} className="grid max-w-lg gap-4 sm:grid-cols-2">
      {(
        [
          ["totalEscolas", "Escolas Municipais"],
          ["totalAlunos", "Alunos Matriculados"],
          ["totalDocumentos", "Documentos Publicados"],
          ["totalAcessos", "Acessos ao Portal"],
        ] as const
      ).map(([name, label]) => (
        <div key={name}>
          <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
          <input
            name={name}
            type="number"
            min={0}
            defaultValue={indicadores[name]}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      ))}

      {state.error && (
        <div className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="col-span-full">
        <SubmitButton />
      </div>
    </form>
  );
}
