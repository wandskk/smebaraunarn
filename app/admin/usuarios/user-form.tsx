"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createUserAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Criando..." : "Criar Acesso"}
    </button>
  );
}

export function UserForm() {
  const [state, formAction] = useFormState(createUserAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      <input name="cpf" placeholder="CPF" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input
        name="nome"
        placeholder="Nome completo"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail (opcional)"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <select name="role" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <option value="ADMIN">Administrador</option>
        <option value="SECRETARIA">Secretaria</option>
        <option value="DIRETOR">Diretor(a)</option>
        <option value="PROFESSOR">Professor(a)</option>
        <option value="SERVIDOR_GERAL">Servidor Geral</option>
        <option value="ALUNO">Aluno / Responsável</option>
      </select>
      <input
        name="senha"
        type="password"
        placeholder="Senha personalizada"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div>
        <SubmitButton />
      </div>
      {state.error && <p className="col-span-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
