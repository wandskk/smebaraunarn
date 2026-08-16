"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createUserAction, type FormState } from "./actions";
import { VinculoPicker, type VinculoSelection } from "./vinculo-picker";
import { formatCpf } from "@/lib/utils";

const initialState: FormState = { error: null };
const VINCULO_INICIAL: VinculoSelection = { tipo: "NENHUM", id: "", nome: "", cpfDigits: null };

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
  const [vinculo, setVinculo] = useState<VinculoSelection>(VINCULO_INICIAL);
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");

  const vinculado = vinculo.tipo !== "NENHUM" && Boolean(vinculo.id);
  const cpfAutoPreenchido = vinculado && Boolean(vinculo.cpfDigits);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      <input
        name="cpf"
        placeholder="CPF"
        required
        readOnly={cpfAutoPreenchido}
        value={cpfAutoPreenchido ? formatCpf(vinculo.cpfDigits!) : cpf}
        onChange={(e) => setCpf(e.target.value)}
        className={`rounded-lg border border-slate-300 px-3 py-2 text-sm ${
          cpfAutoPreenchido ? "bg-slate-50 text-slate-500" : ""
        }`}
      />
      <input
        name="nome"
        placeholder="Nome completo"
        required
        readOnly={vinculado}
        value={vinculado ? vinculo.nome : nome}
        onChange={(e) => setNome(e.target.value)}
        className={`rounded-lg border border-slate-300 px-3 py-2 text-sm ${
          vinculado ? "bg-slate-50 text-slate-500" : ""
        }`}
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail (opcional)"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {vinculado ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          Papel definido pelo vínculo
          <input type="hidden" name="role" value="ALUNO" />
        </div>
      ) : (
        <select name="role" defaultValue="ADMIN" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="ADMIN">Administrador</option>
          <option value="SECRETARIA">Secretaria</option>
          <option value="DIRETOR">Diretor(a)</option>
          <option value="PROFESSOR">Professor(a)</option>
          <option value="SERVIDOR_GERAL">Servidor Geral</option>
          <option value="ALUNO">Aluno / Responsável</option>
        </select>
      )}

      <input
        name="senha"
        type="password"
        placeholder="Senha personalizada"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="sm:col-span-3">
        <VinculoPicker value={vinculo} onChange={setVinculo} />
        {vinculado && (
          <p className="mt-1 text-xs text-slate-500">
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
      {state.error && <p className="col-span-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
