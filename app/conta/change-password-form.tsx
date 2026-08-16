"use client";

import { useFormState, useFormStatus } from "react-dom";
import { KeyRound } from "lucide-react";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Alterar senha"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Senha atual</label>
        <input
          name="senhaAtual"
          type="password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nova senha</label>
        <input
          name="novaSenha"
          type="password"
          required
          minLength={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Confirmar nova senha</label>
        <input
          name="confirmarSenha"
          type="password"
          required
          minLength={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      {state.success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <KeyRound className="h-4 w-4" />
          Senha alterada com sucesso.
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
