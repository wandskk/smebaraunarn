"use client";

import { useFormState, useFormStatus } from "react-dom";
import { KeyRound } from "lucide-react";
import { changePasswordAction, type ChangePasswordState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: ChangePasswordState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? "Salvando..." : "Alterar senha"}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="Senha atual" htmlFor="senhaAtual">
        <Input id="senhaAtual" name="senhaAtual" type="password" required />
      </FormField>
      <FormField label="Nova senha" htmlFor="novaSenha">
        <Input id="novaSenha" name="novaSenha" type="password" required minLength={4} />
      </FormField>
      <FormField label="Confirmar nova senha" htmlFor="confirmarSenha">
        <Input id="confirmarSenha" name="confirmarSenha" type="password" required minLength={4} />
      </FormField>

      {state.error && (
        <div className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-foreground">{state.error}</div>
      )}
      {state.success && (
        <div className="flex items-center gap-2 rounded-lg bg-success-subtle px-3 py-2 text-sm text-success-subtle-foreground">
          <KeyRound className="h-4 w-4" />
          Senha alterada com sucesso.
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
