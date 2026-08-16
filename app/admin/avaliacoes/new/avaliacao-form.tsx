"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createAvaliacaoAction, type FormState } from "../actions";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Criar Avaliação"}
    </button>
  );
}

export function AvaliacaoForm() {
  const [state, formAction] = useFormState(createAvaliacaoAction, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Código</label>
          <input
            name="codigo"
            required
            placeholder="FLUENCIA-2025.1"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Ano</label>
          <input
            name="ano"
            type="number"
            required
            defaultValue={new Date().getFullYear()}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
        <input
          name="nome"
          required
          placeholder="Fluência Leitora - 1º Semestre"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
        <select
          name="tipo"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="FLUENCIA_LEITORA">Fluência Leitora</option>
          <option value="SPADEB">SPADEB</option>
          <option value="SIMULADO">Simulado</option>
          <option value="PROVA_MUNICIPAL">Prova Municipal</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Etapa de Ensino</label>
        <input
          name="etapaEnsino"
          placeholder="Ex: 5º ano do Ensino Fundamental"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
        <textarea
          name="descricao"
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="ativo" defaultChecked className="rounded" />
        Avaliação ativa
      </label>

      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <SubmitButton />
    </form>
  );
}
