"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createAvaliacaoAction, type FormState } from "../actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? "Salvando..." : "Criar Avaliação"}
    </Button>
  );
}

export function AvaliacaoForm() {
  const [state, formAction] = useFormState(createAvaliacaoAction, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Código" htmlFor="codigo">
          <Input id="codigo" name="codigo" required placeholder="FLUENCIA-2025.1" />
        </FormField>
        <FormField label="Ano" htmlFor="ano">
          <Input id="ano" name="ano" type="number" required defaultValue={new Date().getFullYear()} />
        </FormField>
      </div>

      <FormField label="Nome" htmlFor="nome">
        <Input id="nome" name="nome" required placeholder="Fluência Leitora - 1º Semestre" />
      </FormField>

      <FormField label="Tipo" htmlFor="tipo">
        <Select id="tipo" name="tipo">
          <option value="FLUENCIA_LEITORA">Fluência Leitora</option>
          <option value="SPADEB">SPADEB</option>
          <option value="SIMULADO">Simulado</option>
          <option value="PROVA_MUNICIPAL">Prova Municipal</option>
        </Select>
      </FormField>

      <FormField label="Etapa de Ensino" htmlFor="etapaEnsino">
        <Input id="etapaEnsino" name="etapaEnsino" placeholder="Ex: 5º ano do Ensino Fundamental" />
      </FormField>

      <FormField label="Descrição" htmlFor="descricao">
        <Textarea id="descricao" name="descricao" rows={3} />
      </FormField>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox name="ativo" defaultChecked />
        Avaliação ativa
      </label>

      {state.error && (
        <div className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-foreground">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
