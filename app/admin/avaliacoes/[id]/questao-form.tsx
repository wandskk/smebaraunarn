"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addQuestaoAction, type FormState } from "../actions";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Adicionando..." : "Adicionar Questão"}
    </button>
  );
}

export function QuestaoForm({ avaliacaoId }: { avaliacaoId: string }) {
  const boundAction = addQuestaoAction.bind(null, avaliacaoId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-5">
      <input
        name="numero"
        type="number"
        placeholder="Nº"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="descritor"
        placeholder="Descritor (ex: D04)"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="gabaritoCorreto"
        placeholder="Gabarito (A/B/C/D)"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="peso"
        type="number"
        step="0.1"
        defaultValue={1}
        placeholder="Peso"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <SubmitButton />
      <input
        name="enunciado"
        placeholder="Enunciado (opcional)"
        className="col-span-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state.error && <p className="col-span-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
