import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatTurmaLabel, getTurmaDetalhe } from "@/lib/queries/academico";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

interface PageProps {
  params: { id: string; turma: string };
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function AdminTurmaDetalhePage({ params, searchParams }: PageProps) {
  const escolaId = Number(params.id);
  const escola = await prisma.escola.findUnique({ where: { id: escolaId } });
  if (!escola) notFound();

  const turma = decodeURIComponent(params.turma);
  const anoAtual = new Date().getFullYear();
  const detalhe = await getTurmaDetalhe(escolaId, turma, anoAtual);

  const q = searchParams.q?.trim().toLowerCase();
  const alunosFiltrados = q
    ? detalhe.alunos.filter(
        (a) => a.nome.toLowerCase().includes(q) || a.matricula.toLowerCase().includes(q),
      )
    : detalhe.alunos;
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);
  const alunosPagina = alunosFiltrados.slice(skip, skip + take);

  return (
    <div>
      <PageHeader
        breadcrumbs={
          <Link href={`/admin/escolas/${escolaId}`} className="text-primary hover:underline">
            ← {escola.nome}
          </Link>
        }
        title={formatTurmaLabel(detalhe.serie, turma)}
        description={
          <>
            {detalhe.serie && <span className="text-foreground-muted/70">{turma} · </span>}
            {detalhe.alunos.length} aluno(s) enturmado(s).
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-2xl font-semibold text-foreground">
            {detalhe.frequencia.percentual !== null ? `${detalhe.frequencia.percentual.toFixed(1)}%` : "-"}
          </div>
          <div className="text-xs text-foreground-muted">Frequência da turma</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold text-foreground">{detalhe.frequencia.totalFaltas}</div>
          <div className="text-xs text-foreground-muted">Faltas registradas</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold text-foreground">{detalhe.notasPorDisciplina.length}</div>
          <div className="text-xs text-foreground-muted">Disciplinas com notas ({anoAtual})</div>
        </Card>
      </div>

      {detalhe.notasPorDisciplina.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold text-foreground">Médias por disciplina</h2>
          <div className="mt-3">
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Disciplina</TableHeadCell>
                  <TableHeadCell>Notas lançadas</TableHeadCell>
                  <TableHeadCell>Média</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {detalhe.notasPorDisciplina.map((n) => (
                  <TableRow key={n.disciplina}>
                    <TableCell className="font-medium text-foreground">{n.disciplina}</TableCell>
                    <TableCell className="text-foreground-muted">{n.quantidade}</TableCell>
                    <TableCell className="text-foreground">{n.media.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm font-semibold text-foreground">Alunos</h2>
      {detalhe.alunos.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-muted">
          Nenhum aluno enturmado nesta turma.
        </p>
      ) : (
        <>
          <ListToolbar searchPlaceholder="Buscar por nome ou matrícula..." />
          {alunosPagina.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-muted">
              Nenhum aluno encontrado.
            </p>
          ) : (
            <div className="mt-3">
              <DataTable>
                <TableHeader>
                  <tr>
                    <TableHeadCell>Nome</TableHeadCell>
                    <TableHeadCell>Matrícula</TableHeadCell>
                    <TableHeadCell>Responsável</TableHeadCell>
                    <TableHeadCell className="text-right">Ações</TableHeadCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {alunosPagina.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell className="font-medium text-foreground">{aluno.nome}</TableCell>
                      <TableCell className="text-foreground-muted">{aluno.matricula}</TableCell>
                      <TableCell className="text-foreground-muted">{aluno.nomeResponsavel ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/estudantes/${aluno.id}`} className="text-primary hover:underline">
                          Ver detalhes
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPagesFor(alunosFiltrados.length, pageSize)}
            basePath={`/admin/escolas/${escolaId}/turmas/${params.turma}`}
            searchParams={searchParams}
          />
        </>
      )}
    </div>
  );
}
