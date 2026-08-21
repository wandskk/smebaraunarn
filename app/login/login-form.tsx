"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { Lock, User } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const [cpf, setCpf] = useState("");

  function handleCpfChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 9) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    } else if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }
    setCpf(formatted);
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="CPF" htmlFor="cpf">
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            id="cpf"
            name="cpf"
            type="text"
            inputMode="numeric"
            required
            value={cpf}
            onChange={handleCpfChange}
            placeholder="000.000.000-00"
            className="pl-10"
          />
        </div>
      </FormField>

      <FormField
        label="Senha (data de nascimento)"
        htmlFor="senha"
        hint="No primeiro acesso, use sua data de nascimento completa como senha."
      >
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input id="senha" name="senha" type="password" required placeholder="DD/MM/AAAA" className="pl-10" />
        </div>
      </FormField>

      {state.error && (
        <div className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-foreground">{state.error}</div>
      )}

      <SubmitButton />
    </form>
  );
}
