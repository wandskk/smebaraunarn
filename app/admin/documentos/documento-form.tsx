"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createDocumentoAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Publicando..." : "Publicar Documento"}
    </button>
  );
}

export function DocumentoForm() {
  const [state, formAction] = useFormState(createDocumentoAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input
        name="titulo"
        placeholder="Título do documento"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
      />
      <input
        name="categoria"
        placeholder="Categoria (Portaria, Edital, Calendário...)"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="tamanho"
        placeholder="Tamanho (ex: 1.2 MB) — preenchido automaticamente ao enviar arquivo"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">Arquivo (PDF)</label>
        <input
          name="arquivoFile"
          type="file"
          accept="application/pdf,.pdf"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        <input
          name="arquivoUrl"
          placeholder="ou cole a URL do arquivo"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        name="descricao"
        placeholder="Descrição (opcional)"
        rows={2}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
      />
      <div>
        <SubmitButton />
      </div>
      {state.error && <p className="col-span-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
