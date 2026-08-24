"use client";

import { useFormState, useFormStatus } from "react-dom";
import { registrarResultadoAction, type FormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Registrar Resultado"}
    </Button>
  );
}

interface QuestaoResumo {
  numero: number;
  descritor: string | null;
}

export function ResultadoForm({ avaliacaoId, questoes = [] }: { avaliacaoId: string; questoes?: QuestaoResumo[] }) {
  const boundAction = registrarResultadoAction.bind(null, avaliacaoId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      <Input name="matriculaOuCpf" placeholder="Matrícula ou CPF do aluno" required />
      <Input name="turma" placeholder="Turma" required />
      <Input name="pontuacao" type="number" step="0.1" placeholder="Pontuação" />
      <Select name="nivelDesempenho" defaultValue="">
        <option value="">Nível de desempenho (opcional)</option>
        <option value="NAO_LEITOR">Não leitor</option>
        <option value="LEITOR_DE_SILABAS">Leitor de sílabas</option>
        <option value="LEITOR_DE_PALAVRAS">Leitor de palavras</option>
        <option value="LEITOR_DE_FRASES">Leitor de frases</option>
        <option value="LEITOR_SEM_FLUENCIA">Leitor sem fluência</option>
        <option value="LEITOR_FLUENTE">Leitor fluente</option>
      </Select>
      <Input name="palavrasPorMin" type="number" placeholder="Palavras por minuto" />
      <Input name="observacoes" placeholder="Observações" />

      {questoes.length > 0 && (
        <div className="col-span-full">
          <div className="mb-1 text-xs font-medium text-foreground-muted">
            Resposta por questão (opcional — habilita a análise por item/descritor)
          </div>
          <div className="grid gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {questoes.map((q) => (
              <Input
                key={q.numero}
                name={`resposta_${q.numero}`}
                placeholder={`Q${q.numero}${q.descritor ? ` (${q.descritor})` : ""}`}
                maxLength={5}
              />
            ))}
          </div>
        </div>
      )}

      <div className="sm:col-span-3">
        <SubmitButton />
      </div>
      {state.error && <p className="col-span-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
