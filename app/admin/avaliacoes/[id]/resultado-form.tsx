"use client";

import { useFormState, useFormStatus } from "react-dom";
import { registrarResultadoAction, type FormState } from "../actions";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Registrar Resultado"}
    </button>
  );
}

export function ResultadoForm({ avaliacaoId }: { avaliacaoId: string }) {
  const boundAction = registrarResultadoAction.bind(null, avaliacaoId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      <input
        name="matriculaOuCpf"
        placeholder="Matrícula ou CPF do aluno"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="turma"
        placeholder="Turma"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="pontuacao"
        type="number"
        step="0.1"
        placeholder="Pontuação"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <select name="nivelDesempenho" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <option value="">Nível de desempenho (opcional)</option>
        <option value="NAO_LEITOR">Não leitor</option>
        <option value="LEITOR_DE_SILABAS">Leitor de sílabas</option>
        <option value="LEITOR_DE_PALAVRAS">Leitor de palavras</option>
        <option value="LEITOR_DE_FRASES">Leitor de frases</option>
        <option value="LEITOR_SEM_FLUENCIA">Leitor sem fluência</option>
        <option value="LEITOR_FLUENTE">Leitor fluente</option>
      </select>
      <input
        name="palavrasPorMin"
        type="number"
        placeholder="Palavras por minuto"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="observacoes"
        placeholder="Observações"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="sm:col-span-3">
        <SubmitButton />
      </div>
      {state.error && <p className="col-span-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
