"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { resetPasswordToBirthDateAction, setPasswordAction } from "./actions";

export function ResetPasswordButton({ userId, temOrigem }: { userId: string; temOrigem: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleClick() {
    setErro(null);

    if (temOrigem) {
      if (!confirm("Redefinir a senha para a data de nascimento cadastrada na origem (SIGEduc)?")) return;
      startTransition(async () => {
        const result = await resetPasswordToBirthDateAction(userId);
        if (result.error) {
          setErro(result.error);
        } else {
          alert(`Senha redefinida. Informe ao usuário a nova senha: ${result.novaSenha}`);
        }
      });
      return;
    }

    const novaSenha = window.prompt("Esta conta não tem data de nascimento de origem. Digite a nova senha (mín. 4 caracteres):");
    if (!novaSenha) return;
    startTransition(async () => {
      const result = await setPasswordAction(userId, novaSenha);
      if (result.error) {
        setErro(result.error);
      } else {
        alert(`Senha redefinida. Informe ao usuário a nova senha: ${result.novaSenha}`);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="flex items-center gap-1 text-brand-700 hover:underline disabled:opacity-50"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Redefinir senha
      </button>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
