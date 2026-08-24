import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCpf } from "@/lib/utils";
import { classifyServidorRole, explicarClassificacaoServidorRole } from "@/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Card, SectionCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

interface PageProps {
  params: { id: string };
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  SECRETARIA: "Secretaria",
  DIRETOR: "Direção",
  PROFESSOR: "Professor(a)",
  SERVIDOR_GERAL: "Servidor Geral",
  ALUNO: "Aluno / Responsável",
};

/**
 * Ficha funcional do servidor — achado P0 do documento de Admin
 * ("nova rota /admin/servidores/[id] com dados funcionais, contato, escola,
 * turmas/disciplinas/turno/carga e status de acesso ao portal"). Antes
 * desta etapa a rota não existia; a lista em /admin/servidores não linkava
 * para nenhum detalhe.
 */
export default async function AdminServidorDetalhePage({ params }: PageProps) {
  const servidorId = Number(params.id);
  const [servidor, usuario] = await Promise.all([
    prisma.servidor.findUnique({
      where: { id: servidorId },
      include: { escola: true, turmas: { orderBy: { turma: "asc" } } },
    }),
    prisma.user.findFirst({ where: { servidorId } }),
  ]);
  if (!servidor) notFound();

  const papel = classifyServidorRole(servidor.cargo, servidor.funcao);
  const explicacaoPapel = explicarClassificacaoServidorRole(servidor.cargo, servidor.funcao);

  // "Escola da origem" (o que o SIGEduc informou, campo escolaNome) pode
  // divergir de "escola atribuída manualmente" (servidor.escola, editável em
  // /admin/servidores) — cargos de Direção/Coordenação em particular vêm
  // sem escola na origem (ficam lotados na Secretaria). Mostrar os dois
  // quando divergem evita a Secretaria achar que um é erro do outro.
  const escolaOrigemDivergente =
    servidor.escolaNome && servidor.escolaNome.trim() !== "" && servidor.escolaNome !== servidor.escola?.nome;

  return (
    <div>
      <PageHeader
        breadcrumbs={
          <Link href="/admin/servidores" className="text-primary hover:underline">
            ← Servidores
          </Link>
        }
        title={servidor.nome}
        description={`${servidor.cargo ?? "Cargo não informado"}${servidor.funcao ? ` · ${servidor.funcao}` : ""}`}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <dt className="text-xs text-foreground-muted">CPF</dt>
          <dd className="text-sm font-medium text-foreground">{formatCpf(servidor.cpf)}</dd>
        </Card>
        <Card>
          <dt className="text-xs text-foreground-muted">Matrícula</dt>
          <dd className="text-sm font-medium text-foreground">{servidor.matricula ?? "-"}</dd>
        </Card>
        <Card>
          <dt className="text-xs text-foreground-muted">Tipo de vínculo</dt>
          <dd className="text-sm font-medium text-foreground">{servidor.tipoVinculo ?? "-"}</dd>
        </Card>
        <Card>
          <dt className="text-xs text-foreground-muted">Status</dt>
          <dd className="text-sm font-medium text-foreground">{servidor.status ?? "-"}</dd>
        </Card>
      </div>

      <SectionCard
        title="Papel no portal"
        description={explicacaoPapel}
        className="mt-6"
      >
        <Badge variant="info">{ROLE_LABEL[papel]}</Badge>
      </SectionCard>

      <SectionCard title="Contato" className="mt-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-foreground-muted">E-mail</dt>
            <dd className="text-foreground">{servidor.email ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Telefone</dt>
            <dd className="text-foreground">{servidor.telefone ?? "-"}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Escola" className="mt-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-foreground-muted">Escola atribuída</dt>
            <dd className="text-foreground">
              {servidor.escola ? (
                <Link href={`/admin/escolas/${servidor.escola.id}`} className="text-primary hover:underline">
                  {servidor.escola.nome}
                </Link>
              ) : (
                "Não vinculada"
              )}
            </dd>
          </div>
          {escolaOrigemDivergente && (
            <div>
              <dt className="text-foreground-muted">Escola na origem (SIGEduc)</dt>
              <dd className="text-foreground-muted">
                {servidor.escolaNome}
                <span className="ml-2 text-xs text-warning-subtle-foreground">
                  difere da atribuição manual acima
                </span>
              </dd>
            </div>
          )}
        </dl>
        {!servidor.escola && papel === "DIRETOR" && (
          <p className="mt-3 rounded-lg bg-info-subtle px-3 py-2 text-xs text-info-subtle-foreground">
            Cargos de Direção/Coordenação costumam vir sem escola na origem (ficam lotados na Secretaria) —
            atribua a escola manualmente em{" "}
            <Link href="/admin/servidores" className="underline">
              Servidores
            </Link>
            .
          </p>
        )}
      </SectionCard>

      <SectionCard title="Turmas, disciplinas e carga" className="mt-6">
        {servidor.turmas.length === 0 ? (
          <p className="text-sm text-foreground-muted">Nenhuma turma vinculada.</p>
        ) : (
          <DataTable>
            <TableHeader>
              <tr>
                <TableHeadCell>Turma</TableHeadCell>
                <TableHeadCell>Série</TableHeadCell>
                <TableHeadCell>Turno</TableHeadCell>
                <TableHeadCell>Disciplina</TableHeadCell>
                <TableHeadCell>Carga (h)</TableHeadCell>
              </tr>
            </TableHeader>
            <TableBody>
              {servidor.turmas.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-foreground">{t.turma}</TableCell>
                  <TableCell className="text-foreground-muted">{t.serie ?? "-"}</TableCell>
                  <TableCell className="text-foreground-muted">{t.turno ?? "-"}</TableCell>
                  <TableCell className="text-foreground-muted">{t.disciplina ?? "-"}</TableCell>
                  <TableCell className="text-foreground-muted">{t.cargaTrabalho ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        )}
      </SectionCard>

      <SectionCard title="Acesso ao portal" className="mt-6">
        {usuario ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-foreground-muted">Papel</dt>
              <dd className="text-foreground">{ROLE_LABEL[usuario.role] ?? usuario.role}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Status</dt>
              <dd>
                <Badge variant={usuario.ativo ? "success" : "neutral"}>{usuario.ativo ? "Ativo" : "Inativo"}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Gerenciar acesso</dt>
              <dd>
                <Link href={`/admin/usuarios/${usuario.id}`} className="text-primary hover:underline">
                  Ver em Usuários e Acessos →
                </Link>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-foreground-muted">
            Nenhum acesso provisionado ainda. Uma conta é criada automaticamente no primeiro login (CPF + data de
            nascimento) ou pode ser provisionada manualmente em{" "}
            <Link href="/admin/usuarios" className="text-primary hover:underline">
              Usuários e Acessos
            </Link>
            .
          </p>
        )}
      </SectionCard>
    </div>
  );
}
