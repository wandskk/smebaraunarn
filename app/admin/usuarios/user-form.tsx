"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createUserAction, type FormState } from "./actions";
import { VinculoPicker, type VinculoSelection } from "./vinculo-picker";
import { formatCpf } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const initialState: FormState = { error: null };
const VINCULO_INICIAL: VinculoSelection = { tipo: "NENHUM", id: "", nome: "", cpfDigits: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Criando..." : "Criar Acesso"}
    </Button>
  );
}

export function UserForm() {
  const [state, formAction] = useFormState(createUserAction, initialState);
  const [vinculo, setVinculo] = useState<VinculoSelection>(VINCULO_INICIAL);
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");

  const vinculado = vinculo.tipo !== "NENHUM" && Boolean(vinculo.id);
  const cpfAutoPreenchido = vinculado && Boolean(vinculo.cpfDigits);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      <Input
        name="cpf"
        placeholder="CPF"
        required
        readOnly={cpfAutoPreenchido}
        value={cpfAutoPreenchido ? formatCpf(vinculo.cpfDigits!) : cpf}
        onChange={(e) => setCpf(e.target.value)}
        className={cpfAutoPreenchido ? "bg-surface-muted text-foreground-muted" : undefined}
      />
      <Input
        name="nome"
        placeholder="Nome completo"
        required
        readOnly={vinculado}
        value={vinculado ? vinculo.nome : nome}
        onChange={(e) => setNome(e.target.value)}
        className={vinculado ? "bg-surface-muted text-foreground-muted" : undefined}
      />
      <Input name="email" type="email" placeholder="E-mail (opcional)" />

      {vinculado ? (
        <div className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground-muted">
          Papel definido pelo vínculo
          <input type="hidden" name="role" value="ALUNO" />
        </div>
      ) : (
        <Select name="role" defaultValue="ADMIN">
          <option value="ADMIN">Administrador</option>
          <option value="SECRETARIA">Secretaria</option>
          <option value="DIRETOR">Diretor(a)</option>
          <option value="PROFESSOR">Professor(a)</option>
          <option value="SERVIDOR_GERAL">Servidor Geral</option>
          <option value="ALUNO">Aluno / Responsável</option>
        </Select>
      )}

      <Input name="senha" type="password" placeholder="Senha personalizada" required />

      <div className="sm:col-span-3">
        <VinculoPicker value={vinculo} onChange={setVinculo} />
        {vinculado && (
          <p className="mt-1 text-xs text-foreground-muted">
            Nome e papel preenchidos automaticamente a partir do vínculo selecionado.
            {vinculo.tipo === "ESTUDANTE" && !vinculo.cpfDigits && (
              <> Este estudante não tem CPF cadastrado na origem — informe o CPF que a família usará para entrar (ex.: CPF do responsável).</>
            )}
          </p>
        )}
      </div>

      <div>
        <SubmitButton />
      </div>
      {state.error && <p className="col-span-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
