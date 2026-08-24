"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { addQuestaoAction, updateQuestaoAction, type FormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: FormState = { error: null };

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

interface QuestaoInicial {
  id: string;
  numero: number;
  enunciado: string | null;
  descritor: string | null;
  gabaritoCorreto: string | null;
  peso: number;
}

/** Mesmo formulário serve para criar (sem `questao`) e editar (com `questao`) — evita duplicar os 5 campos. */
export function QuestaoForm({
  avaliacaoId,
  questao,
  cancelHref,
}: {
  avaliacaoId: string;
  questao?: QuestaoInicial;
  cancelHref?: string;
}) {
  const boundAction = questao
    ? updateQuestaoAction.bind(null, avaliacaoId, questao.id)
    : addQuestaoAction.bind(null, avaliacaoId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-5">
      <Input name="numero" type="number" placeholder="Nº" defaultValue={questao?.numero} required />
      <Input name="descritor" placeholder="Descritor (ex: D04)" defaultValue={questao?.descritor ?? ""} />
      <Input name="gabaritoCorreto" placeholder="Gabarito (A/B/C/D)" defaultValue={questao?.gabaritoCorreto ?? ""} />
      <Input name="peso" type="number" step="0.1" defaultValue={questao?.peso ?? 1} placeholder="Peso" />
      <div className="flex gap-2">
        <SubmitButton label={questao ? "Salvar" : "Adicionar Questão"} pendingLabel={questao ? "Salvando..." : "Adicionando..."} />
        {cancelHref && (
          <Link href={cancelHref} className="inline-flex items-center text-sm text-foreground-muted hover:underline">
            Cancelar
          </Link>
        )}
      </div>
      <Input name="enunciado" placeholder="Enunciado (opcional)" defaultValue={questao?.enunciado ?? ""} className="col-span-full" />
      {state.error && <p className="col-span-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
