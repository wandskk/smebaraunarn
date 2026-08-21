import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCpf } from "@/lib/utils";
import type { VinculoSelection } from "../vinculo-picker";
import { EditVinculoForm } from "./edit-vinculo-form";
import { PageHeader } from "@/components/ui/page-header";
import { Card, SectionCard } from "@/components/ui/card";

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
      <PageHeader
        breadcrumbs={
          <Link href="/admin/usuarios" className="text-primary hover:underline">
            ← Voltar
          </Link>
        }
        title={`Editar acesso — ${user.nome}`}
      />

      <Card className="mt-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-foreground-muted">CPF</dt>
            <dd className="font-medium text-foreground">{formatCpf(user.cpf)}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Papel atual</dt>
            <dd className="font-medium text-foreground">{ROLE_LABEL[user.role] ?? user.role}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Criado em</dt>
            <dd className="font-medium text-foreground">{user.createdAt.toLocaleDateString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Status</dt>
            <dd className="font-medium text-foreground">{user.ativo ? "Ativo" : "Inativo"}</dd>
          </div>
        </dl>
      </Card>

      <SectionCard
        title="Vínculo com Servidor/Estudante"
        description="Corrige contas manuais criadas antes de existir vínculo, ou troca o vínculo de uma conta existente. Ao salvar, CPF, nome, papel e escola são recalculados a partir do registro selecionado (a conta passa a se comportar como um acesso automático — o próximo login já reflete qualquer mudança futura de cargo/escola na origem)."
        className="mt-6 max-w-2xl"
      >
        <EditVinculoForm userId={user.id} vinculoAtual={vinculoAtual} />
      </SectionCard>
    </div>
  );
}
