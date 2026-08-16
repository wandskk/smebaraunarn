import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCpf } from "@/lib/utils";
import type { VinculoSelection } from "../vinculo-picker";
import { EditVinculoForm } from "./edit-vinculo-form";

interface PageProps {
  params: { id: string };
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  SECRETARIA: "Secretaria",
  DIRETOR: "Diretor(a)",
  PROFESSOR: "Professor(a)",
  SERVIDOR_GERAL: "Servidor Geral",
  ALUNO: "Aluno / Responsável",
};

export default async function EditarUsuarioPage({ params }: PageProps) {
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) notFound();

  let vinculoAtual: VinculoSelection = { tipo: "NENHUM", id: "", nome: "", cpfDigits: null };
  if (user.servidorId) {
    const servidor = await prisma.servidor.findUnique({ where: { id: user.servidorId } });
    if (servidor) {
      vinculoAtual = { tipo: "SERVIDOR", id: String(servidor.id), nome: servidor.nome, cpfDigits: servidor.cpf };
    }
  } else if (user.estudanteId) {
    const estudante = await prisma.estudante.findUnique({ where: { id: user.estudanteId } });
    if (estudante) {
      vinculoAtual = { tipo: "ESTUDANTE", id: String(estudante.id), nome: estudante.nome, cpfDigits: estudante.cpf };
    }
  }

  return (
    <div>
      <Link href="/admin/usuarios" className="text-sm text-brand-700 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">Editar acesso — {user.nome}</h1>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">CPF</dt>
          <dd className="font-medium text-slate-900">{formatCpf(user.cpf)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Papel atual</dt>
          <dd className="font-medium text-slate-900">{ROLE_LABEL[user.role] ?? user.role}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Criado em</dt>
          <dd className="font-medium text-slate-900">{user.createdAt.toLocaleDateString("pt-BR")}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium text-slate-900">{user.ativo ? "Ativo" : "Inativo"}</dd>
        </div>
      </dl>

      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Vínculo com Servidor/Estudante</h2>
        <p className="mb-3 text-xs text-slate-500">
          Corrige contas manuais criadas antes de existir vínculo, ou troca o vínculo de uma conta
          existente. Ao salvar, CPF, nome, papel e escola são recalculados a partir do registro
          selecionado (a conta passa a se comportar como um acesso automático — o próximo login já
          reflete qualquer mudança futura de cargo/escola na origem).
        </p>
        <EditVinculoForm userId={user.id} vinculoAtual={vinculoAtual} />
      </div>
    </div>
  );
}
