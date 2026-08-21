"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addQuestaoAction, type FormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adicionando..." : "Adicionar Questão"}
    </Button>
  );
}

export function QuestaoForm({ avaliacaoId }: { avaliacaoId: string }) {
  const boundAction = addQuestaoAction.bind(null, avaliacaoId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-5">
      <Input name="numero" type="number" placeholder="Nº" required />
      <Input name="descritor" placeholder="Descritor (ex: D04)" />
      <Input name="gabaritoCorreto" placeholder="Gabarito (A/B/C/D)" />
      <Input name="peso" type="number" step="0.1" defaultValue={1} placeholder="Peso" />
      <SubmitButton />
      <Input name="enunciado" placeholder="Enunciado (opcional)" className="col-span-full" />
      {state.error && <p className="col-span-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
